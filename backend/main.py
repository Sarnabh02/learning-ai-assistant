"""
LearnAI Python Backend
FastAPI server exposing three endpoints:
  POST /orchestrate   — SSE-streaming multi-agent learning session
  POST /socratic      — Single-turn Socratic dialogue (LangGraph)
  POST /assess-answer — Answer quality assessment
"""

import json
import uuid
import os
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv

load_dotenv()

from models.types import SocraticRequest, AssessAnswerRequest, SummaryRequest, TutorRequest
from generators.pdf_generator import generate_summary_pdf
from agents.orchestration_graph import build_orchestration_graph, OrchestrationState
from agents.socratic_graph import build_socratic_graph, SocraticState
from agents.tutor_graph import build_tutor_graph, TutorState
from agents.assessment_agent import assess_answer as run_assessment
from agents.llm_client import get_available_models, DEFAULT_MODEL
from parsers.pdf_parser import parse_pdf_bytes
from parsers.pptx_parser import parse_pptx_bytes

# ---------- App setup ----------

app = FastAPI(title="LearnAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build compiled LangGraph graphs once at startup (they are stateless and reusable)
_orchestration_graph = build_orchestration_graph()
_socratic_graph = build_socratic_graph()
_tutor_graph = build_tutor_graph()


# ---------- SSE helper ----------

def _sse(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# ---------- Routes ----------

@app.get("/health")
def health():
    return {"status": "ok", "service": "learnai-backend"}


@app.get("/models")
def list_models():
    """Return available AI models for selection."""
    return {"models": get_available_models()}


@app.post("/orchestrate")
async def orchestrate(request: Request):
    """
    Multi-agent SSE orchestration.
    Accepts:
      - multipart/form-data: { file?: UploadFile, topic?: str }
      - application/json:    { topic?: str, documentText?: str, fileName?: str }

    Streams SSE events:
      stage    — progress updates between nodes
      intake   — LearningIntent after stage 1
      breakdown — FirstPrinciplesBreakdown after stage 2
      problems — PracticeSet after stage 3
      ready    — final event with sessionId
      error    — on any failure
    """
    content_type = request.headers.get("content-type", "")

    topic: Optional[str] = None
    doc_text: Optional[str] = None
    file_name: Optional[str] = None
    model: Optional[str] = None

    if "multipart/form-data" in content_type:
        form = await request.form()
        topic = form.get("topic")  # type: ignore[assignment]
        doc_text = form.get("documentText")  # type: ignore[assignment]
        file_name = form.get("fileName")  # type: ignore[assignment]
        model = form.get("model")  # type: ignore[assignment]
        uploaded = form.get("file")

        if uploaded and hasattr(uploaded, "read"):
            file_name = uploaded.filename  # type: ignore[union-attr]
            raw_bytes = await uploaded.read()  # type: ignore[union-attr]
            fname_lower = (file_name or "").lower()
            if fname_lower.endswith(".pdf"):
                text, err = parse_pdf_bytes(raw_bytes)
                if err or not text:
                    raise HTTPException(422, detail=err or "No extractable text in PDF")
                doc_text = text
            elif fname_lower.endswith(".pptx"):
                text, err = parse_pptx_bytes(raw_bytes)
                if err or not text:
                    raise HTTPException(422, detail=err or "No text in presentation")
                doc_text = text
            else:
                raise HTTPException(
                    400, detail="Unsupported file type. Upload a PDF or PPTX."
                )

    elif "application/json" in content_type:
        body = await request.json()
        topic = body.get("topic")
        doc_text = body.get("documentText")
        file_name = body.get("fileName")
        model = body.get("model")
    else:
        raise HTTPException(415, detail="Unsupported content type")

    if not topic and not doc_text:
        raise HTTPException(400, detail="Provide either a topic or a document file")

    session_id = str(uuid.uuid4())

    initial_state: OrchestrationState = {
        "topic": topic,
        "document_text": doc_text,
        "file_name": file_name,
        "model": model or DEFAULT_MODEL,
        "learning_intent": None,
        "breakdown": None,
        "practice_set": None,
        "session_id": session_id,
        "error": None,
    }

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            yield _sse("stage", {
                "stage": "intake",
                "status": "start",
                "message": "Analyzing your learning request...",
            })

            async for chunk in _orchestration_graph.astream(
                initial_state, stream_mode="updates"
            ):
                for node_name, node_output in chunk.items():

                    if node_name == "intake":
                        intent = node_output.get("learning_intent")
                        if intent:
                            yield _sse("intake", intent)
                        yield _sse("stage", {
                            "stage": "breakdown",
                            "status": "start",
                            "message": "Building first principles breakdown...",
                        })

                    elif node_name == "breakdown":
                        err = node_output.get("error")
                        if err:
                            yield _sse("error", {"code": "breakdown_error", "message": err})
                            return
                        breakdown = node_output.get("breakdown")
                        if breakdown:
                            yield _sse("breakdown", {"breakdown": breakdown})
                        yield _sse("stage", {
                            "stage": "problems",
                            "status": "start",
                            "message": "Generating practice problems...",
                        })

                    elif node_name == "problems":
                        practice_set = node_output.get("practice_set")
                        if practice_set:
                            yield _sse("problems", {"practiceSet": practice_set})

            yield _sse("ready", {"sessionId": session_id})

        except Exception as exc:
            yield _sse("error", {
                "code": "orchestration_error",
                "message": str(exc),
            })

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/socratic")
async def socratic(request: SocraticRequest):
    """
    Single-turn Socratic dialogue.
    Runs the 4-node LangGraph: identify_goal → extract_variables →
    rank_principles → generate_question.
    """
    breakdown_principles: list[dict] = []
    if request.breakdown:
        breakdown_principles = request.breakdown.get("firstPrinciples", [])

    initial_state: SocraticState = {
        "problem_statement": request.problemStatement,
        "user_message": request.userMessage,
        "conversation_history": request.conversationHistory,
        "turn_number": request.turnNumber,
        "breakdown_principles": breakdown_principles,
        "goal": None,
        "variables": None,
        "relevant_principles": [],
        "system_question": "",
        "intent": "goal_clarification",
        "principle_hinted": None,
    }

    # Collect the final merged state
    merged: dict = dict(initial_state)
    async for chunk in _socratic_graph.astream(initial_state, stream_mode="updates"):
        for _, node_output in chunk.items():
            merged.update(node_output)

    return {
        "session_id": request.sessionId,
        "turn_number": request.turnNumber,
        "system_question": merged.get("system_question", ""),
        "goal_identified": merged.get("goal"),
        "variables_extracted": merged.get("variables"),
        "principle_hinted": merged.get("principle_hinted"),
        "principle_revealed": merged.get("principle_hinted") is not None,
        "metadata": {
            "intent": merged.get("intent", "goal_clarification"),
            "should_reveal_hint": request.turnNumber >= 5,
        },
    }


@app.post("/assess-answer")
async def assess_answer_endpoint(request: AssessAnswerRequest):
    """Evaluate a student's answer to a practice problem."""
    assessment = await run_assessment(
        problem_statement=request.problemStatement,
        user_answer=request.userAnswer,
        breakdown=request.breakdown,
        hints_revealed=request.hintsRevealed,
    )
    return {"assessment": assessment}


@app.post("/tutor")
async def tutor(request: TutorRequest):
    """
    Single-turn Socratic tutoring dialogue.
    Runs the 3-node LangGraph: analyze_understanding → plan_next_step → generate_response.
    Never reveals the answer — guides students step by step toward discovering it themselves.
    """
    initial_state: TutorState = {
        "homework_question": request.homeworkQuestion,
        "conversation_history": request.conversationHistory,
        "turn_number": request.turnNumber,
        "model": request.model or DEFAULT_MODEL,
        "understanding_summary": None,
        "key_gap": None,
        "approach": "goal_clarification",
        "next_concept": None,
        "response": "",
    }

    merged: dict = dict(initial_state)
    async for chunk in _tutor_graph.astream(initial_state, stream_mode="updates"):
        for _, node_output in chunk.items():
            merged.update(node_output)

    return {
        "session_id": request.sessionId,
        "turn_number": request.turnNumber,
        "response": merged.get("response", "Let's think about this step by step. What does this problem ask you to find?"),
        "approach": merged.get("approach", "goal_clarification"),
        "understanding_level": None,
    }


@app.post("/generate-pdf")
async def generate_pdf_endpoint(request: SummaryRequest):
    """Generate a one-page PDF summary of the learning session. No LLM call."""
    pdf_bytes = generate_summary_pdf(request.model_dump())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="learning-summary.pdf"',
        },
    )


# ---------- Entrypoint ----------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

"""
Main LangGraph orchestration graph.
Stages: intake → breakdown → problems
Each node is an async function that returns partial state updates.
"""

import asyncio
import json
import re
import os
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from prompts.breakdown import SYSTEM_PROMPT_FIRST_PRINCIPLES_BREAKDOWN
from prompts.problems import SYSTEM_PROMPT_PRACTICE_PROBLEMS, build_problems_user_prompt
from prompts.orchestration import (
    SYSTEM_PROMPT_INTAKE_AGENT,
    build_intake_user_prompt,
)
from agents.llm_client import LLMClient, DEFAULT_MODEL

MAX_TEXT_LENGTH = 12_000


# ---------- Shared state ----------

class OrchestrationState(TypedDict):
    # Input
    topic: Optional[str]
    document_text: Optional[str]
    file_name: Optional[str]
    model: Optional[str]  # Selected AI model
    # Agent outputs
    learning_intent: Optional[dict]
    breakdown: Optional[dict]
    practice_set: Optional[dict]
    # Session
    session_id: str
    error: Optional[str]


# ---------- Helpers ----------

def _sanitize(text: str) -> str:
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_json(raw: str) -> tuple[dict | None, str | None]:
    cleaned = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned, flags=re.MULTILINE).strip()
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        return None, "Response did not contain a JSON object"
    try:
        return json.loads(m.group(0)), None
    except json.JSONDecodeError as e:
        return None, f"JSON parse failed: {e}"


# ---------- Nodes ----------

async def intake_node(state: OrchestrationState) -> dict:
    """Stage 1 — Analyze input and identify domain, difficulty, objectives."""
    model = state.get("model") or DEFAULT_MODEL
    client = LLMClient(model=model)
    user_prompt = build_intake_user_prompt(
        topic=state.get("topic"),
        document_text=state.get("document_text"),
        file_name=state.get("file_name"),
    )
    try:
        response_text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_INTAKE_AGENT,
            user_message=user_prompt,
            max_tokens=500,
        )
        data, err = _parse_json(response_text)
        if err or not data:
            raise ValueError(err or "Empty response")
        return {"learning_intent": data}
    except Exception:
        # Graceful fallback — always continue to breakdown stage
        return {
            "learning_intent": {
                "domain": "General",
                "difficulty": "intermediate",
                "learningObjectives": ["Understand the core concepts"],
                "focusConcepts": [state.get("topic") or "the subject"],
            }
        }


async def breakdown_node(state: OrchestrationState) -> dict:
    """Stage 2 — Generate first-principles breakdown."""
    model = state.get("model") or DEFAULT_MODEL
    client = LLMClient(model=model)

    doc_text = state.get("document_text")
    topic = state.get("topic")
    file_name = state.get("file_name")

    if doc_text:
        sanitized = _sanitize(doc_text)
        capped = sanitized[:MAX_TEXT_LENGTH]
        truncated = len(sanitized) > MAX_TEXT_LENGTH
        user_msg = (
            f'Analyze the following document{f" (\"{file_name}\")" if file_name else ""}'
            f" and generate a first principles breakdown of the primary concept it teaches."
            f'{" Note: document was truncated to fit context limits." if truncated else ""}'
            f"\n\nDOCUMENT TEXT:\n{capped}"
        )
    else:
        user_msg = f'Generate a first principles breakdown for the concept: "{topic}"'

    try:
        response_text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_FIRST_PRINCIPLES_BREAKDOWN,
            user_message=user_msg,
            max_tokens=4096,
        )
        data, err = _parse_json(response_text)
        if err or not data:
            return {"error": f"Breakdown parse error: {err}"}
        if not isinstance(data.get("firstPrinciples"), list):
            return {"error": "Invalid breakdown: missing firstPrinciples array"}
        if not isinstance(data.get("workedExamples"), list):
            return {"error": "Invalid breakdown: missing workedExamples array"}
        return {"breakdown": data}
    except Exception as e:
        return {"error": f"Breakdown generation failed: {e}"}


async def problems_node(state: OrchestrationState) -> dict:
    """Stage 3 — Generate practice problems from the breakdown."""
    if state.get("error") or not state.get("breakdown"):
        return {}  # Skip gracefully if previous stage failed

    model = state.get("model") or DEFAULT_MODEL
    client = LLMClient(model=model)
    breakdown = state["breakdown"]
    user_msg = build_problems_user_prompt(breakdown)

    try:
        response_text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_PRACTICE_PROBLEMS,
            user_message=user_msg,
            max_tokens=2048,
        )
        data, err = _parse_json(response_text)
        if err or not data:
            return {"practice_set": {"problems": []}}
        return {"practice_set": data}
    except Exception:
        return {"practice_set": {"problems": []}}


# ---------- Graph ----------

def build_orchestration_graph():
    graph: StateGraph = StateGraph(OrchestrationState)

    graph.add_node("intake", intake_node)
    graph.add_node("breakdown", breakdown_node)
    graph.add_node("problems", problems_node)

    graph.add_edge(START, "intake")
    graph.add_edge("intake", "breakdown")
    graph.add_edge("breakdown", "problems")
    graph.add_edge("problems", END)

    return graph.compile()

"""
LangGraph Tutoring Agent.
Nodes: analyze_understanding → plan_next_step → generate_response

Never reveals answers directly. Guides students through Socratic questioning,
slowly moving them from confusion to discovery using first principles.
"""

import asyncio
import json
import re
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from agents.llm_client import LLMClient, DEFAULT_MODEL


# ---------- State ----------

class TutorState(TypedDict):
    homework_question: str          # The student's original homework problem
    conversation_history: list[dict]  # [{role, content}, ...]
    turn_number: int
    model: str
    # Populated by nodes
    understanding_summary: Optional[str]   # What student currently understands
    key_gap: Optional[str]                 # The specific concept they're missing
    approach: str                          # Current stage of tutoring
    next_concept: Optional[str]            # What to guide toward this turn
    response: str                          # Final Socratic response


# ---------- Helpers ----------

def _parse_json(raw: str) -> tuple[dict | None, str | None]:
    cleaned = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned, flags=re.MULTILINE).strip()
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        return None, "No JSON object found"
    try:
        return json.loads(m.group(0)), None
    except json.JSONDecodeError as e:
        return None, str(e)


def _format_history(conversation_history: list[dict]) -> str:
    return "\n".join(
        f"{'Student' if m['role'] == 'user' else 'Tutor'}: {m['content']}"
        for m in conversation_history
    )


# ---------- Nodes ----------

async def analyze_understanding(state: TutorState) -> dict:
    """
    Analyze what the student currently understands based on the conversation.
    Determines the approach stage and identifies the key gap in understanding.
    """
    client = LLMClient(model=state["model"])
    history_text = _format_history(state["conversation_history"])
    turn = state["turn_number"]

    prompt = f"""A student needs help with this homework problem:

PROBLEM:
{state["homework_question"]}

CONVERSATION SO FAR (Turn {turn}):
{history_text if history_text else "(No conversation yet — student just submitted the question)"}

Analyze the student's current understanding. Return JSON:
{{
  "what_student_knows": "Brief summary of concepts the student has shown they understand (or 'nothing demonstrated yet' if first turn)",
  "key_gap": "The single most important concept, step, or misconception blocking their progress",
  "understanding_level": <integer 0-100>,
  "approach": "<one of: goal_clarification | concept_probing | guided_derivation | near_solution>"
}}

Approach guidelines:
- goal_clarification: turns 1-2, or student hasn't articulated the problem goal yet
- concept_probing: student understands the goal but can't identify relevant concepts
- guided_derivation: student knows relevant concepts but can't connect them step-by-step
- near_solution: student is 1-2 steps away from completing the solution"""

    try:
        text = await asyncio.to_thread(
            client.create_message,
            system="You are an expert educational analyst. Return only valid JSON.",
            user_message=prompt,
            max_tokens=512,
        )
        data, _ = _parse_json(text)
        if data:
            return {
                "understanding_summary": data.get("what_student_knows", ""),
                "key_gap": data.get("key_gap", ""),
                "approach": data.get("approach", "goal_clarification"),
            }
    except Exception:
        pass

    return {
        "understanding_summary": "",
        "key_gap": "Unclear — need to understand what the student knows",
        "approach": "goal_clarification",
    }


async def plan_next_step(state: TutorState) -> dict:
    """
    Determine exactly what concept or reasoning step to guide the student
    toward in this turn. Returns the specific bridge to build.
    """
    client = LLMClient(model=state["model"])

    approach_context = {
        "goal_clarification": "Help the student understand what the problem is asking. Focus on restating the goal in their own words.",
        "concept_probing": "Help the student identify which concepts, formulas, or principles are relevant to this problem.",
        "guided_derivation": "Guide the student through the next concrete step in solving the problem without solving it for them.",
        "near_solution": "Help the student bridge the final gap to the complete solution with a targeted leading question.",
    }

    prompt = f"""You are planning the next tutoring move for this student.

HOMEWORK PROBLEM:
{state["homework_question"]}

STUDENT'S CURRENT UNDERSTANDING:
{state["understanding_summary"] or "Unknown"}

KEY GAP TO ADDRESS:
{state["key_gap"] or "Need to discover what they know"}

CURRENT APPROACH STAGE: {state["approach"]}
STAGE GOAL: {approach_context.get(state["approach"], "")}

What is the ONE specific concept, question, or reasoning step to guide the student toward next?
Do NOT reveal the answer. Do NOT give multiple steps at once.

Return JSON:
{{
  "next_concept": "The specific concept or step to guide toward (e.g., 'identify the forces acting on the object', 'recall what conservation of energy means')",
  "question_type": "<one of: what_do_you_know | what_is_the_goal | what_principles_apply | what_happens_next | can_you_simplify | what_does_this_tell_you>"
}}"""

    try:
        text = await asyncio.to_thread(
            client.create_message,
            system="You are a strategic educational planner. Return only valid JSON.",
            user_message=prompt,
            max_tokens=256,
        )
        data, _ = _parse_json(text)
        if data:
            return {"next_concept": data.get("next_concept", state["key_gap"] or "")}
    except Exception:
        pass

    return {"next_concept": state["key_gap"] or ""}


async def generate_response(state: TutorState) -> dict:
    """
    Generate a single, focused Socratic guiding question or response.
    Never reveals the answer. Builds on what the student has said.
    """
    client = LLMClient(model=state["model"])
    history_text = _format_history(state["conversation_history"])
    turn = state["turn_number"]

    approach_instructions = {
        "goal_clarification": (
            "Ask the student to explain in their own words what the problem is asking them to find. "
            "Make sure they clearly understand the goal before any solving begins."
        ),
        "concept_probing": (
            "Ask which concepts, formulas, or principles they think might be relevant here. "
            "Probe their thinking without giving away which ones are actually needed."
        ),
        "guided_derivation": (
            "Ask a question that leads them to take the next logical step themselves. "
            "Build on what they've said so far. Guide one step at a time."
        ),
        "near_solution": (
            "Ask the targeted question that bridges their last insight to the final answer. "
            "They should be able to complete it themselves after this question."
        ),
    }

    instruction = approach_instructions.get(state["approach"], approach_instructions["goal_clarification"])

    prompt = f"""You are a patient Socratic homework tutor. Your ONLY job is to guide students to solve problems themselves — NEVER give away the answer or solve any step for them.

HOMEWORK PROBLEM:
{state["homework_question"]}

CONVERSATION (Turn {turn}):
{history_text if history_text else "(Student just submitted their homework question — no conversation yet)"}

WHAT TO GUIDE TOWARD THIS TURN:
{state["next_concept"] or "Help the student understand the problem goal"}

APPROACH: {instruction}

STRICT RULES:
1. NEVER reveal the answer or solve any step directly
2. Ask exactly ONE focused question (not a list)
3. Be warm, encouraging, and concise
4. Build on what the student said (if anything)
5. If first turn, welcome them and start with "What does this problem ask you to find?"
6. Maximum 3 sentences total

Write ONLY the tutor's response — no preamble, no labels."""

    try:
        response = await asyncio.to_thread(
            client.create_message,
            system="You are a patient, Socratic homework tutor who never reveals answers directly. Be warm and concise.",
            user_message=prompt,
            max_tokens=300,
        )
        return {"response": response.strip()}
    except Exception:
        return {"response": "Let's think about this step by step. What does this problem ask you to find?"}


# ---------- Graph ----------

def build_tutor_graph():
    """Build and compile the tutoring LangGraph."""
    graph: StateGraph = StateGraph(TutorState)

    graph.add_node("analyze_understanding", analyze_understanding)
    graph.add_node("plan_next_step", plan_next_step)
    graph.add_node("generate_response", generate_response)

    graph.add_edge(START, "analyze_understanding")
    graph.add_edge("analyze_understanding", "plan_next_step")
    graph.add_edge("plan_next_step", "generate_response")
    graph.add_edge("generate_response", END)

    return graph.compile()

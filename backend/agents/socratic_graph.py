"""
LangGraph Socratic dialogue graph.
Nodes: identify_goal → extract_variables → rank_principles → generate_question
Each node is stateless (single-turn); caller supplies full conversation history.
"""

import asyncio
import json
import re
from typing import TypedDict, Optional

from langgraph.graph import StateGraph, START, END

from agents.llm_client import LLMClient, DEFAULT_MODEL
from prompts.socratic import (
    SYSTEM_PROMPT_SOCRATIC,
    SYSTEM_PROMPT_GOAL_IDENTIFIER,
    SYSTEM_PROMPT_VARIABLE_EXTRACTOR,
)

_STOP_WORDS = {
    "", "the", "a", "an", "is", "are", "to", "of", "in", "and", "or",
    "for", "with", "it", "this", "that", "be", "as", "at", "by", "we",
    "i", "you", "he", "she", "they", "on", "do", "does", "how", "what",
    "can", "my", "your",
}


# ---------- State ----------

class SocraticState(TypedDict):
    problem_statement: str
    user_message: str
    conversation_history: list[dict]
    turn_number: int
    breakdown_principles: list[dict]   # firstPrinciples from the breakdown
    # Populated by nodes
    goal: Optional[str]
    variables: Optional[dict]
    relevant_principles: list[dict]
    system_question: str
    intent: str
    principle_hinted: Optional[dict]


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


# ---------- Nodes ----------

async def identify_goal_node(state: SocraticState) -> dict:
    """Extract the student's learning goal from their message."""
    client = LLMClient(model=DEFAULT_MODEL)
    prompt = (
        f'Problem: "{state["problem_statement"]}"\n'
        f'Student message: "{state["user_message"]}"'
    )
    try:
        text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_GOAL_IDENTIFIER,
            user_message=prompt,
            max_tokens=300,
        )
        data, _ = _parse_json(text)
        return {"goal": data.get("goal", "") if data else ""}
    except Exception:
        return {"goal": ""}


async def extract_variables_node(state: SocraticState) -> dict:
    """Extract known / unknown variables and constraints."""
    client = LLMClient(model=DEFAULT_MODEL)
    prompt = (
        f'Problem: "{state["problem_statement"]}"\n'
        f'Student message: "{state["user_message"]}"'
    )
    try:
        text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_VARIABLE_EXTRACTOR,
            user_message=prompt,
            max_tokens=400,
        )
        data, _ = _parse_json(text)
        return {"variables": data or {}}
    except Exception:
        return {"variables": {}}


async def rank_principles_node(state: SocraticState) -> dict:
    """
    Score breakdown principles by keyword overlap with the student's goal
    and current message. No external calls — pure in-memory matching.
    """
    principles = state.get("breakdown_principles", [])
    goal = (state.get("goal") or "").lower()
    user_msg = state["user_message"].lower()

    query_words = (
        set(re.split(r"\W+", f"{goal} {user_msg}")) - _STOP_WORDS
    )

    scored: list[tuple[int, dict]] = []
    for p in principles:
        text = f"{p.get('title', '')} {p.get('statement', '')}".lower()
        doc_words = set(re.split(r"\W+", text))
        score = len(query_words & doc_words)
        scored.append((score, p))

    scored.sort(key=lambda x: -x[0])
    # Return up to 3 most relevant
    relevant = [p for _, p in scored[:3]]
    return {"relevant_principles": relevant}


async def generate_question_node(state: SocraticState) -> dict:
    """Generate a single Socratic question and optionally surface a principle hint."""
    client = LLMClient(model=DEFAULT_MODEL)
    turn_number = state["turn_number"]

    # Turn-based intent schedule
    if turn_number <= 2:
        intent = "goal_clarification"
    elif turn_number <= 3:
        intent = "variable_identification"
    elif turn_number <= 4:
        intent = "principle_connection"
    elif turn_number < 5:
        intent = "next_step"
    else:
        intent = "principle_hint"

    history_lines = "\n".join(
        f"{'Student' if m['role'] == 'user' else 'Tutor'}: {m['content']}"
        for m in state["conversation_history"]
    )

    context = (
        f'Problem: "{state["problem_statement"]}"\n'
        f"Current Turn: {turn_number}\n\n"
        f"Conversation so far:\n{history_lines}\n\n"
        f'Student\'s Latest Message: "{state["user_message"]}"'
    )

    relevant = state.get("relevant_principles", [])
    if relevant:
        context += "\n\nRelevant Principles Available:\n" + "\n".join(
            f"- {p.get('title', '')}: {p.get('statement', '')}"
            for p in relevant
        )

    try:
        question = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_SOCRATIC,
            user_message=context,
            max_tokens=300,
        )
        question = question.strip()
    except Exception:
        question = "What do you think is the first step in approaching this problem?"

    # Reveal a principle hint after turn 5
    should_reveal = turn_number >= 5
    principle_hinted = None
    if should_reveal and relevant:
        top = relevant[0]
        principle_hinted = {
            "id": top.get("id", ""),
            "title": top.get("title", ""),
            "question": (
                f"How might the principle of '{top.get('title', '')}' "
                f"help you approach this problem?"
            ),
        }

    return {
        "system_question": question,
        "intent": intent,
        "principle_hinted": principle_hinted,
    }


# ---------- Graph ----------

def build_socratic_graph():
    graph: StateGraph = StateGraph(SocraticState)

    graph.add_node("identify_goal", identify_goal_node)
    graph.add_node("extract_variables", extract_variables_node)
    graph.add_node("rank_principles", rank_principles_node)
    graph.add_node("generate_question", generate_question_node)

    graph.add_edge(START, "identify_goal")
    graph.add_edge("identify_goal", "extract_variables")
    graph.add_edge("extract_variables", "rank_principles")
    graph.add_edge("rank_principles", "generate_question")
    graph.add_edge("generate_question", END)

    return graph.compile()

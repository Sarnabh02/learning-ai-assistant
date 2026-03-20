"""
Single-shot answer assessment agent.
No graph needed — one Claude call with a strict JSON output format.
"""

import asyncio
import json
import re

from agents.llm_client import LLMClient, DEFAULT_MODEL
from prompts.orchestration import (
    SYSTEM_PROMPT_ANSWER_ASSESSOR,
    build_assessment_user_prompt,
)

_FALLBACK = {
    "isCorrect": False,
    "score": 0,
    "strengths": [],
    "gaps": ["Could not evaluate response — please try again."],
    "socraticFollowUp": "Can you walk me through your reasoning step by step?",
}


def _parse_json(raw: str) -> dict | None:
    cleaned = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned, flags=re.MULTILINE).strip()
    m = re.search(r"\{[\s\S]*\}", cleaned)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


async def assess_answer(
    problem_statement: str,
    user_answer: str,
    breakdown: dict,
    hints_revealed: int,
) -> dict:
    """
    Assess a student's answer to a practice problem.
    Returns a dict matching AnswerAssessment shape.
    """
    client = LLMClient(model=DEFAULT_MODEL)
    user_prompt = build_assessment_user_prompt(
        problem_statement=problem_statement,
        user_answer=user_answer,
        breakdown=breakdown,
        hints_revealed=hints_revealed,
    )

    try:
        text = await asyncio.to_thread(
            client.create_message,
            system=SYSTEM_PROMPT_ANSWER_ASSESSOR,
            user_message=user_prompt,
            max_tokens=600,
        )
        data = _parse_json(text)
        return data if data else _FALLBACK
    except Exception:
        return _FALLBACK

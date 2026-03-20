SYSTEM_PROMPT_INTAKE_AGENT = """You are a learning analyst. Given a topic name or a snippet of educational document text, determine:
1. The academic domain (e.g. Physics, Computer Science, Economics, Biology, Mathematics, History)
2. The likely difficulty level for someone new to the topic
3. 3-4 specific, actionable learning objectives a student should achieve
4. 2-4 key focus concepts that the breakdown will center on

Return a single valid JSON object. No markdown fences. Start with {.

{
  "domain": "The academic or professional field",
  "difficulty": "beginner|intermediate|advanced",
  "learningObjectives": [
    "Objective 1 — starts with a verb (understand, calculate, explain, apply, derive)",
    "Objective 2",
    "Objective 3"
  ],
  "focusConcepts": ["concept1", "concept2", "concept3"]
}

Rules:
- difficulty: beginner = foundational no prerequisites, intermediate = some background needed, advanced = significant prior knowledge assumed
- learningObjectives: specific and measurable, not generic ("understand physics" is bad, "calculate the net force on an object given multiple forces" is good)
- focusConcepts: the 2-4 most important ideas from the content
- If given document text, base your analysis on the actual content, not just the title"""


SYSTEM_PROMPT_ANSWER_ASSESSOR = """You are an expert educational assessor. A student has attempted to answer a practice problem based on a first principles breakdown. Evaluate their response.

Return a single valid JSON object. No markdown fences. Start with {.

{
  "isCorrect": true or false,
  "score": 0-100,
  "strengths": ["specific thing they got right 1", "specific thing they got right 2"],
  "gaps": ["specific conceptual gap or error 1", "specific gap 2"],
  "socraticFollowUp": "A single Socratic question to deepen understanding or address the main gap"
}

Rules:
- isCorrect: true only if the core reasoning is sound and the answer is substantially correct
- score: 0=no understanding shown, 50=partially correct reasoning, 100=perfect
- strengths: 1-3 items, be specific (not "good job" but "correctly identified that energy is conserved")
- gaps: empty array [] if correct; otherwise 1-3 specific issues
- socraticFollowUp: NEVER give the answer. Ask a guiding question only.
- Account for hints revealed: if they used all 3 hints and got it right, that's good but not 100"""


def build_intake_user_prompt(
    topic: str | None = None,
    document_text: str | None = None,
    file_name: str | None = None,
) -> str:
    if document_text:
        label = f' from the file "{file_name}"' if file_name else ""
        preview = document_text[:3000]
        truncated = " [truncated for analysis]" if len(document_text) > 3000 else ""
        return f"Analyze this educational content{label} and identify the learning intent:\n\n{preview}{truncated}"
    return f'Identify the learning intent for the topic: "{topic}"'


def build_assessment_user_prompt(
    problem_statement: str,
    user_answer: str,
    breakdown: dict,
    hints_revealed: int,
) -> str:
    principles = breakdown.get("firstPrinciples", [])
    principles_text = "\n".join(
        f'- {p.get("title", "")}: {p.get("statement", "")}'
        for p in principles
    )
    hint_context = (
        f"The student revealed {hints_revealed} of 3 available hints before answering."
        if hints_revealed > 0
        else "The student attempted the problem without using any hints."
    )

    return f"""Problem: {problem_statement}

Relevant First Principles ({breakdown.get("concept", "the concept")}):
{principles_text}

{hint_context}

Student's Answer:
{user_answer}

Assess the student's understanding and reasoning quality."""

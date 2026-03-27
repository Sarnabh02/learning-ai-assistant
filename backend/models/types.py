from pydantic import BaseModel
from typing import Optional, Literal, Any


class FirstPrinciple(BaseModel):
    id: str
    title: str
    statement: str
    whyFundamental: str


class DerivationStep(BaseModel):
    step: int
    fromPrinciples: list[str]
    claim: str
    reasoning: str


class WorkedExample(BaseModel):
    id: str
    title: str
    problem: str
    solution: str
    principlesUsed: list[str]


class FirstPrinciplesBreakdown(BaseModel):
    concept: str
    domain: str
    firstPrinciples: list[FirstPrinciple]
    derivation: list[DerivationStep]
    workedExamples: list[WorkedExample]


class PracticeHint(BaseModel):
    level: int
    text: str


class PracticeProblem(BaseModel):
    id: str
    difficulty: Literal["easy", "medium", "hard"]
    statement: str
    hints: list[PracticeHint]
    answer: Optional[str] = None
    principlesExercised: list[str]


class PracticeSet(BaseModel):
    problems: list[PracticeProblem]


class LearningIntent(BaseModel):
    domain: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    learningObjectives: list[str]
    focusConcepts: list[str]


class AnswerAssessment(BaseModel):
    isCorrect: bool
    score: int
    strengths: list[str]
    gaps: list[str]
    socraticFollowUp: str


# ---------- Request / Response models ----------

class SocraticRequest(BaseModel):
    sessionId: str
    problemStatement: str
    userMessage: str
    conversationHistory: list[dict]
    turnNumber: int
    breakdown: Optional[dict] = None


class AssessAnswerRequest(BaseModel):
    problemStatement: str
    userAnswer: str
    breakdown: dict
    hintsRevealed: int = 0


class SummaryRequest(BaseModel):
    topic: str
    domain: str
    difficulty: str
    learningObjectives: list[str]
    focusConcepts: list[str] = []
    firstPrinciples: list[dict]    # title, statement, whyFundamental
    derivation: list[dict]         # step, claim, reasoning
    workedExamples: list[dict] = []  # title, problem, solution
    practiceProblems: list[dict]   # difficulty, statement



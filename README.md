# LearnAI — AI-Powered Education Assistant

An intelligent tutoring platform that breaks down any subject into first principles and teaches through Socratic dialogue. Upload a document or describe a topic — LearnAI generates conceptual breakdowns, practice problems, and coaches you to the answer without ever giving it away.

---

## What It Does

**Learn Mode** — Give it any topic or upload a PDF/PPTX. LearnAI decomposes the material into its foundational principles, generates targeted practice problems, and opens a Socratic chat for each one where it guides your thinking through questions.

**Tutor Mode** — Paste a homework question. A multi-turn coaching agent walks you through the problem step-by-step, identifying where your understanding breaks down and asking the right question to push you forward.

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js Frontend              │
│  Dashboard → Learn → SocraticChat       │
│  Zustand state (pendingFile + session)  │
└──────────────┬──────────────────────────┘
               │ SSE / JSON (API Routes)
┌──────────────▼──────────────────────────┐
│         Python Backend (FastAPI)        │
│                                         │
│  /orchestrate  ─→  LangGraph            │
│    intake → breakdown → problems        │
│                                         │
│  /socratic     ─→  LangGraph            │
│    identify_goal → extract_variables    │
│    → rank_principles → generate_question│
│                                         │
│  /tutor        ─→  LangGraph            │
│    analyze_understanding → plan_next    │
│    → generate_response                  │
│                                         │
│  /assess-answer ─→  Single Claude call  │
└─────────────────────────────────────────┘
```

**Frontend:** Next.js 16 (App Router), TypeScript, Tailwind v4, Zustand v5
**Backend:** FastAPI, LangGraph, multi-provider LLM (Anthropic / OpenAI / Google)
**Auth & DB:** Supabase

---

## Agents & Graphs

### Orchestration Graph (`/orchestrate`)
Triggered when a user submits a topic or uploads a document. Streams three SSE event stages:

| Node | What it does |
|------|-------------|
| `intake` | Extracts domain, difficulty, and learning objectives from the input |
| `breakdown` | Generates first-principles decomposition: core principles, derivation chain, worked examples |
| `problems` | Generates tiered practice problems (easy/medium/hard) with 3-level hint scaffolding |

### Socratic Graph (`/socratic`)
Runs per problem, per conversation turn:

| Node | What it does |
|------|-------------|
| `identify_goal` | Extracts what the student is trying to figure out |
| `extract_variables` | Identifies known and unknown variables |
| `rank_principles` | Ranks first principles by keyword relevance (no extra LLM call) |
| `generate_question` | Asks one targeted Socratic question; hints at a principle after turn 5 |

### Tutor Graph (`/tutor`)
Runs for homework help, escalates strategy turn-by-turn:

| Node | What it does |
|------|-------------|
| `analyze_understanding` | Assesses the student's current grasp of the problem |
| `plan_next_step` | Decides whether to clarify, probe a concept, or guide derivation |
| `generate_response` | Outputs exactly one focused question — never the answer |

### Assessment Agent (`/assess-answer`)
Single Claude call that scores a student's answer, identifies conceptual gaps, and returns a Socratic follow-up question.

---

## Project Structure

```
education-assistant/
├── app/
│   ├── (auth)/login, signup, callback
│   ├── (app)/dashboard, learn, tutor
│   └── api/orchestrate, socratic, assess-answer, tutor, models
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── agents/
│   │   ├── llm_client.py        # Unified Anthropic/OpenAI/Google wrapper
│   │   ├── orchestration_graph.py
│   │   ├── socratic_graph.py
│   │   ├── tutor_graph.py
│   │   └── assessment_agent.py
│   ├── prompts/                 # System prompts per agent
│   ├── parsers/                 # PDF + PPTX extraction
│   ├── generators/              # PDF summary export
│   └── models/types.py          # Pydantic schemas
├── components/learn/            # LearnPage, SocraticChat, ProblemCard, etc.
├── store/learning-store.ts      # Zustand: session, breakdown, problems, pendingFile
└── lib/first-principles/types.ts  # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- At least one LLM API key (Anthropic, OpenAI, or Google)
- Supabase project (for auth)

### 1. Clone and install

```bash
git clone <repo-url>
cd education-assistant

# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Configure environment

Create `.env.local` in the project root:

```bash
# Supabase (required for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PYTHON_API_URL=http://localhost:8000

# Dev options
USE_MOCK_DATA=false   # set true to run without real API keys
```

### 3. Run

**Terminal 1 — Python backend:**
```bash
cd backend
python main.py
# → http://localhost:8000
```

**Terminal 2 — Next.js frontend:**
```bash
npm run dev
# → http://localhost:3000
```

---

## API Reference

All endpoints live on the Python backend at `http://localhost:8000`. Next.js API routes proxy to them automatically.

### `POST /orchestrate`
Accepts `multipart/form-data` (file upload) or JSON.

| Field | Type | Description |
|-------|------|-------------|
| `topic` | string | Topic or document text |
| `file` | File | Optional PDF or PPTX |
| `model` | string | LLM model ID (default: `gpt-4o`) |

Returns a Server-Sent Events stream with stages: `intake` → `breakdown` → `problems` → `ready`

### `POST /socratic`

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Session from orchestrate |
| `problemStatement` | string | The problem being solved |
| `userMessage` | string | Student's latest message |
| `conversationHistory` | array | Prior turns |
| `turnNumber` | int | Current turn count |
| `breakdown` | object | First-principles breakdown |

Returns a Socratic question, optionally with a hinted principle (after turn 5).

### `POST /assess-answer`

| Field | Type | Description |
|-------|------|-------------|
| `problemStatement` | string | |
| `userAnswer` | string | Student's submitted answer |
| `breakdown` | object | First-principles context |
| `hintsRevealed` | int | Number of hints used |

Returns: `isCorrect`, `score (0–100)`, `strengths`, `gaps`, `socraticFollowUp`

### `POST /tutor`

| Field | Type | Description |
|-------|------|-------------|
| `homeworkQuestion` | string | The full question |
| `conversationHistory` | array | Prior turns |
| `turnNumber` | int | Current turn |

Returns a coaching response and the current approach strategy.

### `GET /models`
Returns available models grouped by provider.

---

## Supported Models

| Provider | Models |
|----------|--------|
| Anthropic | `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229` |
| OpenAI | `gpt-4o`, `gpt-4-turbo`, `gpt-4` |
| Google | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite` |

Select a model from the dropdown in the UI before submitting.

---

## Key Design Decisions

**Python for all LLM orchestration** — LangGraph runs in the FastAPI backend; Next.js only handles UI and thin proxy routes.

**SSE streaming** — The orchestration pipeline streams each stage as it completes so the UI progressively renders without waiting for the full response.

**Hint scaffolding** — Each practice problem has 3 leveled hints (vague → moderate → near-solution). The assessment agent discounts the score based on how many hints were revealed.

**Socratic-only coaching** — Neither the Socratic agent nor the tutor ever outputs a direct answer. The tutor graph has explicit guardrails in its prompt to prevent answer leakage.

**Mock data mode** — Set `USE_MOCK_DATA=true` to run the full UI flow without API keys, useful for frontend development.

---

## Scripts

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint
```

# LearnAI — Learn Anything from First Principles

LearnAI is an AI-powered education assistant that transforms any topic or document into a structured learning experience. It breaks down complex subjects into their fundamental building blocks and generates targeted practice problems to reinforce understanding.

---

## Features

### First Principles Breakdown
Upload a PDF or PPTX, or type any topic, and the system generates a structured breakdown:
- **First principles** — the irreducible axioms that underpin the topic
- **Derivation chain** — how higher-level concepts build from those axioms
- **Worked examples** — fully solved problems demonstrating the principles in action

### Practice Problems
Five difficulty-graded problems (easy / medium / hard) targeting the specific first principles identified. Each problem includes three progressive hints that reveal themselves one at a time to scaffold understanding without giving anything away.

### Flashcards
Every first principle, derivation step, and worked example is available as an interactive flashcard deck for rapid review.

### PDF Summary Export
Download a one-page PDF summary of the learning session: topic, domain, difficulty, first principles, derivation chain, and practice problems.

### Model Selection
Choose between Claude (Anthropic), GPT-4 (OpenAI), or Gemini (Google) as the AI backbone for the session.

### Mock Data Mode
Run the full UI without any API keys by setting `USE_MOCK_DATA=true`. Useful for UI development and demos.

---

## Architecture

```
Browser
  └── Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
        ├── /api/orchestrate    →  Python FastAPI /orchestrate   (SSE streaming)
        ├── /api/generate-pdf   →  Python FastAPI /generate-pdf
        └── /api/models         →  Python FastAPI /models

Python FastAPI (uvicorn, port 8000)
  ├── /orchestrate   — 3-node LangGraph: intake → breakdown → problems
  ├── /generate-pdf  — ReportLab PDF generation (no LLM call)
  └── /models        — Lists available models by provider

Auth: Supabase (email/password + OAuth, session refresh via Next.js proxy middleware)
State: Zustand (client-side pending file handoff between routes)
```

The frontend is a thin proxy layer — all AI reasoning runs in the Python backend via LangGraph agents. API keys never touch the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| State management | Zustand 5 |
| Auth | Supabase |
| Backend API | Python FastAPI + uvicorn |
| AI orchestration | LangGraph 0.2+, LangChain 1.2+ |
| LLM providers | Anthropic Claude, OpenAI GPT-4, Google Gemini |
| File parsing | pypdf, python-pptx |
| PDF generation | ReportLab |

---

## Supported Models

| Provider | Models |
|---|---|
| Anthropic | `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229` |
| OpenAI | `gpt-4o`, `gpt-4-turbo`, `gpt-4` |
| Google | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite` |

---

## Project Structure

```
education-assistant/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts          # Supabase OAuth callback
│   ├── (app)/
│   │   ├── dashboard/page.tsx         # File upload and session launch
│   │   └── learn/page.tsx             # Main learning interface
│   ├── api/
│   │   ├── orchestrate/route.ts       # SSE proxy → Python /orchestrate
│   │   ├── generate-pdf/route.ts      # Proxy → Python /generate-pdf
│   │   └── models/route.ts            # Proxy → Python /models
│   ├── layout.tsx
│   └── page.tsx                       # Landing page
├── components/
│   ├── chat/
│   │   └── ChatMessage.tsx
│   └── learn/
│       ├── LearnPage.tsx              # Orchestration controller (SSE consumer)
│       ├── TopicInput.tsx             # Text / file input with model selector
│       ├── BreakdownViewer.tsx        # First principles display
│       ├── PracticeSection.tsx        # Problem list by difficulty
│       ├── ProblemCard.tsx            # Individual problem with hint reveal
│       ├── FlashCardDeck.tsx          # Interactive flashcard viewer
│       ├── ModelSelector.tsx          # AI model dropdown
│       └── LoadingPulse.tsx           # Loading state indicator
├── lib/
│   ├── first-principles/types.ts      # Shared TypeScript types
│   ├── mock-data/                     # Sample responses for USE_MOCK_DATA mode
│   └── supabase/                      # Browser/server/middleware Supabase clients
├── store/
│   └── learning-store.ts              # Zustand: pending file handoff between routes
├── proxy.ts                           # Next.js auth proxy (Supabase session refresh)
├── next.config.ts
├── tailwind.config.ts
├── .env.example                       # Frontend environment template
├── backend/
│   ├── main.py                        # FastAPI application
│   ├── agents/
│   │   ├── orchestration_graph.py     # 3-node LangGraph pipeline
│   │   └── llm_client.py              # Unified Claude / GPT-4 / Gemini wrapper
│   ├── prompts/
│   │   ├── breakdown.py               # First-principles decomposition prompt
│   │   ├── orchestration.py           # Intake agent prompt
│   │   └── problems.py                # Practice problems generation prompt
│   ├── parsers/
│   │   ├── pdf_parser.py              # pypdf text extraction
│   │   └── pptx_parser.py             # python-pptx text extraction
│   ├── generators/
│   │   └── pdf_generator.py           # ReportLab PDF summary
│   ├── models/types.py                # Pydantic request/response schemas
│   ├── requirements.txt
│   └── .env.example                   # Backend environment template
```

---

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Supabase** project (for auth)
- At least one LLM API key: Anthropic, OpenAI, or Google

---

## Setup

### 1. Clone and install frontend dependencies

```bash
git clone <repo-url>
cd education-assistant
npm install
```

### 2. Configure frontend environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Frontend URL (e.g. `http://localhost:3000`) |
| `PYTHON_API_URL` | Backend URL (default: `http://localhost:8000`) |
| `USE_MOCK_DATA` | Set `true` to run without API keys |

### 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `GOOGLE_API_KEY` | No | Google API key |
| `PORT` | No | Server port (default: `8000`) |

*At least one LLM provider key is required.

### 4. Create a Python virtual environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

## Running Locally

Start both servers in separate terminals:

**Terminal 1 — Python backend:**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Next.js frontend:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running without API keys

Set `USE_MOCK_DATA=true` in `.env.local`. The UI will use pre-built sample data for all AI responses with simulated streaming delays — no backend needed.

---

## API Endpoints

All endpoints are on the Python backend. The Next.js frontend proxies them via `/api/*` to keep keys server-side.

### `POST /orchestrate`
Accepts `multipart/form-data` (file upload) or JSON (`{ topic, model }`).

Returns a Server-Sent Events stream:

| Event | Payload |
|---|---|
| `stage` | `{ stage, status, message }` — pipeline progress |
| `intake` | `LearningIntent` — domain, difficulty, objectives |
| `breakdown` | `FirstPrinciplesBreakdown` — principles, derivation, examples |
| `problems` | `PracticeSet` — tiered problems with hints |
| `error` | `{ code, message }` |

### `POST /generate-pdf`
Accepts the full session summary. Returns `application/pdf`.

### `GET /models`
Returns available models by provider.

### `GET /health`
Returns `{ status: "ok" }`.

---

## Deployment

### Frontend — Vercel

1. Push to GitHub and import the repo in Vercel.
2. Set all variables from `.env.example` in the Vercel dashboard.
3. Set `PYTHON_API_URL` to your deployed backend URL.

### Backend — Railway / Render / Fly.io

The backend is a standard ASGI app. Example start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `ANTHROPIC_API_KEY` (and optionally `OPENAI_API_KEY`, `GOOGLE_API_KEY`) as environment variables on the platform.

---

## Key Design Decisions

**Python for all LLM orchestration** — LangGraph runs in the FastAPI backend. Next.js only handles the UI and proxy routes. This keeps the orchestration logic testable, portable, and decoupled from the React rendering lifecycle.

**SSE streaming** — The orchestration pipeline streams each stage as it completes so the UI progressively renders the breakdown and problems without waiting for the full response. The frontend renders each piece as soon as it arrives.

**Hint scaffolding** — Each problem has three leveled hints (vague → moderate → near-solution), encouraging independent reasoning before revealing more.

**Mock data mode** — `USE_MOCK_DATA=true` runs the full UI flow using pre-built sample breakdowns and problems. Useful for developing UI components without spending API credits.

---

## Scripts

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint
```

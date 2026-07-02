# StudyFlow AI

An intelligent study assistant — upload PDFs, chat with your notes, generate quizzes, flashcards, and study plans using AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 16 |
| Vector DB | ChromaDB |
| AI | Google Gemini Flash 2.0 + LangChain |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| Auth | JWT (access + refresh tokens) |
| DevOps | Docker Compose, Vercel, Railway |

---

## Quick Start (Docker — recommended)

### 1. Clone and configure
```bash
git clone https://github.com/yourname/studyflow-ai.git
cd studyflow-ai
cp .env.example .env
```

### 2. Fill in your .env
```bash
# Required — get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Generate a secure key
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
```

### 3. Start all services
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| ChromaDB | localhost:8001 |

---

## Local Development (without Docker)

### Backend
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

---

## Project Structure

```
studyflow-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # auth, documents, chat, quiz, flashcards, planner, revision
│   │   ├── core/                # config, security, dependencies
│   │   ├── db/                  # session, base
│   │   ├── models/              # SQLAlchemy ORM models (6 tables)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # rag, quiz, flashcard, planner services
│   │   └── utils/               # pdf_extractor, embeddings helpers
│   ├── alembic/                 # database migrations
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   ├── components/          # ui, layout, shared components
│   │   ├── lib/                 # api client, auth helpers
│   │   ├── hooks/               # useAuth, useDocuments, etc.
│   │   ├── types/               # TypeScript interfaces
│   │   └── store/               # Zustand global state
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema

```
users            → id, name, email, password_hash, is_active, created_at
documents        → id, user_id, file_name, file_path, file_size, page_count
document_chunks  → id, document_id, chunk_text, chunk_index, page_number, embedding_id
flashcards       → id, user_id, document_id, question, answer, topic
quizzes          → id, user_id, document_id, title, quiz_type, score, total_questions
quiz_questions   → id, quiz_id, question_text, options, correct_answer, user_answer
tasks            → id, user_id, title, subject, priority, deadline, duration, status
```

---

## API Endpoints (Module 1)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get my profile |
| PUT | `/api/v1/auth/me` | Update my profile |
| GET | `/health` | System health check |

---

## Modules Build Order

1. ✅ **Module 1** — Environment + DB schema + Auth
2. ✅ **Module 2** — PDF upload and management
3. ✅ **Module 3** — RAG chat pipeline (LangChain + Gemini + ChromaDB)
4. ✅ **Module 4** — Dashboard stats
5. ✅ **Module 5** — Flashcard generator
6. ✅ **Module 6** — Quiz generator (MCQ + short answer, auto-grading)
7. ✅ **Module 7** — Revision assistant
8. ✅ **Module 8** — Study planner

**All 8 modules complete — full-stack application ready to run.**

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
vercel deploy
```
Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`

### Backend → Railway
1. Push to GitHub
2. Connect Railway to your repo, select `/backend`
3. Add all env vars from `.env.example`
4. Railway auto-detects the Dockerfile

---

## License
MIT

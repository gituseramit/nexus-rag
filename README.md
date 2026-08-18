# Nexus RAG — Enterprise Engine

A production-ready RAG (Retrieval-Augmented Generation) application featuring a modular backend architecture and a responsive, beautiful React frontend.

## Architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Query, Recharts.
- **Backend:** FastAPI, PostgreSQL, pgvector, Redis, Celery.
- **RAG Pipeline:** Langchain chunking, OpenAI Embeddings, Hybrid search (pgvector cosine + BM25), Cross-encoder reranking, LLM streaming (OpenAI GPT-4o / Claude).

## Quick Start (Docker Compose)

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys (OpenAI, DB password, etc.)
   ```bash
   cp .env.example .env
   ```
3. Start the application
   ```bash
   docker compose up -d --build
   ```
4. Access the application:
   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:8000`

## Features

- **Document Management:** Drag-and-drop upload for PDF, DOCX, TXT, MD, CSV files. Async processing via Celery with live SSE progress updates.
- **Chat Interface:** Three-pane layout with conversations sidebar, message streaming, and a dedicated Inspector panel for source citations and relevance scores.
- **Analytics Dashboard:** Real-time metrics, system health, and API logs with Recharts and SSE streaming.
- **Security:** JWT authentication, user isolation, Argon2 password hashing.

## Development

To run the frontend locally without Docker:
```bash
cd frontend
npm install
npm run dev
```

To run the backend locally:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

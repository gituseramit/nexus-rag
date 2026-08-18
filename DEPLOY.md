# Nexus RAG — Free Production Deployment Guide

## Services You'll Use (All Free Forever)

| Service | What It Does | Free Limit |
|---|---|---|
| **GitHub** | Host your source code | Unlimited public repos |
| **Neon.tech** | PostgreSQL + pgvector database | 512 MB storage |
| **Upstash** | Redis for task queue + caching | 10,000 commands/day |
| **Render.com** | Host FastAPI backend + Celery worker | Spins down after 15 min idle |
| **Vercel** | Host React frontend | Unlimited hobby usage |

---

## Step 1 — Push Code to GitHub

Open a terminal in your project folder (`nexus-rag/`) and run:

```bash
git init
git add .
git commit -m "Initial commit: Nexus RAG application"
```

Then:
1. Go to **github.com** → click **New Repository**
2. Name it `nexus-rag`, set it to **Public**
3. Copy the remote URL (e.g. `https://github.com/your-username/nexus-rag.git`)
4. Run:
```bash
git remote add origin https://github.com/your-username/nexus-rag.git
git push -u origin main
```

---

## Step 2 — Set Up PostgreSQL Database (Neon.tech)

1. Go to **[neon.tech](https://neon.tech)** → Sign Up (free)
2. Click **Create Project** → name it `nexus-rag`
3. In the dashboard click **Connection Details** and copy the **Connection String**
4. In the Neon SQL Editor, enable pgvector:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

> [!NOTE]
> Change `postgresql://` to `postgresql+asyncpg://` in the URL and add `?ssl=require` at the end:
> `postgresql+asyncpg://user:pass@ep-xxx.neon.tech/nexus_rag?ssl=require`

---

## Step 3 — Set Up Redis (Upstash)

1. Go to **[upstash.com](https://upstash.com)** → Sign Up (free)
2. Click **Create Database** → name `nexus-rag` → plan: **Free**
3. Copy the **REDIS_URL** from the database details page

---

## Step 4 — Deploy Backend to Render.com

1. Go to **[render.com](https://render.com)** → Sign Up with GitHub
2. Click **New** → **Blueprint** → connect your `nexus-rag` repo
3. Render auto-detects `render.yaml` and shows 2 services:
   - `nexus-rag-backend` (Web Service)
   - `nexus-rag-worker` (Background Worker)
4. Fill in the secret environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `REDIS_URL` | Your Upstash URL |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CORS_ORIGINS` | `["https://your-app.vercel.app","http://localhost:5173"]` |

5. Click **Deploy** — takes ~5 minutes
6. Note your backend URL: `https://nexus-rag-backend.onrender.com`

---

## Step 5 — Deploy Frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)** → Sign Up with GitHub
2. Click **New Project** → import your `nexus-rag` repository
3. In project settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://nexus-rag-backend.onrender.com` |

5. Click **Deploy** — takes ~1 minute
6. Your app is live at `https://nexus-rag-xxxx.vercel.app`

---

## Step 6 — Update CORS on Render

1. Open `nexus-rag-backend` on Render → **Environment** tab
2. Update `CORS_ORIGINS` to include your real Vercel URL:
   ```
   ["https://nexus-rag-xxxx.vercel.app","http://localhost:5173"]
   ```
3. Save Changes — Render auto-redeploys

---

## Step 7 — Initialize the Database

On Render dashboard, open `nexus-rag-backend` → **Shell**, then run:

```bash
python -c "import asyncio; from app.db.session import init_db; asyncio.run(init_db())"
```

---

## Your Application Is Live!

| URL | What |
|---|---|
| `https://nexus-rag-xxxx.vercel.app` | Frontend |
| `https://nexus-rag-backend.onrender.com` | Backend API |
| `https://nexus-rag-backend.onrender.com/docs` | Swagger API Docs |

---

## Free Tier Limitations

> [!WARNING]
> **Render Cold Starts**: The free backend sleeps after 15 minutes idle. The first request after that takes ~30 seconds.

> [!NOTE]
> **Neon**: 512 MB storage free. Each document generates ~1-5 MB of embeddings.

> [!NOTE]
> **Upstash**: 10,000 Redis commands/day. Fine for moderate usage.

---

## Troubleshooting

**Build fails on Render** → Check logs under "Events" in the Render dashboard

**Database connection errors** → Ensure the Neon URL uses `postgresql+asyncpg://` and ends with `?ssl=require`

**CORS errors** → Verify Vercel URL exactly matches `CORS_ORIGINS` (no trailing slash)

**Documents stuck in Processing** → Check Celery worker logs on Render; verify `REDIS_URL` is identical in both services

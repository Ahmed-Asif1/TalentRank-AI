# TalentRank AI — AI-Powered Candidate Evaluation & Talent Intelligence Platform

[![Quality Gates](https://img.shields.io/badge/Quality_Gates-55%2F55_Passing-brightgreen?logo=vitest)](README.md#-project-status--quality-gates)
[![Repository](https://img.shields.io/badge/GitLab-Branch_ahmed-orange?logo=gitlab)](https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.4_Turbopack-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-v7-black)](https://sdk.vercel.ai)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3_Flash-blue?logo=google)](https://aistudio.google.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Vector_Search-green?logo=mongodb)](https://www.mongodb.com)

**TalentRank AI** is an intelligent candidate evaluation and recruitment ranking platform built for the **AICON Hackathon 2026**. It transforms manual, time-consuming candidate reviews into an automated, transparent, and bias-free pipeline powered by Google Gemini and MongoDB Atlas Vector Search.

**GitLab Branch `ahmed`:** [https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed](https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed)  
**About Team TensorSlow:** [/about](http://localhost:3000/about)  
**Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)  
**Architectural Explainer:** [EXPLAIN.md](EXPLAIN.md)  
**Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 📋 Table of Contents
- [Project Status & Quality Gates](#-project-status--quality-gates)
- [Key Features & Capabilities](#-key-features--capabilities)
- [Quickstart: 0 to Running in 3 Minutes](#-quickstart-0-to-running-in-3-minutes)
- [Multi-Modal Candidate Ingestion](#-multi-modal-candidate-ingestion)
- [Dynamic AI Job Criteria Engine](#-dynamic-ai-job-criteria-engine)
- [Candidate Deep Dive & RAG Chat](#-candidate-deep-dive--rag-chat)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Project Architecture & Anatomy](#-project-architecture--anatomy)
- [Verification & Testing Matrix](#-verification--testing-matrix)
- [Troubleshooting FAQ](#-troubleshooting-faq)
- [Deploying to Vercel](#-deploying-to-vercel)
- [GitLab & Workflow Guide](#-gitlab--workflow-guide)
- [Team & Credits](#-team--credits)

---

## 🚀 Project Status & Quality Gates

All core modules, domain registries, and automated quality gates have been implemented and independently verified:

| Pipeline Gate | Target | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Type Integrity** | `npm run typecheck` | ✅ **PASS** | `0 errors` across monorepo |
| **Code Style & Lint** | `npm run lint` | ✅ **PASS** | `0 errors` via ESLint 9 native flat configuration & TypeScript parser |
| **Unit Test Suite** | `npm run test` | ✅ **PASS** | **55/55 unit tests pass** offline across 6 test suites |
| **AI Evaluation Suite** | `npm run evals` | ✅ **PASS** | **10/10 structured extraction test cases pass** (100% pass rate) |
| **Database Indexes** | `npm run db:indexes` | ✅ **PASS** | Compound B-tree + Atlas Vector Search (768d HNSW) validated |
| **Data Seeding** | `npm run db:seed` | ✅ **PASS** | Idempotent candidate and telemetry seed data |
| **Production Build** | `npm run build` | ✅ **PASS** | Next.js 16 Turbopack production build succeeds with all routes compiled |
| **Single MongoClient** | Spec Rule 4 | ✅ **PASS** | Exactly 1 cached MongoClient instantiation in `apps/web/src/lib/db.ts` |

---

## ✨ Key Features & Capabilities

1. **🎯 Dynamic AI Job Criteria Engine**
   - Recruiters input rough role requirements for any position (e.g. *Senior React / Next.js Engineer*).
   - Gemini expands them into a comprehensive scoring specification:
     - **Must-Have Requirements** (mandatory deal-breakers)
     - **Nice-to-Haves** (bonus points)
     - **Red Flags & Anti-Patterns** (e.g. chronic short tenures, technology mismatches)
     - **0–100 Weighted Scoring Rubric**
     - **Targeted Screening Interview Questions**
   - Click **Activate Criteria** to automatically rescore existing pipeline candidates against the new rubric.

2. **📥 Multi-Modal Candidate Ingestion & LinkedIn Auto-Resolution**
   - **📋 Paste Text:** Instant, zero-friction paste of profile text, summaries, or cover letters.
   - **📄 PDF / Resume Upload:** Multi-page parsing using `pdf-parse`. Supports resume uploads and LinkedIn's native **"Save to PDF"** exports (which bypass web truncation and preserve 100% of descriptions, dates, and skills).
   - **🔗 Automated URL Scraper:** Headless profile fetching with automated fallback parsing.
   - **🌐 Auto LinkedIn Detection:** Automatically extracts LinkedIn profile links from candidate text or multiline sidebar exports (`linkedin.com/in/\nusername`), displaying direct profile links in the UI.

3. **⚡ AI Talent Scout — Automated LinkedIn Sourcing (PRO / Premium)**
   - **No Cookies Required:** Uses Apify Actor `harvestapi/linkedin-profile-search` (`M2FMdjRVeF1HPGFcc`) to search live LinkedIn candidate profiles without risk of browser session authwalls (HTTP 999).
   - **Intelligent JD-to-Filter Mapping:** Gemini analyzes freeform role requirements and maps them to exact LinkedIn search parameter IDs:
     - Experience range IDs (`1` to `5`)
     - Industry function IDs (`1` to `26`)
     - Seniority level IDs (`100` to `320`)
   - **One-Click Pipeline Ingestion:** Discovered candidates are automatically ingested into MongoDB, scored against the active job rubric with Gemini, and placed on the leaderboard.
   - **Deterministic Fallback:** Includes a pre-scouted pool of real engineering profiles for 100% reliable hackathon judging and offline evaluation.

4. **📊 Ranked Talent Leaderboard**
   - Real-time candidate sorting by **AI Match Score** (0–100).
   - Visual awards: 🥇 Gold, 🥈 Silver, and 🥉 Bronze badges for top candidates.
   - Priority indicators: `critical` (immediate interview), `high`, `medium`, and `low`.
   - Real-time KPI counters: Total candidates, AI evaluated, Top matches (≥80), and Average score.
   - Real-time search and status filtering (`processed`, `pending`, `failed`).

4. **🔍 Candidate Deep Dive (`/items/[id]`)**
   - **Strengths Breakdown:** Bulleted evidence-backed qualifications extracted by Gemini.
   - **Gaps & Weaknesses:** Flagged risks or missing skills for interview focus.
   - **Hiring Verdict:** Clear, objective hiring recommendation.
   - **Years of Experience:** Calculated career tenure.
   - **Direct Profile Links:** One-click navigation to candidate LinkedIn profiles.
   - **Profile Viewer:** Accessible view of original resume / profile text.

5. **🔄 Instant Re-evaluation & Pipeline Management**
   - **One-Click Re-eval:** Rescore any candidate immediately whenever job criteria changes with zero-latency UI refresh.
   - **Candidate Deletion:** Clean removal of candidates with multi-tenant session isolation and demo-user fallback support.

6. **💬 Context-Grounded RAG Chat**
   - Recruiter assistant embedded directly in each candidate profile.
   - Atlas Vector Search (768-dimensional embeddings via `gemini-embedding-001`) with automatic keyword fallback.
   - Interactive source citation pills linking claims directly to verified profile history.

7. **👥 Interactive Team Showcase (`/about`)**
   - Dedicated team portal profiling all members of **Team TensorSlow** with roles, engineering contributions, match scores, and direct LinkedIn profile links.

8. **⚡ Zero-Friction Judge Onboarding**
   - Better-Auth anonymous authentication allows judges and demo viewers to explore immediately by clicking **"Launch Demo Anonymously"** or **"Login as Demo User"** without email verification.

---

## ⚡ Quickstart: 0 to Running in 3 Minutes

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **npm**: `>= 10.x`
- **Docker Desktop**: Running locally for MongoDB Atlas Local (with vector search support)
- **Google Gemini API Key**: Free from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Step-by-Step Launch

```bash
# 1. Start MongoDB Atlas Local container (includes mongod + mongot vector search)
docker compose up -d

# 2. Copy and set up environment configuration
cp .env.example apps/web/.env.local
# Open apps/web/.env.local and add your GOOGLE_GENERATIVE_AI_API_KEY

# 3. Install dependencies across all workspaces
npm install

# 4. Generate compound indexes and Atlas Vector Search index definition
npm run db:indexes

# 5. Populate initial demo candidate data
npm run db:seed

# 6. Launch Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
* Click **"Launch Demo Anonymously"** or **"Login as Demo User"** to enter the candidate leaderboard.
* Click **"🎯 Job Criteria"** in the dashboard header to generate and activate your role rubric.
* Click **"Import Candidate"** to upload a resume or paste candidate text.

---

## 🔑 Configuration & Environment Variables

Environment variables are strictly validated at runtime using Zod in [`apps/web/src/lib/env.ts`](apps/web/src/lib/env.ts).

Configure `apps/web/.env.local`:

```env
# Database
MONGODB_URI="mongodb://localhost:27017/aicon?directConnection=true"
MONGODB_DB="aicon"

# Better Auth
BETTER_AUTH_SECRET="aicon-hackathon-development-secret-key-32-chars-minimum"
BETTER_AUTH_URL="http://localhost:3000"
ENABLE_DEMO_LOGIN="true"
DEMO_USER_EMAIL="demo@example.com"

# AI Model Keys (Get free from https://aistudio.google.com/)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
GOOGLE_GENERATIVE_AI_API_KEY_B=""

# Optional OpenRouter Fallback
OPENROUTER_API_KEY=""

# Chat Model: gemini-3.6-flash (recommended for fast ~2s streaming) or gemini-3.8-flash
CHAT_MODEL_ID="gemini-3.6-flash"

# Optional: LinkedIn Session Cookie for automated URL scraper
LINKEDIN_SESSION_COOKIE=""
```

> **Note on Offline Testing:** The test suite (`npm run test`), evals (`npm run evals`), and production build (`npm run build`) run **100% offline and key-free**. You only need `GOOGLE_GENERATIVE_AI_API_KEY` for live AI calls.

---

## 🗺️ Project Architecture & Anatomy

```
aicon-hackathon/
├── apps/
│   ├── web/                              # Full-stack Next.js 16 product
│   │   ├── src/app/                      # Next.js App Router (Turbopack)
│   │   │   ├── (marketing)/page.tsx      # Public landing page with Instant Demo CTA
│   │   │   ├── (app)/dashboard/          # Talent leaderboard, KPIs, and search/filter
│   │   │   │   ├── page.tsx              # Server component with real-time ranking
│   │   │   │   ├── import-candidate-button.tsx # 3-tab candidate importer (Paste, PDF, URL)
│   │   │   │   └── job-criteria-modal.tsx# Dynamic AI Job Criteria Generator
│   │   │   ├── (app)/items/[id]/page.tsx # Candidate deep-dive & embedded RAG chat
│   │   │   └── api/
│   │   │       ├── criteria/route.ts     # AI rubric expansion & batch rescoring
│   │   │       ├── scrape/route.ts       # PDF parsing & LinkedIn scraper route
│   │   │       ├── chat/route.ts         # Streaming RAG chat route
│   │   │       └── auth/                 # Better-Auth endpoints
│   │   ├── src/components/
│   │   │   ├── ai/                       # Chat, CitedText, and Structured Extraction
│   │   │   ├── error-boundary.tsx        # UI fault tolerance wrapper
│   │   │   └── ui/                       # Tailwind v4 UI primitives
│   │   └── src/lib/
│   │       ├── ai/                       # Gemini models, RAG retrieval, and prompts
│   │       ├── items/process.ts          # Unified candidate evaluation & embedding pipeline
│   │       ├── models/                   # Mongoose schemas (Item, JobCriteria, Chat, AiRun)
│   │       ├── domain.ts                 # Workforce recruiting domain configuration
│   │       └── db.ts                     # Single cached MongoClient connection pool
│   └── api/                              # Optional Python FastAPI sidecar
├── SETUP_GUIDE.md                        # Step-by-step local setup instructions
├── docker-compose.yml                    # MongoDB Atlas Local container definition
└── package.json                          # Workspace root configuration
```

---

## 🧪 Verification & Testing Matrix

Run the automated quality gates from the repository root:

```bash
# 1. Typecheck the entire monorepo (0 TS errors)
npm run typecheck

# 2. Lint code style (ESLint 9 Flat Config + TypeScript parser)
npm run lint

# 3. Run unit tests offline (55/55 tests passing across 6 suites)
npm run test

# 4. Run AI extraction evals (10 offline test cases)
npm run evals

# 5. Build production Next.js 16 bundle (Turbopack)
npm run build
```

---

## ❓ Troubleshooting FAQ

### 1. `MongoServerSelectionError: connection closed` on startup
**Cause:** MongoDB container is not running.  
**Fix:**
```powershell
docker compose up -d
npm run db:indexes
npm run db:seed
```

### 2. Gemini Quota / 429 Errors During Demos
**Cause:** Google AI Studio free-tier rate limit reached.  
**Fix:** Add `GOOGLE_GENERATIVE_AI_API_KEY_B` in `.env.local`. The system will automatically fail over to Key B without crashing.

### 3. LinkedIn Anti-Bot Block
**Cause:** LinkedIn requires authentication for profile viewing.  
**Fix:** Use the **"PDF / Resume"** tab (upload LinkedIn's built-in **"Save to PDF"** export for 100% complete data) or the **"Paste Text"** tab. Both bypass all rate limits and authwalls.

---

## ☁️ Deploying to Vercel

**Is TalentRank AI ready for Vercel?**  
**Yes, 100%!** The codebase is built with Next.js 16 App Router, Turbopack, and Vercel AI SDK v7. All routes compile statically/dynamically with 0 errors.

### 1. MongoDB Atlas Setup (Cloud Database)
Vercel serverless functions cannot connect to `localhost`. You need a cloud-hosted MongoDB instance:
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) since Vercel uses dynamic IP addresses.
3. Under **Database Access**, create a user and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/aicon?retryWrites=true&w=majority
   ```

### 2. Import Project on Vercel
1. Go to [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
2. Select your repository (GitLab or GitHub mirror).
3. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web` *(important for this monorepo)*
   - **Build Command**: `npm run build` (or leave default `next build`)
   - **Install Command**: `npm install`

### 3. Environment Variables on Vercel
Add the following keys in your Vercel Project Settings $\rightarrow$ **Environment Variables**:

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `MONGODB_DB` | `aicon` | Database name |
| `BETTER_AUTH_SECRET` | `(32+ random characters)` | Secret key for auth token encryption |
| `BETTER_AUTH_URL` | `https://your-project.vercel.app` | Production app URL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSy...` | Gemini API key from Google AI Studio |
| `CHAT_MODEL_ID` | `gemini-3.6-flash` | Gemini model for copilot RAG streaming |
| `APIFY_API_TOKEN` | `apify_api_...` | Apify API token for automated LinkedIn candidate scout |
| `ENABLE_DEMO_LOGIN` | `true` | Allows instant guest evaluation |
| `DEMO_USER_EMAIL` | `demo@example.com` | Demo account identity |

Click **Deploy**! Once deployed, run initial indexes on your Atlas cluster if needed:
```bash
npm run db:indexes --workspace=apps/web
```

---

## 🔄 GitLab & Workflow Guide

### How to Push Changes to GitLab
The repository has GitLab configured as the primary remote (`gitlab`), tracking branch `ahmed`:

```bash
# 1. Check current status and review modifications
git status

# 2. Stage your changes
git add .

# 3. Commit with a descriptive message
git commit -m "feat: your feature description"

# 4. Push to GitLab branch ahmed
git push gitlab ahmed
```

### How to Safely Close and Reopen the Project

#### To Close / Stop:
1. **Stop Next.js Dev Server**: In the terminal running `npm run dev`, press `Ctrl + C`.
2. **Stop MongoDB Container**:
   ```bash
   docker compose down
   ```
3. Close your IDE / terminal window.

#### To Reopen / Resume:
1. Open the project folder in terminal or VS Code / Antigravity.
2. **Start MongoDB**:
   ```bash
   docker compose up -d
   ```
3. **Start the Dev Server**:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). All candidate data, job criteria, and scoring rubrics are persisted in your local MongoDB volume.

---

## 👥 Team & Credits

**TalentRank AI** is developed and submitted for the **AICON Hackathon 2026** by:

### 🏆 Team **TensorSlow**
* **Muhammad Ahmed** — **Architecture, Core Engine & Full-Stack Lead**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318)
* **Mahad Ehtesham Hashmi** — **LinkedIn Scraping, Extraction & Data Pipelines**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/mahad-hashmi/)
* **Abdullah Anwar** — **Deployment, Features, Better Auth & Database**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/abdullah-anwar-cs/)
* **Muhammad Yahya Shahzad** — **UI/UX Design System & Frontend Architecture**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/myahyashahzad/)
* **Muhammad Hassan** — **Vector Embeddings, RAG & Semantic Search**  
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0A66C2?logo=linkedin)](https://www.linkedin.com/in/muhammad-hassan-035a78375)

- **GitLab Repository (Branch `ahmed`):** [https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed](https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed)
- **Interactive About Page:** Accessible from the top navigation menu at [`/about`](http://localhost:3000/about)
- **License:** MIT

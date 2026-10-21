# 💡 Project Explained: The Complete Guide to TalentRank AI

Welcome! If you are new to the codebase, evaluating this project for the hackathon, or looking to understand how all the moving parts connect without drowning in technical jargon, this guide is for you.

---

## 🧭 What is TalentRank AI?

Imagine hiring for a competitive role: you receive hundreds of applicant resumes and LinkedIn profiles.
- Reviewing them manually takes dozens of hours.
- Human fatigue leads to inconsistent scoring and bias.
- Many profiles hide critical details behind truncated web pages.

**TalentRank AI transforms candidate evaluation into an automated, transparent, and bias-free pipeline:**
1. **Dynamic Job Rubrics:** The recruiter writes rough bullet points for any role, and Gemini expands them into a mathematically sound 0–100 rubric, dealbreakers, and targeted screening questions.
2. **Multi-Modal Ingestion:** Ingest profiles via text paste, raw resumes, or LinkedIn's built-in **"Save to PDF"** exports (parsed with `pdf-parse` to retain 100% of un-truncated text).
3. **Structured AI Evaluation:** Gemini extracts verified strengths, weakness flags, hiring verdicts, and tenure calculations.
4. **Ranked Leaderboard:** Candidates are ranked with Gold/Silver/Bronze badges and filtered by priority.
5. **Context-Grounded RAG Chat:** Recruiters can drill down into any candidate's background using an AI recruiter chat grounded directly in the candidate's verified profile data.

---

## 🎯 The Workforce Recruiting Architecture

The core domain configuration lives in [`apps/web/src/lib/domain.ts`](apps/web/src/lib/domain.ts):

```typescript
export const ACTIVE_DOMAIN_ID: DomainId = "workforce_recruiting";
```

### What Happens Across the Application:
* **The Labels:** "Items" are treated as **Candidates**, categorized by **Role Fit** (`Strong Fit`, `Potential`, `Unqualified`), prioritized by urgency (`critical`, `high`, `low`), and ranked by **Match Score** (0–100).
* **The Structured Schema (`RecruitmentFieldsSchema`):** Automatically extracts:
  - `strengths`: Evidence-backed reasons the candidate fits the requirements.
  - `weaknesses`: Missing skills, tenure gaps, or risks to investigate.
  - `verdict`: Clear, objective hiring recommendation.
  - `yearsOfExperience`: Total career tenure.
* **The Dynamic Criteria Engine (`JobCriteriaModel` & `/api/criteria`):** If a recruiter specifies a custom role, the evaluation prompt dynamically injects the active role criteria into Gemini's extraction pipeline, ensuring candidate scores reflect the exact position being hired for.

---

## 🔄 The Complete Candidate Journey: How Everything Connects

```
[ Recruiter / Judge Browser ]
       │
       ▼
1. Visit Landing Page ──► Click "Launch Demo Anonymously" or "Login as Demo User"
       │
       ▼
2. Better Auth Session ──► Issues an authenticated session cookie (zero signup friction!)
       │
       ▼
3. Define Criteria ─────► 🎯 Job Criteria modal expands role notes into 0-100 rubric & questions
       │
       ▼
4. Ingest Candidate ────► A. Paste Text (instant paste)
                          B. Upload PDF / LinkedIn "Save to PDF" (parsed via pdf-parse)
                          C. Automated URL Scrape
       │
       ▼
5. Unified AI Pipeline ──► A. Gemini extracts strengths, weaknesses, verdict, tenure, & score
   (lib/items/process.ts) ──► B. Gemini Embedding 001 creates 768-dimensional vector embedding
                          ──► C. Persists everything in MongoDB with "processed" status
       │
       ▼
6. Talent Leaderboard ──► Candidates sorted by score (🥇 Gold, 🥈 Silver, 🥉 Bronze)
       │
       ▼
7. Candidate Deep-Dive ─► In /items/[id], inspect Strengths, Gaps, Verdict, and Profile history
       │
       ▼
8. Interactive RAG Chat ─► Ask questions; Gemini answers citing exact profile experiences [[item:id|title]]
       │
       ▼
9. Clickable Citations ──► CitedText converts markers into interactive badge chips on the UI!
```

---

## 🍃 Why MongoDB Atlas is Essential for This Architecture

### 1. Polymorphic Candidate Data
Candidate profiles vary wildly: some have GitHub repositories, patents, and publications; others have traditional corporate tenures or certifications. 
MongoDB stores these rich structures natively in `item.fields` without requiring rigid schema alterations or table migrations.

### 2. Unified Vector Search & Operational Data
You don't need a separate database for vectors (like Pinecone) and another for candidate records (like PostgreSQL).
MongoDB Atlas handles both standard CRUD queries (filtering by status, sorting by score) and 768-dimensional vector similarity searches in a single database.

### 3. Dual Connection Architecture (`apps/web/src/lib/db.ts`):
1. **The Native Driver (`MongoClient`)**: 
   * Direct, lightweight connection used by **Better Auth** for fast session verification.
   * Cached on `globalThis` as a single instance to prevent connection exhaustion during Next.js Turbopack reloads.
2. **Mongoose (`connectMongoose`)**:
   * Provides structured data modeling, type-safe queries, and schema validation for `ItemModel`, `JobCriteriaModel`, `ChatThreadModel`, and `AiRunModel`.

---

## 🧠 Vector Search & Candidate RAG (In Plain English)

### 1. Vector Embeddings
Computers cannot interpret raw career context directly.
When a candidate profile is ingested, Gemini's embedding model (`gemini-embedding-001`) maps the text into **768 mathematical coordinates**.
- Profiles with similar technologies (e.g. *Next.js*, *React*, *Tailwind*) map closely together in vector space.

### 2. Atlas Vector Search
When a recruiter asks: *"Does this candidate have experience scaling real-time web applications?"*, Atlas compares the question's vector against candidate experience chunks and retrieves the most relevant background snippets.

### 3. RAG (Retrieval-Augmented Generation)
1. The recruiter's question is converted into an embedding.
2. MongoDB Vector Search retrieves the top matching career experience chunks.
3. The server injects those chunks into Gemini inside `<source>` blocks.
4. Gemini answers the recruiter's question strictly grounded in verified facts, citing exact sources using `[[item:<id>|<title>]]`.

---

## 📎 Interactive Citations: How `CitedText` Works

When the AI recruiter answers a question, it cites evidence:
1. Gemini produces a structured citation:
   > *"The candidate led frontend architecture at EdTech Solutions for 3 years [[item:6ac9...|Candidate Profile]]."*
2. On the frontend, [`CitedText.tsx`](apps/web/src/components/ai/cited-text.tsx) detects these markers and renders them as clickable pill buttons.
3. Clicking the pill displays the exact source item directly on screen.

---

## 🛠️ Complete Tech Stack

* **Next.js 16 (App Router + Turbopack)**: High-performance full-stack framework with React Server Components.
* **React 19**: Modern UI library with Server Actions and fast component updates.
* **Vercel AI SDK v7 (`ai`, `@ai-sdk/react`)**: The industry standard for streaming chat (`streamText`), structured outputs (`generateObject`), and client hooks (`useChat`).
* **Google Gemini 3 (`@ai-sdk/google`)**:
  - `gemini-3.6-flash` / `gemini-3.8-flash`: High-speed candidate evaluation and streaming chat.
  - `gemini-3.5-flash-lite`: Fast, cost-efficient structured extraction.
  - `gemini-embedding-001`: Generates 768-dimensional semantic embeddings.
* **Better Auth**: TypeScript authentication supporting 1-click **Anonymous sessions** and **Demo logins** for instant judge access.
* **pdf-parse**: High-fidelity multi-page PDF text extraction for resumes and LinkedIn PDF exports.
* **MongoDB Atlas Local / Cloud**: Single unified datastore for relational metadata and vector embeddings.
* **Tailwind CSS v4**: Ultra-fast utility styling with modern glassmorphism.

---

## 🏁 How to Run & Verify

1. Follow [`SETUP_GUIDE.md`](SETUP_GUIDE.md) to set up your `.env.local` and launch MongoDB.
2. Run `npm run test` to verify all 33 unit tests pass.
3. Run `npm run evals` to verify the 10/10 AI extraction cases pass.
4. Run `npm run dev` and explore TalentRank AI at [http://localhost:3000](http://localhost:3000)!

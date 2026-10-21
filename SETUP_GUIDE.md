# Local Development Setup Guide — TalentRank AI

Welcome to **TalentRank AI**, an AI-powered talent intelligence and automated candidate evaluation platform. This step-by-step checklist will guide you through running the application locally on your machine.

---

## Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **MongoDB** (running locally via Docker or local service on port 27017)
- **Google Chrome** (for automated headless LinkedIn scraping via Puppeteer)
- **Git**

---

## Step-by-Step Checklist

### 1. Install Dependencies
Install all required Node.js packages across the workspace:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `apps/web/.env.local` (or copy `.env.example`):
```env
# Database
MONGODB_URI="mongodb://localhost:27017/aicon?directConnection=true"
MONGODB_DB="aicon"

# Better Auth
BETTER_AUTH_SECRET="aicon-hackathon-development-secret-key-32-chars-minimum"
BETTER_AUTH_URL="http://localhost:3000"
ENABLE_DEMO_LOGIN="true"
DEMO_USER_EMAIL="demo@example.com"

# AI Model Keys
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
OPENROUTER_API_KEY=""

# Chat Model: gemini-3.6-flash (recommended for fast ~3s streaming) or gemini-3.8-flash
CHAT_MODEL_ID="gemini-3.6-flash"

# Apify API Token for automated LinkedIn candidate scout (PRO feature)
APIFY_API_TOKEN=""

# Optional: Automated LinkedIn Scraper Session Cookie
LINKEDIN_SESSION_COOKIE=""
```

**Where to get your keys:**
- **Google Gemini API Key (`GOOGLE_GENERATIVE_AI_API_KEY`)**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) to generate your key.
- **Apify API Token (`APIFY_API_TOKEN`)**: Free token from [Apify](https://apify.com) powering Actor `M2FMdjRVeF1HPGFcc` for cookie-free LinkedIn candidate search.
- **OpenRouter API Key (`OPENROUTER_API_KEY`)**: Optional fallback key from [OpenRouter](https://openrouter.ai/keys).
- **LinkedIn Session Cookie (`LINKEDIN_SESSION_COOKIE`)**: 
  - LinkedIn requires authentication to view profiles (unauthenticated requests are blocked with HTTP 999 Authwall).
  - To enable live URL scraping: Open LinkedIn in your browser (logged in) $\rightarrow$ Press `F12` (DevTools) $\rightarrow$ `Application` $\rightarrow$ `Cookies` $\rightarrow$ copy the value of the `li_at` cookie $\rightarrow$ paste it into `LINKEDIN_SESSION_COOKIE`.
  - **Zero-cookie Alternative:** You can also use the **"Paste Text"** or **"PDF / Resume"** tabs in the Import dialog to evaluate candidates with zero risk and 100% complete data.

---

### 3. Start MongoDB
If using Docker, start MongoDB with:
```bash
docker compose up -d
```
*(Or ensure your local MongoDB service is running on `mongodb://localhost:27017`)*.

---

### 4. Seed Initial Candidates (Optional)
To populate demo candidates:
```bash
npm run db:seed
```

---

### 5. Start the Development Server
```bash
npm run dev
```

---

### 6. Access the Application
Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

- **Login / Demo Access:** Click "Launch Demo Anonymously" or "Login as Demo User" to view the candidate leaderboard.
- **🎯 Dynamic Job Criteria:** Click the "Job Criteria" button in the dashboard to have Gemini expand your role requirements into a custom 0-100 rubric, must-haves, nice-to-haves, red flags, and interview questions. All candidates will automatically be rescored!
- **⚡ AI Talent Scout (PRO):** Click the gleaming amber "AI Scout" button in the dashboard to automatically discover, scrape, and rank active candidates from LinkedIn matching your active job criteria (powered by Apify Actor `M2FMdjRVeF1HPGFcc`).
- **📥 Import Candidates:**
  - **Paste Text:** Paste profile text or resume directly for instant evaluation.
  - **PDF / Resume:** Upload a resume or LinkedIn's built-in **"Save to PDF"** export for 100% un-truncated data.
  - **URL Scrape:** Automated profile fetching.
- **🔍 Candidate Deep Dive:** Click into any candidate to view their AI Match Score, Strengths, Weaknesses, Verdict, and chat with the AI talent recruiter using RAG grounded directly in their profile history.

---

## 🔄 Daily Workflow: How to Close and Reopen

### How to Stop / Close the Application
1. In the terminal running `npm run dev`, press `Ctrl + C` (or `Y` when prompted).
2. Stop the local MongoDB container:
   ```bash
   docker compose down
   ```
3. You can safely close your terminal and IDE.

### How to Reopen / Resume Work
1. Open your terminal in `c:\Users\ANC\Documents\Me\Projects\Aicon\aicon-hackathon`.
2. Start the database:
   ```bash
   docker compose up -d
   ```
3. Start the Next.js server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000). All candidate data, job criteria, and scoring rubrics are persisted in your local MongoDB volume.

---

## 📤 How to Push to GitLab

The project uses GitLab (`gitlab`) as its central repository:

```bash
# 1. Review changed files
git status

# 2. Stage changes
git add .

# 3. Commit
git commit -m "feat: describe your change"

# 4. Push to GitLab
git push gitlab ahmed
```
*(Branch `ahmed` tracks `gitlab/ahmed`)*

---

## ☁️ Deploying to Vercel (Production)

TalentRank AI is **100% production-ready for Vercel**!

### Step 1: Create a Free MongoDB Atlas Database
Because Vercel serverless functions run in the cloud, they need a hosted MongoDB Atlas cloud connection:
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 Shared cluster.
2. In **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) so Vercel serverless lambdas can connect.
3. In **Database Access**, create a database user and copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`

### Step 2: Import into Vercel
1. In your [Vercel Dashboard](https://vercel.com), click **Add New** $\rightarrow$ **Project**.
2. Connect your GitLab repository: `ahmed-group802741/talentrank-ai` (select branch `ahmed`).
3. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click "Edit" and choose `apps/web`
   - **Build Command**: `next build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 3: Set Environment Variables in Vercel
Add the following in Vercel Settings $\rightarrow$ Environment Variables:

| Environment Variable | Recommended Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `MONGODB_DB` | `aicon` | Database name |
| `BETTER_AUTH_SECRET` | `32+ characters random string` | e.g. `cf5ca69000464c7dfae93dea1bd5d4b4d48e608989cf8310aa8e820f4f248456` |
| `BETTER_AUTH_URL` | `https://your-project.vercel.app` | Your production Vercel URL |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Matches BETTER_AUTH_URL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `your-gemini-key` | Google Gemini API key from AI Studio |
| `CHAT_MODEL_ID` | `gemini-3.6-flash` | Gemini 3.6 Flash |
| `APIFY_API_TOKEN` | `your-apify-token` | Apify token for automated candidate scouting |
| `DEMO_USER_EMAIL` | `demo@example.com` | Demo account email |

Click **Deploy**!

---

## 👥 Team & Credits

**TalentRank AI** — Built for the **AICON Hackathon 2026**

### 🏆 Team **TensorSlow**
* **Muhammad Ahmed** — **Architecture, Core Engine & Full-Stack Lead**
* **Mahad Ehtesham Hashmi** — **LinkedIn Scraping, Extraction & Data Pipelines**
* **Abdullah Anwar** — **Deployment, Features, Better Auth & Database**
* **Muhammad Yahya Shahzad** — **UI/UX Design System & Frontend Architecture**
* **Muhammad Hassan** — **Vector Embeddings, RAG & Semantic Search**

- **GitLab Repository (Branch `ahmed`):** [https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed](https://gitlab.com/ahmed-group802741/talentrank-ai/-/tree/ahmed)
- **License:** MIT

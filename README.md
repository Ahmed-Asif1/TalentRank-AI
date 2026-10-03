# AICON Hackathon — AI Application Starter

An app-agnostic, production-grade AI application starter foundation built for high-velocity hackathons and robust production deployment.

**Core Stack**: Next.js 16 (App Router & Turbopack) · React 19 · TypeScript · Vercel AI SDK v7 · Google Gemini 3 · MongoDB Atlas Local & Cloud Vector Search · Better Auth · Tailwind CSS v4 · Zod · Optional FastAPI Sidecar

> 📖 **Looking for a beginner-friendly overview?** Check out [EXPLAIN.md](EXPLAIN.md) for a simple explanation of how everything works, how the Domain Layer lets you switch products in 1 line, what Vector Search is, and how citations connect together!

---

## 📋 Table of Contents
- [Project Status & Health](#-project-status--health)
- [Quickstart: Zero to Running in 5 Minutes](#-quickstart-zero-to-running-in-5-minutes)
- [The Domain-Adaptable Architecture](#-the-domain-adaptable-architecture)
- [Configuration & API Keys](#-configuration--api-keys)
- [Project Architecture & Anatomy](#-project-architecture--anatomy)
  - [1. User Interface & Interactive Citations](#1-user-interface--interactive-citations)
  - [2. Database & Data Models](#2-database--data-models)
  - [3. API Endpoints & Authentication](#3-api-endpoints--authentication)
  - [4. AI Spine & Automation](#4-ai-spine--automation)
  - [5. Python FastAPI Sidecar](#5-python-fastapi-sidecar)
- [Testing & Verification Suite](#-testing--verification-suite)
- [Best Practices & Architectural Invariants](#-best-practices--architectural-invariants)
- [CI/CD & Repository Automation](#-cicd--repository-automation)
- [Troubleshooting FAQ](#-troubleshooting-faq)

---

## 🚀 Project Status & Health

All core modules, domain registries, and quality gates have been implemented and independently verified:

| Pipeline Gate | Target | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Type Integrity** | `npm run typecheck` | ✅ PASS | 0 TypeScript errors across monorepo |
| **Code Style & Lint** | `npm run lint` | ✅ PASS | 0 errors via ESLint 9 native flat configuration |
| **Unit Test Suite** | `npm run test` | ✅ PASS | **38/38 unit tests pass** offline across 4 test suites |
| **AI Evaluation Suite** | `npm run evals` | ✅ PASS | **10/10 structured extraction test cases pass** |
| **Database Indexes** | `npm run db:indexes` | ✅ PASS | Compound B-tree + Atlas Vector Search (768d HNSW) validated |
| **Data Seeding** | `npm run db:seed` | ✅ PASS | Idempotent seed (7 items, 3 threads, 5 AI telemetry runs) |
| **Live Re-Embedding** | `npm run db:reembed` | ✅ PASS | Batch-embeds records with live `gemini-embedding-001` vectors |
| **Production Build** | `npm run build` | ✅ PASS | Offline Next.js 16 Turbopack build succeeds in ~5.1s |
| **Single MongoClient** | Spec Rule 4 | ✅ PASS | Exactly 1 cached MongoClient instantiation in `src/lib/db.ts` |

---

## ⚡ Quickstart: Zero to Running in 5 Minutes

### Prerequisites
- **Node.js**: `>= 22.0.0` (required for Vercel AI SDK v7 Core)
- **npm**: `>= 10.x` (monorepo uses npm workspaces; pnpm/yarn/bun are not configured)
- **Docker Desktop**: Running locally for MongoDB Atlas Local (with local vector search support)
- **Python** *(optional)*: `>= 3.12` and `uv` if running the Python FastAPI sidecar

### Step-by-Step Launch

```bash
# 1. Start MongoDB Atlas Local container (includes mongod + mongot vector search + keyfile volume)
docker compose up -d

# 2. Copy and set up environment configuration
cp .env.example apps/web/.env.local

# 3. Install dependencies across all workspaces
npm install

# 4. Generate compound indexes and Atlas Vector Search index definition
npm run db:indexes

# 5. Populate initial demo seed data (items, threads, telemetry)
npm run db:seed

# 6. (Optional) Re-embed records with live Gemini vectors if you added your API key
npm run db:reembed

# 7. Launch Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
* Click **"Login as Demo User"** for instant access to the pre-seeded demo workspace with realistic artifacts, conversation history, and telemetry.
* Or click **"Launch Demo Anonymously"** to test zero-friction guest onboarding for judges.

---

## 🎯 The Domain-Adaptable Architecture

The repository features a **Domain Registry** in [`apps/web/src/lib/domain.ts`](apps/web/src/lib/domain.ts). This allows your team to change the entire product idea in **one line of code** without database migrations or schema churn:

```typescript
// apps/web/src/lib/domain.ts
export const ACTIVE_DOMAIN_ID: DomainId = "contracts"; // "generic" | "contracts" | "meetings" | "tickets"
```

### What Follows Automatically When You Flip the Domain:
1. **Entity Labels:** "Items" ➔ "Contracts" / "Meetings" / "Tickets"
2. **Severity & Risk Meters:** Color-coded priority badges (`low`, `medium`, `high`, `critical`) and 0–100 score meters.
3. **Structured Extraction (`DomainExtractSchema`):** Automatically extracts domain-specific JSON payloads into `item.fields` (e.g., contract clauses, meeting action items with owners, or ticket sentiment).
4. **Chat Persona & Guardrails:** Guides the assistant's tone (e.g., careful contract analyst vs. chief of staff vs. support lead).
5. **Interactive Landing Page:** Automatically updates the hero problem/solution copy and live `PreviewCard`.
6. **Quick Prompts:** Provides 1-click domain-relevant starter questions in the chat.

---

## 🔑 Configuration & API Keys

Environment variables are validated on server startup using strict Zod schemas in [`apps/web/src/lib/env.ts`](apps/web/src/lib/env.ts).

Create `.env.local` inside `apps/web/.env.local`:

```bash
# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
# Local Atlas Local container (default) or MongoDB Atlas Cloud SRV string
MONGODB_URI="mongodb://localhost/?directConnection=true"
MONGODB_DB="aicon"

# ==============================================================================
# AUTHENTICATION (Better Auth)
# ==============================================================================
# Random 32+ character secret for HMAC cookie signing (openssl rand -base64 32)
BETTER_AUTH_SECRET="aicon-hackathon-development-secret-key-32-chars-minimum"
# Canonical base URL for auth redirects and callbacks
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ==============================================================================
# AI PROVIDERS & GATEWAY (Keys optional for offline tests)
# ==============================================================================
# Primary Gemini API Key (get free from https://aistudio.google.com/)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

# Secondary Gemini API Key (automatic fallback if primary encounters 429 quota exhaustion)
GOOGLE_GENERATIVE_AI_API_KEY_B=""

# Vercel AI Gateway Key (optional BYOK routing)
AI_GATEWAY_API_KEY=""

# ==============================================================================
# CLOUD STORAGE & RATE LIMITING
# ==============================================================================
# Vercel Blob read/write token for direct cloud uploads (no local disk writes)
BLOB_READ_WRITE_TOKEN=""

# Upstash Redis REST credentials for distributed sliding-window rate limiting
# (Falls back gracefully to in-memory rate limiting if left empty)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Sentry DSN for error monitoring
SENTRY_DSN=""

# Seeded Demo User Identity
DEMO_USER_EMAIL="demo@example.com"
```

> **Note on Keys:** The test suite, evaluation script, and production build run **100% offline and key-free**. You only need `GOOGLE_GENERATIVE_AI_API_KEY` when testing real live Gemini LLM calls and vector re-embedding.

---

## 🗺️ Project Architecture & Anatomy

The repository is organized as a clean, modular monorepo:

```
aicon-hackathon/
├── apps/
│   ├── web/                              # Primary full-stack Next.js 16 product
│   │   ├── src/app/                      # Next.js App Router (UI & API Routes)
│   │   │   ├── (marketing)/page.tsx      # Public landing page with Demo User CTA & PreviewCard
│   │   │   ├── (app)/dashboard/page.tsx  # Workspace dashboard (KPI metrics & filtered table)
│   │   │   ├── (app)/items/[id]/page.tsx # Item inspector, SeverityBadge, FieldsPanel, and RAG chat
│   │   │   └── api/                      # REST, streaming chat, and demo auth route handlers
│   │   ├── src/components/
│   │   │   ├── ai/                       # Chat, CitedText, and Structured Extraction components
│   │   │   ├── domain/                   # SeverityBadge and FieldsPanel domain components
│   │   │   ├── marketing/                # Interactive PreviewCard component
│   │   │   └── ui/                       # shadcn/ui design primitives
│   │   ├── src/lib/
│   │   │   ├── ai/                       # AI models, RAG retrieval, extraction, and session-scoped tools
│   │   │   ├── items/process.ts          # Unified extract + embed + save pipeline
│   │   │   ├── models/                   # Mongoose schemas (Item, Thread, Message, AiRun)
│   │   │   ├── domain.ts                 # Central domain registry & schemas
│   │   │   ├── contracts.ts              # Zod interfaces and cross-boundary types
│   │   │   ├── auth.ts                   # Better Auth server configuration
│   │   │   ├── auth-client.ts            # Client-side React auth client
│   │   │   └── db.ts                     # Single cached MongoClient & Mongoose pool
│   │   ├── src/scripts/                  # db:indexes, db:seed, db:reembed, and evals scripts
│   │   └── proxy.ts                      # Next 16 routing convention (replaces middleware.ts)
│   └── api/                              # Optional Python FastAPI sidecar (ML/OCR escape hatch)
├── packages/
│   └── shared/                           # Shared TypeScript contracts and schema definitions
├── .github/
│   ├── workflows/ci.yml                  # GitHub Actions CI matrix (Typecheck, Lint, Test, Evals, Build)
│   ├── workflows/codeql.yml              # CodeQL security & vulnerability scanning
│   ├── dependabot.yml                    # Automated dependency update schedule
│   ├── pull_request_template.md          # Standardized PR review checklist
│   └── ISSUE_TEMPLATE/                   # Professional GitHub issue forms
├── docker-compose.yml                    # Local MongoDB Atlas container configuration with keyfile volume
└── package.json                          # Workspace root orchestrator
```

### 1. User Interface & Interactive Citations
* **Landing Page** ([`apps/web/src/app/(marketing)/page.tsx`](apps/web/src/app/(marketing)/page.tsx)): Features dynamic domain problem/solution copy, interactive [`PreviewCard`](apps/web/src/components/marketing/preview-card.tsx), and 1-click **"Login as Demo User"** bypass.
* **Workspace Dashboard** ([`apps/web/src/app/(app)/dashboard/page.tsx`](apps/web/src/app/(app)/dashboard/page.tsx)): Displays KPI metrics (total, analyzed, high severity, average score), severity and status dropdown filters, search bar, and tabular artifact browser.
* **Interactive Citations (`CitedText`)** ([`apps/web/src/components/ai/cited-text.tsx`](apps/web/src/components/ai/cited-text.tsx)): Converts assistant citation markers (`[[item:<id>|<title>]]`) into clickable badge pills linking directly to source items.
* **Domain UI Panels** ([`apps/web/src/components/domain/`](apps/web/src/components/domain/)):
  * [`SeverityBadge`](apps/web/src/components/domain/severity-badge.tsx): Color-coded priority badges (`low`, `medium`, `high`, `critical`).
  * [`FieldsPanel`](apps/web/src/components/domain/fields-panel.tsx): Humanizes and renders extracted polymorphic key-value domain fields.

### 2. Database & Data Models
* **Dual Connection Architecture** ([`apps/web/src/lib/db.ts`](apps/web/src/lib/db.ts)):
  * **Native MongoClient** via `getMongoClient()`: Cached on `globalThis` to preserve connection pool limits across Next.js Turbopack reloads. Instantiated **exactly once**.
  * **Mongoose Connection Pool** via `connectMongoose()`: Required by Server Components and API routes querying Mongoose models.
* **Mongoose Schemas** ([`apps/web/src/lib/models/`](apps/web/src/lib/models/)):
  * [`ItemModel`](apps/web/src/lib/models/item.ts): User-owned artifacts with category, severity, score, dynamic `fields: Schema.Types.Mixed`, and 768d vector embeddings.
  * [`ChatThreadModel`](apps/web/src/lib/models/chat-thread.ts) & [`ChatMessageModel`](apps/web/src/lib/models/chat-message.ts): Multi-turn conversation history.
  * [`AiRunModel`](apps/web/src/lib/models/ai-run.ts): Observability log tracking input/output tokens, reasoning tokens, cache-read tokens, latency, and estimated cost.
* **Indexing Script** ([`apps/web/src/scripts/create-indexes.ts`](apps/web/src/scripts/create-indexes.ts)): Automatically builds compound B-tree indexes and registers the 768-dimensional Atlas Vector Search index.
* **Seed Script** ([`apps/web/src/scripts/seed.ts`](apps/web/src/scripts/seed.ts)): Completely idempotent seeding script with deterministic embedding vectors.
* **Re-Embed Script** ([`apps/web/src/scripts/reembed.ts`](apps/web/src/scripts/reembed.ts)): Re-embeds seeded items with live Gemini 768d vectors before presentations.

### 3. API Endpoints & Authentication
* **Better Auth Handler** ([`apps/web/src/app/api/auth/[...all]/route.ts`](apps/web/src/app/api/auth/[...all]/route.ts)): Handles session management, anonymous session provisioning, and magic link authentication.
* **Demo Sign-In** ([`apps/web/src/app/api/auth/demo/route.ts`](apps/web/src/app/api/auth/demo/route.ts)): Creates an authenticated session for `demo@example.com` with cryptographic HMAC cookie signing.
* **Streaming Chat** ([`apps/web/src/app/api/chat/route.ts`](apps/web/src/app/api/chat/route.ts)): Real-time UI message stream powered by AI SDK v7, with RAG context retrieval, source formatting, session-scoped tool execution, and telemetry logging.
* **Artifacts REST API** ([`apps/web/src/app/api/items/route.ts`](apps/web/src/app/api/items/route.ts)): Scoped CRUD operations for user artifacts.

### 4. AI Spine & Automation
* **Models & Failover** ([`apps/web/src/lib/ai/models.ts`](apps/web/src/lib/ai/models.ts)):
  * Chat: **`gemini-3.8-flash`** (with automatic fallback to key B on 429 quota exhaustion).
  * Fast extraction: **`gemini-3.5-flash-lite`**.
  * Embeddings: **`gemini-embedding-001`** (768 dimensions via provider options).
* **Unified Pipeline** ([`apps/web/src/lib/items/process.ts`](apps/web/src/lib/items/process.ts)): Single `processItem(id, ownerId)` function used across manual creation, chat tool calls, and background re-runs.
* **Vector Search & RAG** ([`apps/web/src/lib/ai/rag.ts`](apps/web/src/lib/ai/rag.ts)): 768-dimensional embeddings with `$vectorSearch` and automatic keyword fallback if the index is offline.
* **Session-Scoped Tools** ([`apps/web/src/lib/ai/tools.ts`](apps/web/src/lib/ai/tools.ts)): `createTools(ownerId)` ensures every query is strictly tenant-isolated (`searchItems`, `getItem`, `createItem`, `getPortfolioStats`, `compareItems`).

### 5. Python FastAPI Sidecar
* **Path**: [`apps/api/`](apps/api/)
* **Purpose**: Optional sidecar for heavy Python ML workloads (OCR, Docling, HuggingFace embeddings). `apps/web` remains 100% functional standalone without requiring the sidecar.

---

## 🧪 Testing & Verification Suite

All commands are run from the repository root:

```bash
# 1. Typecheck the entire monorepo (Zero TS errors)
npm run typecheck

# 2. Lint code style (ESLint 9 Flat Config)
npm run lint

# 3. Run unit tests offline (38/38 passing across all modules)
npm run test

# 4. Run AI structured extraction evals (10 offline test cases)
npm run evals

# 5. Verify database indexes (Compound B-tree & Atlas Vector Search)
npm run db:indexes

# 6. Verify database seed idempotency
npm run db:seed

# 7. Refresh vector embeddings using live Gemini API key
npm run db:reembed

# 8. Verify offline production build (Turbopack)
npm run build
```

---

## 🛡️ Best Practices & Architectural Invariants

1. **Exact-Single `MongoClient` Instance:**
   Constructing `new MongoClient` per request quickly exhausts connection pools on serverless architectures. All database connections must go through `getMongoClient()` or `connectToDatabase()` in [`apps/web/src/lib/db.ts`](apps/web/src/lib/db.ts).
2. **Server-Derived `ownerId`:**
   Client requests must never supply `ownerId` in request bodies. Route handlers derive `ownerId` directly from the validated session via `auth.api.getSession()`.
3. **No Filesystem Storage in Serverless:**
   Serverless environments (Vercel, AWS Lambda) have ephemeral filesystems. File uploads must stream directly to cloud object storage (`@vercel/blob`).
4. **Offline Test Determinism:**
   Unit tests and evaluations must never depend on live third-party API credentials or network availability. Use `MockLanguageModelV3` and `MockEmbeddingModelV3` for test assertions.
5. **Polymorphic Schemas Without Migrations:**
   Domain-specific extraction results are stored in `item.fields` (Mongoose `Mixed`), validated at runtime by Zod schemas in `lib/domain.ts`.

---

## 🚢 CI/CD & Repository Automation

* **Continuous Integration (`.github/workflows/ci.yml`)**: Matrix workflow verifying `typecheck`, `lint`, `test`, `evals`, and `build` on every push and pull request.
* **CodeQL Security Scanning (`.github/workflows/codeql.yml`)**: Automated security scanning with conditional SARIF upload handling for private and public repository visibility.
* **Dependabot (`.github/dependabot.yml`)**: Automated monthly dependency updates for npm packages and GitHub Actions.

---

## ❓ Troubleshooting FAQ

### 1. `MongoServerSelectionError: connection closed` on startup
**Cause:** MongoDB Atlas Local container is not running or crashed.
**Fix:**
```powershell
docker compose down -v
docker compose up -d
npm run db:indexes
npm run db:seed
```

### 2. `Error reading file /data/configdb/keyfile: No such file or directory`
**Cause:** Docker volume configuration missing the configdb mount.
**Fix:** Ensure your `docker-compose.yml` mounts both `atlas-data:/data/db` and `atlas-config:/data/configdb`. Then reset with `docker compose down -v && docker compose up -d`.

### 3. Gemini Quota / 429 Errors During Demos
**Cause:** Google AI Studio free-tier rate limit (15 requests/min) reached.
**Fix:** Add `GOOGLE_GENERATIVE_AI_API_KEY_B` in `.env.local`. The built-in failover wrapper will automatically swap keys transparently without crashing your demo.

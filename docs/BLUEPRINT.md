# AICON Hackathon — Ship-Ready App Blueprint

> **What this is.** The full architecture plan for the team: what exists today,
> the decisions we made and *why*, the verified stack, the data model, the
> AI-layer design, deployment, timeline, and the risks that kill hackathon
> projects. Written 28 September 2026.
>
> **Companion docs:**
> - `docs/SYSTEM_PROMPT.md` — the copy-paste prompt that generates the Phase 0/1 code
> - `docs/AGENT_ORCHESTRATION.md` — the multi-agent layer (ownership map, waves, prompts)
> - `docs/STUDENT_PACK_CHECKLIST.md` — perks to claim
>
> **Status:** decisions locked except the product domain, which is deliberately
> deferred. Phase 0/1 builds a domain-agnostic spine.

---

## 1. Where the repo stands today

| Item | State |
|---|---|
| `pyproject.toml` | FastAPI + uvicorn, `requires-python = ">=3.14"`, `uv` + `uv_build` |
| `src/aicon_hackathon/main.py` | 18 lines: CORS wildcard, one `GET /` route |
| `uv.lock` | Committed ✅ |
| `.gitignore` | Python only — **no Node entries** |
| Frontend | **Does not exist** |
| `.env` / config module | **Missing** |
| Tests, CI, Docker, docs | **Missing** |

**Verified local environment:** Windows · Node v26.7.0 · npm 12.0.2 · Docker
29.8.0 · git 2.55.0 · Python 3.14.7 · **pnpm not installed** (so npm it is).

### Three real bugs already in the scaffold

Fix these in Phase 0 — they will otherwise cost someone an afternoon.

1. **`[project.scripts] aicon-hackathon = "aicon_hackathon.main:app"` is invalid.**
   A console-script entry point must be a *callable*. `app` is a `FastAPI`
   instance. `uv run aicon-hackathon` fails. Fix: add a `run()` function that
   calls `uvicorn.run(...)` and point the script at it.

2. **`allow_origins=["*"]` with `allow_credentials=True` is invalid per the CORS
   spec.** Browsers reject wildcard-plus-credentials. Cookie/token auth fails
   mysteriously. Fix: explicit origin list read from env.

3. **`requires-python = ">=3.14"`** is too tight if Python is kept for heavy AI.
   A large slice of the AI/ML ecosystem still ships no 3.14 wheels (torch,
   onnxruntime, several PDF/OCR parsers). Fix: `>=3.12,<3.15` so `uv` can resolve.

---

## 2. Architecture — the decision that shapes everything

The brief was "connect this FastAPI scaffold to a React/Next app and a database."
Three honest options:

### Option A — Next.js full-stack + FastAPI as an optional heavy-AI sidecar ⭐ **CHOSEN**

One Next.js app owns UI, API routes, auth, and database. FastAPI stays in the repo
as an *optional* service used only if you need something Python genuinely does
better (OCR, `docling`, PyTorch, a specific ML library).

- ✅ One deploy target (Vercel), one language end-to-end, one type system
- ✅ No CORS, no duplicated DTOs, no two-auth-systems problem
- ✅ Fastest path to a working demo — which is what a hackathon rewards
- ✅ Vercel Hobby allows **300s** function duration (verified) — ample for LLM calls
- ✅ Keeps the existing work without paying its cost
- ⚠️ The team must be comfortable in TypeScript

### Option B — React/Next frontend + FastAPI backend (classic split)

- ✅ Python for AI, JS for UI, team parallelises cleanly
- ✅ Vercel can host FastAPI too (it is a first-class documented target), so no extra host
- ⚠️ Two deploys, two auth stories, CORS, hand-written TS types mirroring Pydantic
  models, two cold-start profiles. Each of these is a place a hackathon dies at 3am.

### Option C — Next.js proxying to FastAPI for chat only

Hybrid. Pays Option B's cost for Option A's benefit. Only pick this if you have
one dedicated Python specialist and one dedicated Next specialist.

**Why A won:** the deciding factor is not elegance, it is the number of moving
parts that can fail while four people are tired. Option A has one.

**The escape hatch is real.** `apps/api` stays in the tree, Dockerised and wired,
but the web app must never hard-depend on it. If a Python-only need appears on
day 4, you start the container and add one route. If it never appears, you ignore
the folder.

---

## 3. What the app should be (deferred, but here are the shortlist)

The team deliberately deferred this. Three candidates that are genuinely
shippable (not toys), demo brilliantly, and where AI is *load-bearing* rather
than bolted on:

| | App | AI that is actually required | Best for |
|---|---|---|---|
| **A** | **Meeting → Action engine.** Upload or record a meeting → transcript → LLM extracts decisions, action items, owners, due dates (structured output) → auto-creates a task board → "chat with your past meetings" via vector search | Speech-to-text, structured extraction (Zod), tool calling, embeddings + RAG, streaming chat | Best demo arc. Judges watch a 40-minute meeting become a tracked board in 20 seconds. Real teams need this. |
| **B** | **Contract / RFP intelligence.** Bulk-upload vendor contracts → extract obligations, renewal dates, risk clauses, unusual terms → comparison dashboard + deadline alerts | Long-context document understanding, structured extraction, embeddings, cross-document comparison | Strongest "B2B / real-world value" story. Less crowded than chatbots. |
| **C** | **Multimodal support triage agent.** Inbound ticket (text + screenshot) → classify, prioritise, retrieve from a KB, draft a reply, execute tool calls (refund / escalate / tag) | Vision + tool calling + agentic loops + RAG | Best "it takes *actions*" narrative. |

**Recommendation if you want a push: A.** It forces four distinct AI
capabilities (ASR, structured output, tool calling, vector RAG) so nobody can
call it a thin wrapper — and the demo is visceral. It also degrades gracefully:
if transcription fails on stage, a pre-seeded transcript saves you.

**Why the spine is built domain-agnostic anyway.** All three share the exact same
technical skeleton — auth, ownership, upload, async processing, structured
extraction, embeddings, retrieval, streaming chat, tool calling, AI call logging.
Building that spine first means picking the domain later costs hours, not days.
That is the whole point of the Phase 0/1 Starter.

---

## 4. The stack (every version verified live on 2026-09-28)

Nothing below is from memory. Each was checked against the npm registry, the
AI SDK v7 migration guide, the Next.js 16 / Better Auth docs, the MongoDB Atlas
Local image docs, or the Vercel limits page.

| Layer | Choice | Version | Note |
|---|---|---|---|
| Framework | **Next.js** App Router | `16.3.6` | Middleware is now **`proxy.ts`** (renamed in 16) |
| UI | **React** | `19.3.0` | |
| Language | **TypeScript** | `7.0.2` | ⚠️ TS 7 is the native/Go compiler — validate the build on day 0; fallback is `^5.9` |
| Styling | **Tailwind CSS** | `4.3.3` | v4 = CSS-first config, **no `tailwind.config.js`** |
| Components | **shadcn/ui** + `lucide-react` | CLI | Works with Tailwind 4 + React 19 |
| **AI** | **Vercel AI SDK** | `ai@7.0.118` | Requires **Node ≥ 22** |
| AI React hooks | `@ai-sdk/react` | `4.0.121` | ⚠️ **Different major to `ai`** — see traps below |
| AI providers | `@ai-sdk/gateway@4.0.96`, `@ai-sdk/google@4.0.82` | | Both peers: `zod ^3.25.76 \|\| ^4.1.8` |
| Validation | **Zod** | `^4.1.8` | Drives AI structured output *and* API validation *and* env validation |
| Auth | **Better Auth** | `1.7.6` | Bundled **MongoDB adapter** + an **anonymous** plugin |
| Database | **MongoDB Atlas** M0 free | — | 512 MB, **Vector Search included** |
| Driver | `mongodb` | `7.6.0` | Node ≥ 20.19; driver v7 can **manage search indexes programmatically** |
| ODM | `mongoose` | `9.10.2` | Depends on `mongodb ~7.6` → aligns with the driver ✅ |
| Local DB | `mongodb/mongodb-atlas-local` | Docker | **Supports Atlas Search + Vector Search locally**, port 27017 |
| Tests | Vitest 4 + Testing Library, Playwright | | |
| Deploy | **Vercel** Hobby | — | 300s duration, 2 GB memory, 250 MB bundle |

### ⚠️ Two version traps that will cost the team an hour

**Trap 1 — the `@ai-sdk/*` packages are NOT the same major as `ai`.**
`ai` is **7.x**; `@ai-sdk/react`, `@ai-sdk/gateway`, and `@ai-sdk/google` are all
**4.x**. Writing `"@ai-sdk/react": "^7"` produces an install failure. Install with
`@latest` and never hand-pin from assumption:

```bash
npm i ai@latest @ai-sdk/react@latest @ai-sdk/gateway@latest @ai-sdk/google@latest zod@latest
```

**Trap 2 — AI SDK 7 breaking changes.** Any tutorial older than ~6 months will not
compile. The full list is in `docs/SYSTEM_PROMPT.md`, but the four that bite
first: `system:` → **`instructions:`**, `experimental_output` → **`output`**,
`convertToModelMessages` is now **async** (must `await`), and the message part
`{ type: 'image' }` → `{ type: 'file' }`.

> **Tell the team:** use `ai-sdk.dev/llms.txt` as the source of truth for AI SDK
> questions, not blog posts. There is also an official codemod
> (`npx @ai-sdk/codemod v7`) if you ever inherit v6 code.

---

## 5. Repo structure to hand the team

```
aicon-hackathon/
├── apps/
│   ├── web/                          # Next.js 16 — the product
│   │   ├── src/app/
│   │   │   ├── (marketing)/page.tsx        # public landing + CTA
│   │   │   ├── (app)/layout.tsx            # authenticated shell
│   │   │   ├── (app)/dashboard/page.tsx
│   │   │   ├── (app)/items/[id]/page.tsx
│   │   │   ├── api/auth/[...all]/route.ts  # Better Auth
│   │   │   ├── api/items/route.ts
│   │   │   └── api/chat/route.ts           # streaming AI
│   │   ├── src/components/{ui,ai}/
│   │   ├── src/lib/{env,db,auth,rate-limit,logger}.ts
│   │   ├── src/lib/models/                 # Mongoose schemas
│   │   ├── src/lib/ai/{models,prompts,tools,embed,extract,rag}.ts
│   │   ├── src/scripts/{create-indexes,seed,evals}.ts
│   │   ├── evals/cases.json
│   │   └── proxy.ts                        # Next 16 name for middleware
│   └── api/                          # existing FastAPI (OPTIONAL sidecar)
│       └── src/aicon_hackathon/...
├── packages/shared/                  # Zod schemas shared by web + api
├── docker-compose.yml                # mongodb/mongodb-atlas-local
├── .github/workflows/ci.yml
├── .env.example
├── CONTRIBUTING.md
├── docs/
│   ├── BLUEPRINT.md                  # this file
│   ├── SYSTEM_PROMPT.md              # the code-generation prompt
│   └── STUDENT_PACK_CHECKLIST.md
└── README.md                         # the 10-minute "get running" path
```

**Deliberately not a Turborepo.** For a hackathon, npm workspaces plus a
`docker-compose.yml` is enough ceremony. Turborepo is a day-2 upgrade, not a
day-0 requirement — and it is one more thing that can fail at 3am.

**Deliberately no separate `packages/ui`.** shadcn/ui components live in
`apps/web/src/components/ui` because that is where the CLI puts them and where
Tailwind can see them. Fighting that convention costs more than it saves.

---

## 6. The starter file manifests

The authoritative, file-by-file instructions live in `docs/SYSTEM_PROMPT.md`
(sections "FILE MANIFEST — PHASE 0" and "FILE MANIFEST — PHASE 1"). Summary:

### Phase 0 — unblock the team (do this before anyone writes features)

`.nvmrc` · `.gitignore` · root `package.json` · `apps/web/package.json` ·
`tsconfig.json` · `next.config.ts` · `postcss.config.mjs` · `eslint.config.mjs` ·
`.prettierrc` · `globals.css` · `docker-compose.yml` · `.env.example` ·
`lib/env.ts` · `lib/db.ts` · `lib/logger.ts` · `CONTRIBUTING.md` · CI workflow ·
`README.md`

The two highest-value files here are **`lib/env.ts`** (Zod-validated environment
that fails at build time, not demo time) and **`lib/db.ts`** (the cached
`MongoClient`). Both are 30 lines and both prevent a classic class of failure.

### Phase 1 — the skeleton that proves every layer

Auth (3 files) · models (4) · `create-indexes.ts` · `seed.ts` · AI layer
(`models`, `prompts`, `embed`, `extract`, `rag`, `tools`) · `rate-limit.ts` ·
`api/chat/route.ts` · `api/items/route.ts` · chat UI + structured-result UI ·
app shell + dashboard + item detail + landing · shadcn/ui primitives · Vitest
config + mocked-LLM tests · `evals/cases.json` + evals script.

---

## 7. Data model

```
users            { _id, email, name, image, createdAt }   # Better Auth-owned
sessions         { ... }                                   # Better Auth-owned
items            { _id, ownerId, title, content, sourceUrl?, mime?,
                   status, aiSummary?, aiTags[], category?, severity?, score?,
                   fields (Mixed)?, embedding[], createdAt }
chatThreads      { _id, ownerId, title, createdAt }
chatMessages     { _id, threadId, role, parts[], usage, createdAt }
aiRuns           { _id, ownerId, feature, model, inputTokens, outputTokens,
                   latencyMs, costUsd, status, error, createdAt }
```

Indexes created in `src/scripts/create-indexes.ts`:

| Collection | Index | Why |
|---|---|---|
| `items` | `{ ownerId: 1, createdAt: -1 }` | The dashboard query |
| `items` | **vector index on `embedding`** | RAG retrieval. `numDimensions` **must** equal the embedding model's output dimension |
| `chatMessages` | `{ threadId: 1, createdAt: 1 }` | Ordered thread replay |
| `aiRuns` | `{ ownerId: 1, createdAt: -1 }` | Cost dashboard + debugging trail |

**`aiRuns` is not busywork.** It is your cost number for the pitch slide *and*
the first place you look when the AI "goes weird". Build it in Phase 1 while it's
free, not on day 6 when you're debugging blind.

### The embedding decision

MongoDB Atlas can **auto-embed** server-side using a Voyage model. The local
Atlas Local `preview` Docker tag also supports this with `VOYAGE_API_KEY`. That
means less code and fewer moving parts — but it is preview-tier and locks you to
Atlas.

The safe alternative is a manual `embed()` call at write time against a plain
vector index. More code, fully portable.

**Chosen: manual embedding.** You need the embedding path at query time anyway,
and because `mongodb-atlas-local` supports vector search locally, you cannot get
stuck. When you outgrow it, auto-embedding is a config change, not a rewrite.

> ⚠️ **The single most common silent RAG failure:** the vector index's
> `numDimensions` not matching the embedding model's output dimension. You get
> zero results and **no error**. The Starter's index script asserts this and
> throws loudly. Do not remove that assertion.

---

## 8. AI layer design

**Model Selection (Gemini 3).**
- Chat & streaming tool calling: **`gemini-3.6-flash`** (with fallback to `gemini-3.8-flash`)
- Fast structured extraction: **`gemini-3.5-flash-lite`**
- Semantic embeddings: **`gemini-embedding-001`** (configured to 768 dimensions matching Atlas Vector Search)

**Gateway vs. direct provider.** Vercel AI Gateway charges **no markup** and
supports **BYOK**. When `AI_GATEWAY_API_KEY` is present, traffic routes through the gateway;
otherwise it routes directly to `@ai-sdk/google`.

**Free-tier reality.** Gemini's free tier is capped by **RPM / TPM / RPD, applied
per project**. Have **two keys** in env (`GOOGLE_GENERATIVE_AI_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY_B`).
The model registry in `lib/ai/models.ts` automatically intercepts 429 quota exhaustion errors and
transparently fails over to the backup key so live demos never crash on stage.

**Structured output.** Zod schema → `generateObject`. Never regex an LLM
response. Validate *and* coerce. Optional fields use `.catch(undefined)` so minor LLM
formatting quirks don't break the entire extraction pipeline.

**Session-Scoped Tools.** Tools are constructed per request via `createTools(ownerId)`:
- `searchItems`: Semantic vector search scoped to the authenticated user.
- `getItem`: Retrieves a specific record and its extracted metadata.
- `createItem`: Saves and analyzes a new record via the unified `processItem` pipeline.
- `getPortfolioStats`: Calculates counts by severity and portfolio risk averages.
- `compareItems`: Compares 2 to 4 records side-by-side.

**Streaming & Interactive Citations.** `streamText` → `createUIMessageStreamResponse` +
`toUIMessageStream`. Grounded answers cite sources using `[[item:<id>|<title>]]` markers,
which the `CitedText` component automatically transforms into clickable source badges.

**Evals.** `evals/cases.json` with 10 input → expected-shape pairs, run offline via `npm run evals`
using `MockLanguageModelV3`. Stops prompt regressions when team members iterate.

---

## 9. The Domain-Adaptable Layer

The repository contains a central **Domain Registry** in `apps/web/src/lib/domain.ts`.
This allows the team to pivot products without database migrations or schema rewrites.

### Switching Domains
Change one exported constant in `domain.ts`:
```typescript
export const ACTIVE_DOMAIN_ID: DomainId = "contracts"; // "generic" | "contracts" | "meetings" | "tickets"
```

### Architectural Components:
1. **Dynamic Schema Extension:** `DomainExtractSchema` extends `ExtractResultSchema` with `domain.fieldsSchema`.
2. **Polymorphic Storage:** Extracted domain fields are stored in MongoDB as `item.fields` (Mongoose `Mixed`), requiring zero database migrations between domain pivots.
3. **Domain UI Components:**
   - `SeverityBadge`: Color-coded priority badges (`low`, `medium`, `high`, `critical`).
   - `FieldsPanel`: Renders polymorphic domain fields into clean, humanized key-value cards.
   - `PreviewCard`: Interactive sample moment on the marketing landing page.
4. **Unified Processing Pipeline:** `apps/web/src/lib/items/process.ts` (`processItem`) unifies structured extraction, embedding generation, and status persistence into a single atomic function called by dashboard forms, item detail re-runs, and AI chat tools.
5. **Vector Re-Embedding (`npm run db:reembed`):** Standalone script to populate real 768-dimensional model embeddings for seeded records once a live API key is configured.

---

## 9. Environment and secrets

`.env.example` is committed; the real `.env.local` never is.

```env
MONGODB_URI=mongodb://localhost/?directConnection=true   # local Atlas Local
# MONGODB_URI=mongodb+srv://...                          # Atlas cloud (shared with team)
MONGODB_DB=aicon
BETTER_AUTH_SECRET=            # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

AI_GATEWAY_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY_B=   # quota fallback
BLOB_READ_WRITE_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

Validate all of it with Zod in `lib/env.ts`, and **import that module from a
server component** so a missing variable fails the build instead of the demo.

**Who gets the secrets.** Use a shared password manager (Dashlane is in the
Student Pack) or Vercel's shared environment variables. Do not paste API keys
into the group chat — screenshots of a WhatsApp chat are a real leak vector, and
rotating a key at hour 40 is not how anyone wants to spend their night.

---

## 10. Local development workflow

```bash
docker compose up -d          # mongodb-atlas-local; waits for healthy
npm install
npm run db:indexes            # create vector + compound indexes
npm run db:seed               # demo data
npm run dev                   # Next.js on :3000
```

Root `package.json` scripts: `dev`, `build`, `typecheck`, `lint`, `format`,
`test`, `test:e2e`, `db:up`, `db:down`, `db:indexes`, `db:seed`, `db:reset`,
`evals`.

**Why Atlas Local and not plain `mongo`.** This is the detail that decides whether
RAG works locally at all. The official `mongodb/mongodb-atlas-local` image ships
`mongod` **and** `mongot` as a single-node replica set, so Atlas Search and Atlas
Vector Search work on your laptop. A plain `mongo` container gives you neither,
and your `$vectorSearch` calls will fail locally while working in the cloud — the
single most confusing failure mode in this stack. Connection string:

```
mongodb://localhost/?directConnection=true
```

**Windows notes.** The image is Linux-container based, so run it through Docker
Desktop. Keep the repo out of any OneDrive-synced directory — file watchers and
sync daemons fight each other, and the symptom (random HMR failures) looks like a
Next.js bug when it is not.

---

## 11. Quality gates (CI on every PR)

- `typecheck` — TypeScript 7 is fast enough to run on every push
- `lint` + `format`
- `vitest run` — mock the LLM with `MockLanguageModelV3` from `ai/test` so tests
  are offline, deterministic, and free
- `playwright test` — **one** happy-path E2E (sign in → create → see the AI
  result). One. Not a suite.
- Branch protection: no direct pushes to `main`

> The mocked-LLM pattern matters more than it looks. It means CI passes with no
> API key, so a contributor with an expired key can still merge, and a prompt
> regression shows up as a red build rather than as "the demo seemed off".

---

## 12. Deploy runbook — do this on day 1, not day 4

1. **Atlas:** create the M0 cluster → create a DB user → set network access to
   `0.0.0.0/0` for the hackathon window → copy the SRV connection string.
2. **Vercel:** create the project from the GitHub repo, with root directory
   `apps/web`.
3. Paste every env var into Vercel (Production **and** Preview).
4. `vercel --prod` → open the deployed URL in a browser and confirm it responds.
5. **Then** start building features.

Shipping a hello-world to production in hour one removes the entire class of
day-4 deployment panic. It also means every subsequent PR gets a preview URL that
teammates and judges can actually click — which is worth more than it sounds when
you are gathering feedback.

**Vercel Hobby constraints to design within (verified):** 300s function
duration (default *and* maximum), 2 GB memory, 250 MB uncompressed bundle. A
60-minute audio transcription can exceed 300s — chunk the audio, or accept a
submitted-job-plus-poll pattern. Do not discover this on stage.

---

## 13. GitHub Student Developer Pack

Full, claimable detail — with a `[verified]` / `[check]` marker on every item and
a team capture sheet — lives in **`docs/STUDENT_PACK_CHECKLIST.md`**.

The minimum viable claim for this build:

1. **GitHub Copilot** (free for students) — changes how fast four people write code
2. **GitHub Codespaces** — one identical environment for everyone
3. **Microsoft Azure** credits — only if you keep the FastAPI sidecar
4. **Sentry**, **DevCycle**/**ConfigCat**, **Codecov** — demo protection
5. Plus the free tiers outside the pack: **Atlas M0**, **Vercel Hobby**,
   **Vercel Blob**, **Gemini API ×2**, **Upstash Redis**

**Zero paid services are required to ship this.** Claim what unblocks you, then
stop and go build — comparing feature-flag vendors is an hour not spent on the
demo.

---

## 14. Timeline

| Day | Goal | Exit criterion |
|---|---|---|
| **0** | Repo skeleton, env validation, Atlas + Vercel live, DB models + seed, auth working | Two teammates can `clone → compose up → npm i → npm run dev` and see a logged-in page |
| **1** | AI spine: model registry, one streaming chat route, `useChat` UI, prompt files | Ask a question, get a streamed answer |
| **2** | Core feature: upload → store → process → result persisted | One full happy path end-to-end |
| **3** | RAG: embeddings, vector index, retrieval with citations | "Ask about my data" returns cited answers |
| **4** | Agents: tools + structured extraction writing to the database | The model creates real records via tools |
| **5** | Polish: loading/error/empty states, mobile, a11y, seed the demo data | The demo runs clean on a phone |
| **6** | Evals, Sentry, rate limits, README, **three full rehearsals including one deliberate failure** | A rehearsed demo plus a recorded backup video |
| **7** | **Feature freeze.** Bug fixes only. Ship. | — |

**Why day 0 is a full day.** It looks like setup, but it is the day that decides
whether days 1–6 are productive. A team that starts day 1 with a working
`clone → run` path and a live deploy moves roughly twice as fast as one that
spends days 1–3 debugging environments.

---

## 15. Risks and gotchas

The things that actually kill hackathon projects, in rough order of how likely
they are to bite you:

1. **Uploads.** Vercel's filesystem is ephemeral. Never write uploads to disk. →
   **Vercel Blob**. This is the #1 thing that breaks on first deploy.
2. **Long jobs.** Transcribing a 60-minute recording can exceed the 300s Hobby
   function limit. Chunk the audio, or use a submitted-job + poll pattern.
3. **Mongo connection pooling.** A new `MongoClient` per request exhausts Atlas
   M0's connection limit, especially with hot reload. Cache it on `globalThis`.
4. **Embedding dimension mismatch.** The index's `numDimensions` must equal the
   model's output. Silent empty results otherwise.
5. **`proxy.ts`, not `middleware.ts`.** Renamed in Next 16. Every tutorial says
   `middleware`.
6. **`proxy.ts` cookie checks are not auth.** The cookie *existing* does not mean
   the session is valid. Always re-validate on the server.
7. **Rate-limit and hard-cap AI spend.** One `useEffect` loop can burn a month of
   free quota in minutes. Upstash on `/api/chat` before you demo.
8. **No signup for judges.** Use Better Auth's anonymous plugin so a judge lands
   in a working session instantly.
9. **Seed data is a feature, not a nicety.** Your demo must work with zero user
   input.
10. **Record a backup demo video.** Conference Wi-Fi fails. Non-negotiable.
11. **`ai` needs Node ≥ 22 while `next` only needs ≥ 20.9.** The failure appears
    as a confusing runtime error, not an install error.
12. **TypeScript 7 is brand new.** Validate `next build` + ESLint against it in
    Phase 0. Pre-agreed fallback: `typescript@^5.9`. Do not let this become a
    day-6 crisis.
13. **Prompt ownership.** Four people editing one prompt string is merge hell.
    Prompts live in files; one owner per file.
14. **AI SDK version drift.** A teammate following a 6-month-old blog post will
    write `system:` and `convertToCoreMessages` and wonder why nothing compiles.
    Send them `ai-sdk.dev/llms.txt` on day 0.
15. **Privacy.** Uploaded documents may contain other people's data. Ship a delete
    path and state your retention policy in the pitch.

---

## 16. What to build first, concretely

The single highest-value ordering:

1. **Phase 0 completely.** Do not let anyone write a feature before two teammates
   can independently `clone → docker compose up → npm install → npm run dev` and
   see the app render.
2. **Then one end-to-end vertical slice.** Sign in anonymously → create one item →
   see one AI-generated result persisted and rendered.

That slice touches every layer exactly once and proves the whole chain works.
Everything after it is repetition, and repetition is where a team of four can
parallelise safely.

---

## 17. Next steps

| # | Action | Owner | Done |
|---|---|---|---|
| 1 | Claim GitHub Copilot + Codespaces | all | ☐ |
| 2 | Create the MongoDB Atlas M0 cluster | one | ☐ |
| 3 | Create the Vercel project from the repo | one | ☐ |
| 4 | Generate two Gemini API keys | one | ☐ |
| 5 | Run `docs/SYSTEM_PROMPT.md` through a strong coding model to generate Phase 0/1 | one | ☐ |
| 6 | Review the generated diff before merging into `apps/web` | all | ☐ |
| 7 | Deploy hello-world to Vercel on day 0 | one | ☐ |
| 8 | **Decide the product domain** (section 3) — hours, not days, once the spine exists | all | ☐ |

---

## Closing note on scope

This blueprint deliberately does **not** include payments, admin panels, teams,
organisations, notifications, mobile apps, or a marketing site. Every one of those
is a plausible-feeling addition that would consume a day and add nothing to a
hackathon demo.

The judgement call throughout has been: **one datastore, one deploy target, one
language, one type system.** Every additional moving part is a thing that can fail
while four tired people are watching a projector. If you find yourself wanting to
add infrastructure, ask whether a library or a config change solves it instead —
that is the whole reason the plan leans on shadcn/ui, Better Auth, Atlas Vector
Search, Vercel Blob, and the AI SDK rather than hand-rolled equivalents.


# 💡 Project Explained: The Simple Guide to the AICON AI Starter

Welcome! If you are new to the codebase, participating in a hackathon, or looking to understand how all the moving parts connect without drowning in technical jargon, this guide is for you.

---

## 🧭 What is this Project?

Imagine building an AI application like building a modern house.
Instead of spending days laying the concrete foundation, wiring the electricity, plumbing the pipes, and installing security locks, **this starter gives you a fully functional, move-in-ready foundation on Day 1**.

This repository is an **app-agnostic "AI Spine"**. It gives you:
1. **A User Interface**: Pre-built pages for landing, dashboards, artifact viewing, and AI chat.
2. **An Authentication System**: Instant guest login so judges and teammates don't need passwords or email verification.
3. **A Smart Database (MongoDB Atlas Vector Search)**: A unified place that stores both traditional data (users, items, chat history) and AI vector embeddings.
4. **An AI Brain (Gemini 3 & AI SDK v7)**: Real-time streaming chat, structured data extraction, and RAG (Retrieval-Augmented Generation).
5. **The Domain-Adaptable Layer**: Switch your entire product idea (Contracts, Meeting notes, Support tickets, or custom) by changing **one line of code**.
6. **An Observability Audit Trail**: Automatic logging of every token used, latency, and cost.

---

## 🎯 How to Change the Entire Product Idea in 1 Line

The secret sauce of this template is [`apps/web/src/lib/domain.ts`](apps/web/src/lib/domain.ts).

Instead of rewriting the database or backend when your team pivots, open `domain.ts` and change:

```typescript
export const ACTIVE_DOMAIN_ID = "contracts"; // "generic" | "contracts" | "meetings" | "tickets"
```

### What Happens Automatically:
* **The Labels Change:** "Items" become "Contracts", "Meetings", or "Tickets".
* **The AI Prompt Adapts:** The AI starts extracting domain-specific fields (e.g., contract clauses with quotes, or meeting action items with owners and due dates).
* **The Scoring System Updates:** Shows domain risk scores, urgency levels, or action clarity meters.
* **The Chat Persona Shifts:** The AI responds like a legal risk analyst, a chief of staff, or a support lead.
* **The Landing Page Updates:** Problem and solution descriptions on the homepage match your chosen domain.

---

## 🔄 The Complete Workflow: How Everything Connects

Here is what happens when someone interacts with the application:

```
[ User Browser / Judge ]
       │
       ▼
1. Visit Landing Page ──► Click "Login as Demo User" or "Launch Demo Anonymously"
       │
       ▼
2. Better Auth Session ──► Issues an authenticated session cookie (zero signup friction!)
       │
       ▼
3. Workspace Dashboard ──► Reads records, calculates KPI metrics (total, analyzed, high risk)
       │
       ▼
4. Create New Item ──────► Next.js Server Action saves artifact to MongoDB (pending status)
       │
       ▼
5. Unified AI Pipeline ──► A. Gemini 3.5 Flash Lite extracts structured data, severity, & score
   (lib/items/process.ts) ──► B. Gemini Embedding 001 creates 768-dimensional vector embedding
                          ──► C. Persists everything in MongoDB (processed status)
       │
       ▼
6. View & Chat ──────────► In /items/[id], inspect raw content, SeverityBadge, and FieldsPanel
       │
       ▼
7. Atlas Vector Search ──► Finds semantically related documents in MongoDB for your question
       │
       ▼
8. Streaming RAG Chat ───► Gemini 3.8 Flash streams answers, citing exact sources [[item:id|title]]
       │
       ▼
9. Interactive Chips ────► CitedText converts markers into clickable source buttons on the UI!
       │
       ▼
10. AI Run Auditing ─────► Token usage, reasoning tokens, and latency logged to AiRunModel
```

---

## 🍃 What is MongoDB & Why is it Better than SQL for AI?

### What is MongoDB?
MongoDB is a **document database**. Unlike traditional SQL databases that force your data into rigid rows and columns like a spreadsheet, MongoDB stores data as flexible, JSON-like documents.

### Why MongoDB Wins for AI:
1. **Polymorphic Data:** AI outputs (summaries, tags, dynamic fields) are naturally JSON. A contract has clauses; a meeting has attendees; a ticket has customer sentiment. MongoDB stores these in `item.fields` without needing schema migrations or altering tables.
2. **Unified Vectors & Data:** You don't need a separate database for vectors (like Pinecone) and another for data (like PostgreSQL). MongoDB Atlas handles both standard data queries and vector search in one place.

### Dual-Connection Architecture (`apps/web/src/lib/db.ts`):
1. **The Native Driver (`MongoClient`)**: 
   * A lightweight, direct connection to the database.
   * Used by our authentication library (**Better Auth**) for fast session lookups.
   * Cached on `globalThis` as a single connection instance so we never overwhelm database limits during hot reloads.
2. **Mongoose (`connectMongoose`)**:
   * An Object Modeling library that gives structure to our data.
   * Defines our schemas (`ItemModel`, `ChatThreadModel`, `ChatMessageModel`, `AiRunModel`) with automatic data validation and type safety.

---

## ☁️ The Two MongoDB Versions: Local vs. Cloud

You can run this project in **two different modes**:

| Feature | 🏠 Mode 1: Local Atlas (Docker) | ☁️ Mode 2: MongoDB Atlas (Cloud) |
| :--- | :--- | :--- |
| **Where it runs** | Directly on your computer via Docker | Hosted on MongoDB's cloud servers (AWS/GCP/Azure) |
| **Internet Required?** | ❌ No — works 100% offline | ✅ Yes — connects over the internet |
| **Vector Search Support?** | ✅ Yes — includes local `mongot` search engine | ✅ Yes — built into Atlas clusters |
| **Best For** | Local development, traveling, offline testing, fast reset | Team collaboration, hackathon demos, production deploy |
| **Connection String** | `mongodb://localhost/?directConnection=true` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/aicon` |

### How to Switch Between Local and Cloud:
Open `apps/web/.env.local` and change the `MONGODB_URI` line:
* To run **locally**: Keep the default `MONGODB_URI="mongodb://localhost/?directConnection=true"` and run `docker compose up -d`.
* To run in the **cloud**: Replace with your Atlas connection string from your cloud cluster.

---

## 🧠 What is Vector Search & RAG? (In Plain English)

### 1. Vector Embeddings
Computers don't understand the meaning of words; they only understand numbers.
When you save an item, Gemini's embedding model (`gemini-embedding-001`) converts the text into a list of **768 decimal numbers** (a "vector").

* The words *"contract"* and *"agreement"* will have very similar vector numbers because their meanings are related.
* The words *"contract"* and *"pineapple"* will have very different vector numbers.

### 2. Atlas Vector Search
Instead of searching for exact keywords (like finding rows where `title LIKE '%contract%'`), MongoDB Atlas Vector Search compares the mathematical distance between vectors. It finds documents with **matching concepts**, even if they use completely different vocabulary.

### 3. RAG (Retrieval-Augmented Generation)
If you ask an AI: *"What is our cancellation policy?"*, a generic AI doesn't know your private documents and might hallucinate.

**RAG turns the test into an open-book exam:**
1. Your question is converted into a vector.
2. MongoDB Vector Search retrieves the top 4 most relevant items from your database.
3. The server automatically feeds those 4 items to Gemini inside `<source>` blocks.
4. Gemini reads the retrieved context and answers your question accurately based on your actual data!

---

## 📎 Interactive Citations: How `CitedText` Works

When the AI answers your question using RAG, you don't want it to just claim things—you want proof.

1. The system prompt instructs Gemini:
   > *"When you use a source, cite it with exactly `[[item:<id>|<title>]]`."*
2. Gemini produces text like:
   > *"The vendor liability is capped at one month of fees [[item:6ac0aa...|Master Services Agreement]]."*
3. On the frontend, [`CitedText.tsx`](apps/web/src/components/ai/cited-text.tsx) automatically detects those markers and replaces them with **interactive pill badges**.
4. Clicking the pill takes the user straight to that exact document!

---

## 🔄 The Re-Embed Magic: `npm run db:reembed`

When you first seed the database (`npm run db:seed`), it generates deterministic mathematical vectors so the project can be tested completely offline without external API keys.

Before presenting to judges or testing live RAG:
```bash
npm run db:reembed
```
This script calls Google Gemini with your real API key, generates genuine 768-dimensional embeddings for all records, and saves them to MongoDB Atlas in seconds.

---

## 🛠️ The Tech Stack: What Each Tool Does

* **Next.js 16 (App Router + Turbopack)**: The full-stack React framework that powers both the frontend pages and backend API route handlers.
* **React 19**: Modern UI library with Server Actions and fast component re-renders.
* **Vercel AI SDK v7 (`ai`, `@ai-sdk/react`)**: The industry standard for streaming chat (`streamText`), structured outputs (`generateObject`), and client hooks (`useChat`).
* **Google Gemini 3 (`@ai-sdk/google`)**:
  * `gemini-3.8-flash`: Powers high-speed, intelligent reasoning and streaming chat with tool calling.
  * `gemini-3.5-flash-lite`: Fast, cost-efficient structured extraction.
  * `gemini-embedding-001`: Produces 768-dimensional semantic embeddings.
* **Better Auth**: Modern TypeScript authentication. Features 1-click **Anonymous sessions** and **Demo logins** so judges don't waste time creating accounts.
* **Zod**: The TypeScript equivalent of Python's Pydantic. Guarantees that runtime LLM JSON outputs and environment variables match your TypeScript types.
* **Upstash Redis**: Sliding-window rate limiter ensuring users/bots can't spam your Gemini API keys and blow quotas.
* **FastAPI Sidecar (`apps/api/`)**: An optional Python backend if heavy ML/OCR workloads (like PyTorch or OpenCV) are needed.

---

## 🏁 Where to Go From Here

Now that you understand the concept and architecture:
1. Open [`apps/web/src/lib/domain.ts`](apps/web/src/lib/domain.ts) and pick your product domain (`generic`, `contracts`, `meetings`, or `tickets`).
2. Add your free Gemini key to `apps/web/.env.local`.
3. Run `npm run db:reembed` to populate live vectors.
4. Run `npm run dev` and test the app in your browser!

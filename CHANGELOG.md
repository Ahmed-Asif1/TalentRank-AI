# Changelog

All notable changes to the **TalentRank AI** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-10

### 🚀 Added
- **Dynamic AI Job Criteria Engine**:
  - Role requirement prompt expansion via Google Gemini into structured must-haves, nice-to-haves, red flag anti-patterns, a 0–100 scoring rubric, and screening interview questions (`/api/criteria`).
  - Interactive Criteria Modal with real-time prompt generation and 1-click candidate batch rescoring.
  - Dedicated `JobCriteriaModel` schema for tenant-isolated active criteria management.
- **Multi-Modal Candidate Ingestion**:
  - Multi-page PDF text extraction via `pdf-parse` supporting direct resume uploads and LinkedIn's native **"Save to PDF"** exports (capturing 100% complete, un-truncated profile data).
  - High-velocity raw text paste tab with real-time AI scoring.
  - Automated headless LinkedIn scraper route with resilient fallback profile generator.
- **Talent Leaderboard & Dashboard**:
  - Real-time candidate ranking by match score with 🥇 Gold, 🥈 Silver, and 🥉 Bronze visual badges.
  - Live pipeline KPIs (In pipeline, AI evaluated, Top matches, Average match score).
  - Full-text search and status filtering (`processed`, `pending`, `failed`).
- **Candidate Deep Dive & RAG Chat**:
  - `/items/[id]` candidate inspector displaying strengths, weaknesses, hiring verdict, and career tenure.
  - Embedded RAG chat powered by MongoDB Atlas Vector Search (768d embeddings via `gemini-embedding-001`) and Gemini 3 streaming chat.
  - Interactive citation badges (`CitedText`) linking answers directly to verified candidate background history.
- **Zero-Friction Authentication**:
  - Better-Auth anonymous authentication and dedicated 1-click **"Login as Demo User"** bypass for instant judge onboarding.
- **DevOps & Verification Pipeline**:
  - Native `.gitlab-ci.yml` pipeline covering typecheck, linting, unit tests, evals, and production builds.
  - Step-by-step `SETUP_GUIDE.md` and complete architectural `EXPLAIN.md`.
  - Self-contained `talentrank-ai-submission.zip` export bundle.

### 🛡️ Fixed & Improved
- **ESLint 9 Flat Configuration**: Resolved TypeScript 7 compiler version mismatch by configuring `@typescript-eslint/parser` and `@next/eslint-plugin-next`.
- **UI Click Isolation**: Scoped file input inside `<label htmlFor="file-upload-input">` with `sr-only` to prevent unintended Windows Explorer dialog triggers.
- **Security & Stability**: Stripped deprecated bookmarklet and `javascript:` URLs to eliminate React 19 security warnings.
- **Production Build**: Validated offline Next.js 16 Turbopack production compilation with zero build errors.

---

## [0.2.0] - 2026-10-03
### Added
- Domain-Adaptable Architecture layer (`apps/web/src/lib/domain.ts`).
- Dual-connection database pool with cached `MongoClient` and Mongoose models.
- Initial vector search pipeline with Gemini 768d embeddings.

---

## [0.1.0] - 2026-09-28
### Added
- Monorepo scaffold with Next.js 16 App Router, React 19, and Tailwind CSS v4.
- Better-Auth integration and base data models.
- Automated Vitest test suite and AI structured extraction evals.

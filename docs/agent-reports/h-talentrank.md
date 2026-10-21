AGENT:          H — TalentRank AI Platform & Ingestion Engine
WAVE:           Phase 3 / Final Hackathon Polish
BRANCH:         feat/domain-adaptable-layer

FILES WRITTEN:
- apps/web/src/app/api/criteria/route.ts (Dynamic Job Criteria Engine: Gemini prompt expansion into 0-100 rubric, dealbreakers, screening questions, and batch rescoring)
- apps/web/src/lib/models/criteria.ts (JobCriteria Mongoose schema with isActive, mustHave, niceToHave, redFlags, rubric, interviewQuestions)
- apps/web/src/app/(app)/dashboard/job-criteria-modal.tsx (Interactive AI criteria modal with prompt-to-rubric generation & 1-click activation)
- apps/web/src/app/(app)/dashboard/import-candidate-button.tsx (3-tab candidate importer: Paste text, PDF/Resume upload, and URL scrape with strict click scoping)
- apps/web/src/app/(app)/dashboard/candidate-leaderboard.tsx (Real-time candidate leaderboard with score ranking and badges)
- apps/web/src/app/api/scrape/route.ts (Multi-page PDF parser using pdf-parse, LinkedIn "Save to PDF" export handling, and resilient scraping fallbacks)
- apps/web/src/components/error-boundary.tsx (React ErrorBoundary for UI fault isolation)
- apps/web/src/lib/candidate-ui.ts (UI score coloring, badge styles, and status indicators)
- apps/web/eslint.config.mjs (Configured ESLint 9 flat configuration with @typescript-eslint/parser to resolve TS7 compiler mismatch)
- SETUP_GUIDE.md (Foolproof, step-by-step local setup instructions for hackathon judges and reviewers)
- README.md (Comprehensive TalentRank AI platform documentation and GitLab link)
- EXPLAIN.md (In-depth explanation of the candidate ingestion, criteria expansion, and RAG interview architecture)

STUB SIGNATURES CHANGED:
- apps/web/src/lib/items/process.ts: integrated active JobCriteriaModel lookup to dynamically inject the active role rubric into Gemini extraction.
- apps/web/src/lib/ai/extract.ts: updated extractStructuredData to accept optional criteria rubric prompt for role-specific candidate evaluation.
- apps/web/src/app/(app)/dashboard/page.tsx: added JobCriteriaModal trigger in header, integrated ErrorBoundary, and connected dynamic candidate ranking.
- apps/web/src/app/(marketing)/page.tsx: updated product branding to TalentRank AI with Instant Demo CTA.
- apps/web/src/app/(app)/layout.tsx: updated brand navigation to TalentRank AI.
- apps/web/package.json: added pdf-parse, @types/pdf-parse, and sonner for notification feedback.

TYPE CHECK:     pass (0 errors via `npm run typecheck`)
TESTS RUN:      npm run test → 33/33 passing across all 4 test suites
                npm run evals → 10/10 passed (100%)
                npm run lint → 0 errors via ESLint 9 + @typescript-eslint/parser
                npm run build → Next.js 16 Turbopack production build succeeded with all routes compiled
UNVERIFIED:     none (verified offline unit suites, evals, live /api/criteria generation, live /api/scrape text & PDF ingestion, and production Next.js build)
REQUESTS:       none

AGENT:          G — Domain-Adaptable Layer & AI Spine Polish
WAVE:           Phase 2
BRANCH:         feat/domain-adaptable-layer

FILES WRITTEN:
apps/web/src/lib/domain.ts
apps/web/src/lib/items/process.ts
apps/web/src/components/domain/severity-badge.tsx
apps/web/src/components/domain/fields-panel.tsx
apps/web/src/components/ai/cited-text.tsx
apps/web/src/components/marketing/preview-card.tsx
apps/web/src/scripts/reembed.ts
apps/web/src/lib/__tests__/domain.test.ts
apps/web/src/lib/__tests__/domain-ui.test.tsx
docker-compose.yml (updated atlas-config volume)

STUB SIGNATURES CHANGED:
- apps/web/src/lib/contracts.ts: added category, severity, score, and dynamic fields to Item and ExtractResult schemas.
- apps/web/src/lib/models/item.ts: updated Mongoose schema with category, severity, score, fields (Mixed), and indexes.
- apps/web/src/lib/ai/tools.ts: refactored module-level tools export to createTools(ownerId) factory for strict session tenancy.
- apps/web/src/lib/ai/models.ts: updated model IDs to Gemini 3 releases (gemini-3.8-flash, gemini-3.5-flash-lite, gemini-embedding-001 with 768 dimensions).
- apps/web/src/app/api/chat/route.ts: integrated buildChatInstructions(context) and createTools(ownerId).
- apps/web/src/components/ai/chat.tsx: integrated CitedText component and dynamic domain quick prompts.
- apps/web/src/app/(app)/dashboard/page.tsx: replaced with KPI metrics, status/severity filters, and tabular layout.
- apps/web/src/app/(app)/items/[id]/page.tsx: added SeverityBadge, FieldsPanel, and unified processItem re-extraction.
- apps/web/src/app/(marketing)/page.tsx: added domain problem/solution section and interactive PreviewCard.

TYPE CHECK:     pass (0 errors via `npm run typecheck`)
TESTS RUN:      npm run test → 38/38 passing across 4 test suites
                npm run evals → 10/10 passed (100%)
                npm run db:reembed → 8 of 8 items re-embedded successfully with live key
                npm run build → Next.js 16 Turbopack production build succeeded
UNVERIFIED:     none (verified offline suites, live Gemini API integration, and Docker keyfile volume persistence)
REQUESTS:       none

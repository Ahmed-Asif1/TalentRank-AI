import { z } from "zod";

/**
 * INTERFACE CONTRACTS
 *
 * Single source of truth for cross-boundary schemas and types.
 * Phase 2 change (the one deliberate unfreeze): items gained domain-agnostic
 * `category`, `severity`, `score`, and `fields` so one entity can model a
 * contract, a meeting, or a support ticket without schema churn.
 * Domain-specific shape lives in `fields`, validated by src/lib/domain.ts.
 */

/** Gemini text-embedding-004 produces 768-dimensional vectors; the Atlas index must match. */
export const EMBEDDING_DIMENSIONS = 768;

export const SYSTEM_PROMPT_VERSION = "2026-09-28.v1";

export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export const SeveritySchema = z.enum(SEVERITY_LEVELS);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * Base structured-extraction result. LLMs return slightly wrong shapes
 * (numbers as strings, odd casing), so optional fields use coerce/.catch().
 * Domain-specific `fields` are added in src/lib/ai/extract.ts.
 */
export const ExtractResultSchema = z.object({
  summary: z.string().describe("A concise 1-2 sentence summary of the item content"),
  tags: z.array(z.string()).describe("3-5 descriptive, lower-case tags categorizing the content"),
  confidenceScore: z.number().min(0).max(1).optional().catch(1),
  actionItems: z.array(z.string()).optional().catch([]),
  category: z.string().optional().catch(undefined).describe("Short category label for the item"),
  severity: SeveritySchema.optional().catch(undefined).describe("low | medium | high | critical"),
  score: z.coerce.number().min(0).max(100).optional().catch(undefined).describe("0-100 domain score"),
});

export type ExtractResult = z.infer<typeof ExtractResultSchema>;

export const ItemSchema = z.object({
  _id: z.string().optional(),
  ownerId: z.string().min(1, "ownerId is required"),
  title: z.string().min(1, "title is required"),
  content: z.string().default(""),
  sourceUrl: z.string().url().optional(),
  mime: z.string().optional(),
  status: z.enum(["pending", "processed", "failed"]).default("pending"),
  aiSummary: z.string().optional(),
  aiTags: z.array(z.string()).default([]),
  category: z.string().optional(),
  severity: SeveritySchema.optional(),
  score: z.number().min(0).max(100).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  embedding: z.array(z.number()).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type Item = z.infer<typeof ItemSchema>;

export const ItemCreateInputSchema = z.object({
  title: z.string().min(1, "title is required"),
  content: z.string().default(""),
  sourceUrl: z.string().url().optional(),
  mime: z.string().optional(),
});

export type ItemCreateInput = z.infer<typeof ItemCreateInputSchema>;

export const ItemListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["pending", "processed", "failed"]),
  aiSummary: z.string().optional(),
  aiTags: z.array(z.string()),
  category: z.string().optional(),
  severity: SeveritySchema.optional(),
  score: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]),
});

export type ItemListItem = z.infer<typeof ItemListItemSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(z.any()), // AI SDK UIMessage array
  threadId: z.string().optional(),
  itemId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const AiRunSchema = z.object({
  _id: z.string().optional(),
  ownerId: z.string(),
  feature: z.enum(["chat", "extract", "embed", "rag"]),
  model: z.string(),
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  reasoningTokens: z.number().default(0),
  cacheReadTokens: z.number().default(0),
  latencyMs: z.number().default(0),
  costUsd: z.number().default(0),
  status: z.enum(["success", "error"]).default("success"),
  error: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type AiRun = z.infer<typeof AiRunSchema>;

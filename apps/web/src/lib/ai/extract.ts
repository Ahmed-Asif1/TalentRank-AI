import { generateObject, type LanguageModel } from "ai";
import { ExtractResultSchema, type ExtractResult } from "@/lib/contracts";
import { fastModel } from "@/lib/ai/models";
import { EXTRACTION_PROMPT } from "@/lib/ai/prompts/system";
import { domain } from "@/lib/domain";

export type ExtractOutput = ExtractResult & { fields?: Record<string, unknown> };

/**
 * Base extraction shape plus the active domain's `fields`.
 * LLMs frequently return numbers as strings or omit optional keys, so every
 * domain field is optional and the whole payload falls back to undefined
 * (via .catch) rather than failing the extraction.
 */
const DomainExtractSchema = ExtractResultSchema.extend({
  fields: domain.fieldsSchema.optional().catch(undefined),
});

/**
 * Extracts structured data (summary, tags, severity, score, domain fields) using generateObject.
 * Accepts an optional modelOverride for test mocking (e.g. MockLanguageModelV3).
 */
export async function extractStructuredData(
  content: string,
  modelOverride?: LanguageModel
): Promise<ExtractOutput> {
  const trimmed = content.trim();
  const model = modelOverride || fastModel;

  const { object } = await generateObject({
    model,
    schema: DomainExtractSchema,
    instructions: EXTRACTION_PROMPT,
    prompt: trimmed || "No content provided.",
  });

  return object as ExtractOutput;
}

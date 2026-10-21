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
  modelOverride?: LanguageModel,
  criteriaOverride?: string
): Promise<ExtractOutput> {
  const trimmed = content.trim();
  const model = modelOverride || fastModel;

  const instructions = criteriaOverride
    ? `You are an expert technical candidate evaluation engine for ${domain.labels.plural!.toLowerCase()}.
Analyze the provided profile/resume text and evaluate the candidate strictly against the custom job criteria below:
1. summary: A concise, informative 1-2 sentence summary of their background.
2. tags: 3 to 5 descriptive, lower-case tags (skills, domain, tools).
3. category: exactly one of 'Strong Fit', 'Potential', or 'Unqualified'.
4. severity: 'critical' (90+), 'high' (80-89), 'medium' (50-79), or 'low' (0-49).
5. score: integer 0 to 100 adhering strictly to the rubric brackets below.
6. fields: strengths (evidence-backed points matching criteria), weaknesses (missing requirements or gaps), verdict (clear hiring recommendation aligned with score and category), yearsOfExperience (estimated total years of relevant experience).

TARGET JOB ROLE CRITERIA & SCORING RUBRIC:
${criteriaOverride}

ANTI-HALLUCINATION & CALIBRATION RULES:
1. Base all scores, verdicts, and extractions ONLY on explicitly stated facts in the text.
2. DO NOT assume, infer, or guess skills, tools, or experience not directly written.
3. If a specific requirement is not mentioned, note it as an unmet gap.
4. Holistic Scoring: Award proportionate partial credit for verified technical competencies (e.g. Next.js, React, Flutter, Python, TypeScript, Web Dev). Do NOT give a 0 score to software engineers with relevant foundations; reserve 0-19 strictly for non-technical, irrelevant, or spam profiles.
5. STRICT CONSISTENCY MANDATE:
   - Score 80-100 MUST have category 'Strong Fit', positive interview recommendation in verdict, and severity 'high' or 'critical'.
   - Score 50-79 MUST have category 'Potential', conditional / mid-level assessment in verdict, and severity 'medium'.
   - Score 0-49 MUST have category 'Unqualified', clear seniority / skill mismatch in verdict, and severity 'low'.
   The score, category, and verdict must NEVER contradict each other.`
    : EXTRACTION_PROMPT;

  const { object } = await generateObject({
    model,
    schema: DomainExtractSchema,
    instructions,
    prompt: trimmed || "No content provided.",
    temperature: 0.1,
    maxOutputTokens: 2500,
    seed: 42,
  });

  const res = { ...object } as ExtractOutput;

  // Calibrate and normalize score & fit categories to guarantee 100% UI and evaluation consistency
  if (typeof res.score === "number" && Number.isFinite(res.score)) {
    res.score = Math.max(0, Math.min(100, Math.round(res.score)));

    // When evaluating candidates against fit categories, enforce consistency between score and category/severity
    const knownFitCategories = new Set([
      "Strong Fit",
      "Potential",
      "Unqualified",
      "strong fit",
      "potential",
      "unqualified",
    ]);
    const isFitCategory =
      !res.category || knownFitCategories.has(res.category) || Boolean(criteriaOverride);

    if (isFitCategory) {
      if (res.score >= 80) {
        res.category = "Strong Fit";
        if (!res.severity || res.severity === "low" || res.severity === "medium") {
          res.severity = res.score >= 90 ? "critical" : "high";
        }
      } else if (res.score >= 50) {
        res.category = "Potential";
        if (!res.severity || res.severity === "low" || res.severity === "critical") {
          res.severity = "medium";
        }
      } else {
        res.category = "Unqualified";
        if (!res.severity || res.severity === "high" || res.severity === "critical") {
          res.severity = "low";
        }
      }
    }
  }

  return res;
}

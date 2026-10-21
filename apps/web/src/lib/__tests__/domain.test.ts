import { describe, it, expect } from "vitest";
import { z } from "zod";
import { MockLanguageModelV3 } from "ai/test";
import { DOMAINS, domain } from "@/lib/domain";
import { ExtractResultSchema } from "@/lib/contracts";
import { extractStructuredData } from "@/lib/ai/extract";
import { buildChatInstructions } from "@/lib/ai/prompts/system";

const usage = {
  inputTokens: { total: 5, noCache: 5, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};
const mock = (obj: unknown) =>
  new MockLanguageModelV3({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(obj) }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });

describe("domain registry", () => {
  for (const [id, d] of Object.entries(DOMAINS)) {
    it(`${id}: extraction schema converts to JSON Schema without throwing and has no free-form records`, () => {
      const schema = ExtractResultSchema.extend({ fields: d.fieldsSchema.optional().catch(undefined) });
      const json = JSON.stringify(z.toJSONSchema(schema, { io: "output", unrepresentable: "any" }));
      expect(json).toContain("summary");
      expect(json).not.toContain('"additionalProperties":{');
    });
  }
});

describe("extractStructuredData with new fields", () => {
  it("passes through severity, score (coerced from string), category", async () => {
    const r = await extractStructuredData("x", mock({ summary: "s", tags: ["a"], severity: "high", score: "82", category: "saas" }));
    expect(r.severity).toBe("high");
    expect(r.score).toBe(82);
    expect(r.category).toBe("saas");
  });
  it("recovers from bad severity and out-of-range score", async () => {
    const r = await extractStructuredData("x", mock({ summary: "s", tags: ["a"], severity: "HIGH", score: 400 }));
    expect(r.severity).toBeUndefined();
    expect(r.score).toBeUndefined();
    expect(r.summary).toBe("s");
  });
  it("old-shape responses (no new fields) still parse", async () => {
    const r = await extractStructuredData("x", mock({ summary: "s", tags: ["a"] }));
    expect(r.fields).toBeUndefined();
  });
  it("validates domain fields", async () => {
    const validFields = { strengths: ["p1"], weaknesses: ["p2"], verdict: "Strong fit", yearsOfExperience: 5 };
    const r = await extractStructuredData("x", mock({ summary: "s", tags: ["a"], fields: validFields }));
    expect(r.fields).toEqual(validFields);
  });
  it("malformed fields fall back to undefined instead of failing", async () => {
    const r = await extractStructuredData("x", mock({ summary: "s", tags: ["a"], fields: { keyPoints: "not-an-array" } }));
    expect(r.fields).toBeUndefined();
    expect(r.summary).toBe("s");
  });
});

describe("buildChatInstructions", () => {
  it("embeds sources with sanitized titles and the citation rule", () => {
    const out = buildChatInstructions([{ id: "abc123", title: 'Bad "title" | ]x', content: "body" }]);
    expect(out).toContain('<source id="abc123" title="Bad  title     x">');
    expect(out).toContain("[[item:<id>|<title>]]");
    expect(out).toContain("untrusted");
  });
  it("says so when there is no context", () => {
    expect(buildChatInstructions([])).toContain(`No ${domain.labels.plural.toLowerCase()} matched`);
  });
});

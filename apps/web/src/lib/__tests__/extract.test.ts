import { describe, it, expect } from "vitest";
import { MockLanguageModelV3 } from "ai/test";
import { extractStructuredData } from "@/lib/ai/extract";
import { ExtractResultSchema } from "@/lib/contracts";

describe("Structured Output Extraction (extractStructuredData)", () => {
  it("extracts structured data conforming to ExtractResultSchema using MockLanguageModelV3", async () => {
    const expectedOutput = {
      summary: "Quarterly review showing $4.2M revenue and 15% YoY growth.",
      tags: ["finance", "revenue", "q3", "growth"],
      confidenceScore: 0.95,
      actionItems: ["Investigate APAC supply chain delay"],
    };

    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(expectedOutput),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 25, noCache: 25, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 35, text: 35, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    const input =
      "Q3 revenue reached $4.2M, up 15% YoY. Net margin expanded to 22%. Key risk: supply chain in APAC.";
    const result = await extractStructuredData(input, mockModel);

    // Verify schema adherence
    const parsed = ExtractResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);

    expect(result.summary).toBe(expectedOutput.summary);
    expect(result.tags).toEqual(expectedOutput.tags);
    expect(result.confidenceScore).toBe(0.95);
    expect(result.actionItems).toEqual(["Investigate APAC supply chain delay"]);

    // Verify model was called with input text
    expect(mockModel.doGenerateCalls.length).toBe(1);
    const callOptions = mockModel.doGenerateCalls[0];
    expect(callOptions).toBeDefined();
  });

  it("handles optional fields with defaults when LLM omits confidenceScore and actionItems", async () => {
    const minimalOutput = {
      summary: "Concise summary without optional fields.",
      tags: ["minimal", "fallback", "test"],
    };

    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(minimalOutput),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 15, text: 15, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    const result = await extractStructuredData("Short text", mockModel);

    expect(result.summary).toBe("Concise summary without optional fields.");
    expect(result.tags).toEqual(["minimal", "fallback", "test"]);
    // In ExtractResultSchema, optional() allows undefined without error;
    // .catch() only triggers when validation fails (e.g. out of range).
    expect(result.confidenceScore).toBeUndefined();
    expect(result.actionItems).toBeUndefined();
  });

  it("safely recovers from invalid confidenceScore via Zod catch fallback", async () => {
    // When LLM generates invalid confidenceScore (e.g. out of [0, 1] range)
    const outOfRangeOutput = {
      summary: "Output with out-of-range confidence score.",
      tags: ["robustness", "fallback"],
      confidenceScore: 5.0, // Invalid: exceeds max(1)
      actionItems: [],
    };

    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify(outOfRangeOutput),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 20, text: 20, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    const result = await extractStructuredData("Sample input", mockModel);
    expect(result.summary).toBe("Output with out-of-range confidence score.");
    // Zod schema .catch(1) catches the out-of-range score
    expect(result.confidenceScore).toBe(1);
  });

  it("handles empty or whitespace-only input without crashing", async () => {
    const fallbackOutput = {
      summary: "No meaningful content was provided.",
      tags: ["empty", "placeholder"],
      confidenceScore: 0.1,
      actionItems: [],
    };

    let promptSeen = "";
    const mockModel = new MockLanguageModelV3({
      doGenerate: async (options) => {
        promptSeen = JSON.stringify(options.prompt);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(fallbackOutput),
            },
          ],
          finishReason: { unified: "stop", raw: undefined },
          usage: {
            inputTokens: { total: 5, noCache: 5, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 15, text: 15, reasoning: 0 },
          },
          warnings: [],
        };
      },
    });

    const result = await extractStructuredData("     ", mockModel);
    expect(result.summary).toBe("No meaningful content was provided.");
    expect(promptSeen).toContain("No content provided.");
  });

  it("propagates error when model call fails", async () => {
    const failingModel = new MockLanguageModelV3({
      doGenerate: async () => {
        throw new Error("Provider rate limit or offline simulation error");
      },
    });

    await expect(
      extractStructuredData("Test content", failingModel)
    ).rejects.toThrow("Provider rate limit or offline simulation error");
  });

  it("propagates error when model output is completely malformed and unparseable", async () => {
    const malformedModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: "THIS_IS_NOT_VALID_JSON_AT_ALL",
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 10, text: 10, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    await expect(
      extractStructuredData("Test content", malformedModel)
    ).rejects.toThrow();
  });

  it("enforces mutual consistency between score and candidate fit category", async () => {
    // LLM returned a drifting category "Potential" despite a high score of 88
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Senior engineer with 6 years of Next.js experience.",
              tags: ["nextjs", "react", "typescript"],
              category: "Potential", // Drifting category
              score: 88,
              severity: "low",
            }),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 20, text: 20, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    const result = await extractStructuredData("Senior Next.js Developer", mockModel, "Senior Role Criteria");
    // Should be calibrated to Strong Fit and high/critical severity
    expect(result.score).toBe(88);
    expect(result.category).toBe("Strong Fit");
    expect(result.severity).toBe("high");
  });

  it("calibrates low scores (< 50) to Unqualified and severity low", async () => {
    const mockModel = new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary: "Junior developer with 6 months of HTML/CSS.",
              tags: ["html", "css"],
              category: "Strong Fit", // Blatant drift
              score: 35,
              severity: "critical",
            }),
          },
        ],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 20, text: 20, reasoning: 0 },
        },
        warnings: [],
      }),
    });

    const result = await extractStructuredData("Junior Developer", mockModel, "Senior Role Criteria");
    expect(result.score).toBe(35);
    expect(result.category).toBe("Unqualified");
    expect(result.severity).toBe("low");
  });
});

import { gateway } from "@ai-sdk/gateway";
import { createGoogle, google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel, EmbeddingModel } from "ai";

/**
 * Model Registry — single source of truth for all AI model references.
 *
 * The default route is Vercel AI Gateway when AI_GATEWAY_API_KEY is present,
 * or direct to @ai-sdk/google when using GOOGLE_GENERATIVE_AI_API_KEY.
 *
 * It falls back seamlessly to key B or OpenRouter (OPENROUTER_API_KEY) if quota is exhausted.
 */
export const USE_GATEWAY = Boolean(process.env.AI_GATEWAY_API_KEY);

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  const status = (err.status ?? err.statusCode) as number | undefined;
  if (status === 429 || status === 503 || status === 502 || status === 504) return true;

  const errStr = (
    String(error) +
    " " +
    (typeof err.message === "string" ? err.message : "") +
    " " +
    (typeof err.responseBody === "string" ? err.responseBody : "") +
    " " +
    (err.cause ? String(err.cause) : "") +
    " " +
    JSON.stringify(err.data || {})
  ).toLowerCase();

  return (
    errStr.includes("429") ||
    errStr.includes("503") ||
    errStr.includes("502") ||
    errStr.includes("504") ||
    errStr.includes("quota") ||
    errStr.includes("resource_exhausted") ||
    errStr.includes("rate limit") ||
    errStr.includes("rate_limit") ||
    errStr.includes("too many requests") ||
    errStr.includes("unavailable") ||
    errStr.includes("enotfound") ||
    errStr.includes("econnrefused") ||
    errStr.includes("econnreset") ||
    errStr.includes("etimedout") ||
    errStr.includes("fetch failed") ||
    errStr.includes("cannot connect to api") ||
    errStr.includes("network error")
  );
}

export function getModelWithQuotaFallback(modelId: string = "gemini-3.6-flash"): LanguageModel {
  const keyA = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const keyB = process.env.GOOGLE_GENERATIVE_AI_API_KEY_B;
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

  // If only OpenRouter is provided
  if (!keyA && !keyB && hasOpenRouter) {
    return openrouter.chat("google/gemini-pro");
  }

  const googleA = keyA ? createGoogle({ apiKey: keyA }) : google;
  const modelA = googleA(modelId);
  const modelB = keyB ? createGoogle({ apiKey: keyB })(modelId) : null;
  const modelC = hasOpenRouter ? openrouter.chat("google/gemini-pro") : null;

  if (!modelB && !modelC) {
    return modelA;
  }

  const fallbackModel: LanguageModel = {
    specificationVersion: "v4" as const,
    provider: modelA.provider || "google.generative-ai",
    modelId: modelA.modelId,
    get supportedUrls() {
      return modelA.supportedUrls;
    },
    async doGenerate(options: Parameters<typeof modelA.doGenerate>[0]) {
      try {
        return await modelA.doGenerate(options);
      } catch (err) {
        if (isQuotaError(err)) {
          if (modelB) {
            console.warn(`[models] Primary key quota exceeded for ${modelId}; failing over to key B`);
            try { return await modelB.doGenerate(options); } catch (e) {
               if (modelC) {
                 console.warn(`[models] Key B quota exceeded for ${modelId}; failing over to OpenRouter`);
                 return await modelC.doGenerate(options);
               }
               throw e;
            }
          }
          if (modelC) {
            console.warn(`[models] Primary key quota exceeded for ${modelId}; failing over to OpenRouter`);
            return await modelC.doGenerate(options);
          }
        }
        throw err;
      }
    },
    async doStream(options: Parameters<typeof modelA.doStream>[0]) {
      try {
        return await modelA.doStream(options);
      } catch (err) {
        if (isQuotaError(err)) {
          if (modelB) {
            console.warn(`[models] Primary key quota exceeded on stream for ${modelId}; failing over to key B`);
            try { return await modelB.doStream(options); } catch(e) {
               if (modelC) {
                 console.warn(`[models] Key B quota exceeded on stream for ${modelId}; failing over to OpenRouter`);
                 return await modelC.doStream(options);
               }
               throw e;
            }
          }
          if (modelC) {
            console.warn(`[models] Primary key quota exceeded on stream for ${modelId}; failing over to OpenRouter`);
            return await modelC.doStream(options);
          }
        }
        throw err;
      }
    },
  };

  return fallbackModel;
}

export function getEmbeddingModelWithQuotaFallback(modelId: string = "gemini-embedding-001"): EmbeddingModel {
  const keyA = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const keyB = process.env.GOOGLE_GENERATIVE_AI_API_KEY_B;

  const googleA = keyA ? createGoogle({ apiKey: keyA }) : google;
  const modelA = googleA.embeddingModel(modelId);

  if (!keyB) {
    return modelA;
  }

  const googleB = createGoogle({ apiKey: keyB });
  const modelB = googleB.embeddingModel(modelId);

  const fallbackEmbeddingModel: EmbeddingModel = {
    specificationVersion: "v4" as const,
    provider: modelA.provider || "google.generative-ai",
    modelId: modelA.modelId,
    maxEmbeddingsPerCall: modelA.maxEmbeddingsPerCall,
    supportsParallelCalls: modelA.supportsParallelCalls,
    async doEmbed(options: Parameters<typeof modelA.doEmbed>[0]) {
      try {
        return await modelA.doEmbed(options);
      } catch (err) {
        if (isQuotaError(err)) {
          console.warn(`[models] Primary key quota exceeded for embedding ${modelId}; failing over to key B`);
          return await modelB.doEmbed(options);
        }
        throw err;
      }
    },
  };

  return fallbackEmbeddingModel;
}

export const DEFAULT_CHAT_MODEL = process.env.CHAT_MODEL_ID || "gemini-3.6-flash";

export const chatModel: LanguageModel = USE_GATEWAY
  ? gateway(`google/${DEFAULT_CHAT_MODEL}`)
  : getModelWithQuotaFallback(DEFAULT_CHAT_MODEL);

export const fastModel: LanguageModel = USE_GATEWAY
  ? gateway("google/gemini-3.5-flash-lite")
  : getModelWithQuotaFallback("gemini-3.5-flash-lite");

export const embeddingModel: EmbeddingModel = USE_GATEWAY
  ? gateway.embeddingModel("google/gemini-embedding-001")
  : getEmbeddingModelWithQuotaFallback("gemini-embedding-001");

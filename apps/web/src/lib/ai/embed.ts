import { embed, embedMany, type EmbeddingModel } from "ai";
import { EMBEDDING_DIMENSIONS } from "@/lib/contracts";
import { embeddingModel as defaultEmbeddingModel } from "@/lib/ai/models";

// Re-export EMBEDDING_DIMENSIONS single source of truth from contracts (do not redefine literal)
export { EMBEDDING_DIMENSIONS };

/**
 * Generate a vector embedding for a single text string using the registered embeddingModel.
 * Accepts an optional modelOverride for test mocking (e.g. MockEmbeddingModelV3).
 */
export async function embedText(
  text: string,
  modelOverride?: EmbeddingModel
): Promise<number[]> {
  const model = modelOverride || defaultEmbeddingModel;
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  });
  return embedding;
}

/**
 * Generate vector embeddings for multiple text strings in batch.
 * If input array is empty, returns an empty array immediately.
 * Accepts an optional modelOverride for test mocking (e.g. MockEmbeddingModelV3).
 */
export async function embedManyTexts(
  texts: string[],
  modelOverride?: EmbeddingModel
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }
  const model = modelOverride || defaultEmbeddingModel;
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  });
  return embeddings;
}

/**
 * Compute the cosine similarity between two numeric vectors.
 * Returns a value in the range [-1.0, 1.0].
 * Throws an Error if the vector dimensions do not match.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimension mismatch: vector a has ${a.length} and vector b has ${b.length}`);
  }
  if (a.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i]!;
    const valB = b[i]!;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp to [-1, 1] to avoid float precision boundary overflows
  return Math.min(1, Math.max(-1, similarity));
}

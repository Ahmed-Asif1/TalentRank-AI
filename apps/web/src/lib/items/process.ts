import { extractStructuredData } from "@/lib/ai/extract";
import { embedText } from "@/lib/ai/embed";
import { connectMongoose } from "@/lib/db";
import { ItemModel } from "@/lib/models";
import { logger } from "@/lib/logger";

/**
 * Runs structured extraction + embedding for one item and persists the result.
 * Shared by the dashboard create action, the re-run action, and the createItem chat tool,
 * so every path produces an embedding (RAG needs it) and the domain fields.
 * Scoped by ownerId so it can never touch another user's item.
 */
export async function processItem(itemId: string, ownerId: string): Promise<"processed" | "failed"> {
  await connectMongoose();
  const item = await ItemModel.findOne({ _id: itemId, ownerId });
  if (!item) return "failed";

  const text = (item.content || item.title).trim();
  const [extraction, embedding] = await Promise.allSettled([
    extractStructuredData(text),
    embedText(`${item.title}\n${text}`),
  ]);

  if (extraction.status === "fulfilled") {
    const r = extraction.value;
    item.aiSummary = r.summary;
    item.aiTags = r.tags;
    item.category = r.category;
    item.severity = r.severity;
    item.score = r.score;
    item.fields = r.fields;
    item.status = "processed";
  } else {
    logger.warn("[process] Extraction failed", { itemId, error: String(extraction.reason) });
    item.status = "failed";
  }

  if (embedding.status === "fulfilled") {
    item.embedding = embedding.value;
  } else {
    logger.warn("[process] Embedding failed", { itemId, error: String(embedding.reason) });
  }

  await item.save();
  return item.status === "processed" ? "processed" : "failed";
}

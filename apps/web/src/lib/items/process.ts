import { extractStructuredData } from "@/lib/ai/extract";
import { embedText } from "@/lib/ai/embed";
import { connectMongoose } from "@/lib/db";
import { ItemModel, JobCriteriaModel } from "@/lib/models";
import { logger } from "@/lib/logger";
import { cleanCandidateProfileText, extractLinkedInUrl } from "@/lib/candidate-ui";

/**
 * Runs structured extraction + embedding for one item and persists the result.
 * Shared by the dashboard create action, the re-run action, and the createItem chat tool,
 * so every path produces an embedding (RAG needs it) and the domain fields.
 * Scoped by ownerId so it can never touch another user's item.
 */
export async function processItem(itemId: string, ownerId: string): Promise<"processed" | "failed"> {
  await connectMongoose();

  // Find candidate item by ID, with flexible owner matching so demo and session users never mismatch
  let item = await ItemModel.findOne({
    _id: itemId,
    ...(ownerId
      ? {
          $or: [
            { ownerId },
            { ownerId: "demo@example.com" },
            { ownerId: "6ac38d4d38823f67c5b6a9ae" },
          ],
        }
      : {}),
  });

  if (!item) {
    item = await ItemModel.findById(itemId);
  }
  if (!item) return "failed";

  // Auto-detect & persist candidate's LinkedIn URL from content or title
  const extractedUrl =
    extractLinkedInUrl(item.content) ||
    extractLinkedInUrl(item.title);
  if (extractedUrl) {
    item.sourceUrl = extractedUrl;
  }

  // Check if owner or demo session has configured active custom job criteria
  let criteriaPrompt: string | undefined;
  try {
    const activeCriteria = await JobCriteriaModel.findOne({
      $or: [
        ...(ownerId ? [{ ownerId }] : []),
        { ownerId: item.ownerId },
        { ownerId: "6ac38d4d38823f67c5b6a9ae" },
        { ownerId: "demo@example.com" },
      ],
      isActive: true,
    }).sort({ updatedAt: -1, createdAt: -1 });

    if (activeCriteria?.expandedCriteria) {
      criteriaPrompt = `Target Job Role: ${activeCriteria.roleTitle}\n\n${activeCriteria.expandedCriteria}`;
    }
  } catch (critErr) {
    logger.warn("[process] Failed to fetch active job criteria", { error: String(critErr) });
  }

  // Token & quality optimization: Clean web boilerplate while preserving deep candidate experience
  const rawText = (item.content || item.title).trim();
  const cleanedText = cleanCandidateProfileText(rawText);
  // 12,000 characters (~2,500-3,000 tokens) preserves extensive multi-page resumes and technical projects
  const textForExtraction = (cleanedText || rawText).slice(0, 12000);
  // 3,500 characters preserves rich qualifications for dense vector embeddings
  const textForEmbedding = `${item.title}\n${(cleanedText || rawText).slice(0, 3500)}`;

  const [extraction, embedding] = await Promise.allSettled([
    extractStructuredData(textForExtraction, undefined, criteriaPrompt),
    embedText(textForEmbedding),
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

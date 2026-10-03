import path from "node:path";
import { loadEnvConfig } from "@next/env";

// Load .env and .env.local matching Next.js resolution rules
loadEnvConfig(process.cwd());
loadEnvConfig(path.resolve(process.cwd(), "apps/web"));

/**
 * Replaces every item's embedding with a real model embedding.
 * seed.ts writes deterministic fake vectors (so it runs offline), which make vector search
 * rank seeded items arbitrarily. Run this once with a live key before demoing: npm run db:reembed
 */
async function main(): Promise<void> {
  const { connectMongoose } = await import("@/lib/db");
  const { ItemModel } = await import("@/lib/models");
  const { embedManyTexts } = await import("@/lib/ai/embed");
  const { logger } = await import("@/lib/logger");

  await connectMongoose();
  const items = await ItemModel.find({}).select("_id title content");
  if (items.length === 0) {
    logger.info("No items to re-embed.");
    return;
  }
  const vectors = await embedManyTexts(items.map((i) => `${i.title}\n${i.content ?? ""}`));
  let updated = 0;
  for (let i = 0; i < items.length; i++) {
    const vector = vectors[i];
    const item = items[i];
    if (!vector || !item) continue;
    await ItemModel.updateOne({ _id: item._id }, { $set: { embedding: vector } });
    updated++;
  }
  logger.info(`Re-embedded ${updated} of ${items.length} items.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });

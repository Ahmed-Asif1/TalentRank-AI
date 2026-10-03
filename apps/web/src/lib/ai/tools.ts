import { tool } from "ai";
import { z } from "zod";
import mongoose from "mongoose";
import { SEVERITY_LEVELS, SeveritySchema } from "@/lib/contracts";
import { connectMongoose } from "@/lib/db";
import { ItemModel } from "@/lib/models";
import { retrieveContext } from "@/lib/ai/rag";
import { processItem } from "@/lib/items/process";
import { logger } from "@/lib/logger";

/**
 * Chat tools, created per request so every query is scoped to the session's ownerId.
 * (The previous module-level tools hardcoded ownerId "system" and searched every user's items.)
 * All five are domain-agnostic: they work on severity/score/fields, whatever the domain is.
 */
export function createTools(ownerId: string) {
  return {
    searchItems: tool({
      description: "Search the user's records by meaning and keywords. Use for finding relevant records.",
      inputSchema: z.object({ query: z.string().describe("The search query") }),
      execute: async ({ query }: { query: string }) => {
        const results = await retrieveContext(query, ownerId, 5);
        return {
          items: results.map((r) => ({
            id: r.id,
            title: r.title,
            excerpt: r.content.slice(0, 300),
            score: r.score,
          })),
        };
      },
    }),

    getItem: tool({
      description: "Get one of the user's records by id, including its analysis.",
      inputSchema: z.object({ id: z.string().describe("The record id") }),
      execute: async ({ id }: { id: string }) => {
        if (!mongoose.isValidObjectId(id)) return { item: null };
        await connectMongoose();
        const doc = await ItemModel.findOne({ _id: id, ownerId }).lean();
        if (!doc) return { item: null };
        return {
          item: {
            id: String(doc._id),
            title: doc.title,
            content: doc.content,
            aiSummary: doc.aiSummary,
            category: doc.category,
            severity: doc.severity,
            score: doc.score,
            fields: doc.fields,
          },
        };
      },
    }),

    createItem: tool({
      description: "Save a new record for the user and analyze it. Only use when the user asks to add something.",
      inputSchema: z.object({
        title: z.string().describe("Title of the record"),
        content: z.string().describe("Full text of the record"),
      }),
      execute: async ({ title, content }: { title: string; content: string }) => {
        try {
          await connectMongoose();
          const doc = await ItemModel.create({ ownerId, title, content, status: "pending", aiTags: [] });
          const id = String(doc._id);
          const status = await processItem(id, ownerId);
          return { success: true, id, title, status };
        } catch (err) {
          logger.warn("[tools] createItem failed", { error: String(err) });
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    }),

    getPortfolioStats: tool({
      description:
        "Counts by severity, average score, and the top records by score. Use for overview questions like 'what is riskiest' or 'how many are urgent'.",
      inputSchema: z.object({
        severity: SeveritySchema.optional().describe("Only include records at this severity"),
      }),
      execute: async ({ severity }: { severity?: (typeof SEVERITY_LEVELS)[number] }) => {
        await connectMongoose();
        const docs = await ItemModel.find({ ownerId, ...(severity ? { severity } : {}) })
          .sort({ score: -1 })
          .limit(200)
          .lean();
        const scored = docs.filter((d) => typeof d.score === "number");
        return {
          total: docs.length,
          bySeverity: Object.fromEntries(
            SEVERITY_LEVELS.map((level) => [level, docs.filter((d) => d.severity === level).length])
          ),
          avgScore: scored.length
            ? Math.round(scored.reduce((sum, d) => sum + (d.score ?? 0), 0) / scored.length)
            : null,
          top: docs.slice(0, 3).map((d) => ({
            id: String(d._id),
            title: d.title,
            severity: d.severity,
            score: d.score,
          })),
        };
      },
    }),

    compareItems: tool({
      description: "Compare 2 to 4 records side by side (severity, score, category and extracted fields).",
      inputSchema: z.object({ ids: z.array(z.string()).min(2).max(4).describe("Record ids to compare") }),
      execute: async ({ ids }: { ids: string[] }) => {
        const valid = ids.filter((id) => mongoose.isValidObjectId(id));
        await connectMongoose();
        const docs = await ItemModel.find({ _id: { $in: valid }, ownerId }).lean();
        return {
          items: docs.map((d) => ({
            id: String(d._id),
            title: d.title,
            category: d.category,
            severity: d.severity,
            score: d.score,
            summary: d.aiSummary,
            fields: d.fields,
          })),
        };
      },
    }),
  };
}

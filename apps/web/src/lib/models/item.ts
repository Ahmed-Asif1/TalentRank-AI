// Manifest item 23: Item model — the single domain entity (contract / meeting / ticket / generic).
// Domain-specific shape lives in `fields` (Mixed), validated at extraction time by src/lib/domain.ts.
import mongoose, { Schema, type Model } from "mongoose";
import { SEVERITY_LEVELS, type Item } from "@/lib/contracts";

export type IItem = Omit<Item, "_id">;

const ItemMongooseSchema = new Schema<IItem>(
  {
    // Scopes every query to the authenticated session owner
    ownerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    sourceUrl: { type: String },
    mime: { type: String },
    status: { type: String, enum: ["pending", "processed", "failed"], default: "pending" },
    aiSummary: { type: String },
    aiTags: { type: [String], default: [] },
    category: { type: String },
    severity: { type: String, enum: [...SEVERITY_LEVELS] },
    score: { type: Number, min: 0, max: 100 },
    // Domain-specific extraction payload; Mixed so switching domains needs no migration
    fields: { type: Schema.Types.Mixed },
    // 768-dimensional vector matching text-embedding-004; indexed via Atlas Vector Search
    embedding: { type: [Number] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ItemMongooseSchema.index({ ownerId: 1, createdAt: -1 });
ItemMongooseSchema.index({ ownerId: 1, status: 1 });
ItemMongooseSchema.index({ ownerId: 1, severity: 1 });

// Re-use compiled model in Next.js hot-reloading dev environment to avoid OverwriteModelError
export const ItemModel: Model<IItem> =
  (mongoose.models.Item as Model<IItem>) || mongoose.model<IItem>("Item", ItemMongooseSchema);

import mongoose, { Schema, type Model } from "mongoose";

export interface IJobCriteria {
  ownerId: string;
  roleTitle: string;
  rawRequirements: string;
  expandedCriteria: string;
  rubric?: {
    mustHave: string[];
    niceToHave: string[];
    scoringGuidelines?: string;
    interviewQuestions?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobCriteriaSchema = new Schema<IJobCriteria>(
  {
    ownerId: { type: String, required: true, index: true },
    roleTitle: { type: String, required: true },
    rawRequirements: { type: String, required: true },
    expandedCriteria: { type: String, required: true },
    rubric: {
      mustHave: { type: [String], default: [] },
      niceToHave: { type: [String], default: [] },
      scoringGuidelines: { type: String },
      interviewQuestions: { type: [String], default: [] },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

JobCriteriaSchema.index({ ownerId: 1, isActive: 1 });

export const JobCriteriaModel: Model<IJobCriteria> =
  (mongoose.models.JobCriteria as Model<IJobCriteria>) ||
  mongoose.model<IJobCriteria>("JobCriteria", JobCriteriaSchema);

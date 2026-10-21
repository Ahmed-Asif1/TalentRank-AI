import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { connectMongoose } from "@/lib/db";
import { JobCriteriaModel, ItemModel } from "@/lib/models";
import { fastModel } from "@/lib/ai/models";
import { processItem } from "@/lib/items/process";
import { logger } from "@/lib/logger";

const CriteriaExpansionSchema = z.object({
  roleSummary: z.string().describe("2-sentence summary of the target candidate profile"),
  mustHave: z.array(z.string()).describe("3-5 non-negotiable mandatory requirements"),
  niceToHave: z.array(z.string()).describe("3-4 preferred qualifications and bonuses"),
  redFlags: z.array(z.string()).describe("2-3 disqualifying patterns or anti-patterns"),
  scoringGuidelines: z.string().describe("Point-by-point scoring guidelines totaling 100 points"),
  interviewQuestions: z.array(z.string()).describe("3 targeted technical screen questions"),
  fullCriteriaPrompt: z.string().describe("Complete evaluation rubric markdown to inject into candidate scoring"),
});

async function getSessionUserId(req: NextRequest): Promise<string> {
  let userId = env.DEMO_USER_EMAIL || "demo@example.com";
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (session?.user?.id) userId = session.user.id;
    else if (session?.user?.email) userId = session.user.email;
  } catch (err) {
    // Demo user fallback
  }
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    await connectMongoose();
    const ownerId = await getSessionUserId(req);

    const activeCriteria = await JobCriteriaModel.findOne({
      $or: [
        { ownerId },
        { ownerId: "6ac38d4d38823f67c5b6a9ae" },
        { ownerId: "demo@example.com" },
      ],
      isActive: true,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
    return NextResponse.json({ activeCriteria });
  } catch (err: any) {
    logger.error("[criteria] GET error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongoose();
    const ownerId = await getSessionUserId(req);
    const body = await req.json();
    const { action, roleTitle, requirements, expandedCriteria, rubric } = body;

    // 1. Generate/Expand Criteria using AI
    if (action === "generate") {
      if (!roleTitle || !requirements) {
        return NextResponse.json(
          { error: "Please provide both a Role Title and rough Requirements / Notes." },
          { status: 400 }
        );
      }

      const prompt = `You are a calibrated Principal Technical Recruiter and Hiring Bar Raiser.
The hiring team wants to hire for the following position:

Target Role: ${roleTitle}
Hiring Manager Requirements & Context:
${requirements}

Expand these notes into a comprehensive, balanced, and nuanced evaluation rubric:
- Set clear skill expectations across junior, mid, and senior levels.
- Define a 0-100 scoring breakdown with calibrated weighted categories:
  * Core Tech Stack (up to 40 pts) - award proportionate partial credit for emerging candidates with 1-2 yrs or related application framework experience.
  * Engineering Depth & Architecture (up to 25 pts)
  * Domain & Preferred Bonuses (up to 20 pts)
  * Trajectory & Education (up to 15 pts)
- Provide clear benchmark bands: Strong Fit (80-100), Potential (50-79), Unqualified for Senior (0-49).
- Reserve low scores (<20) strictly for non-technical or spam profiles. Do not assign 0 to real software engineers.
- Formulate 3 high-signal interview questions to verify claims during screening.`;

      const { object } = await generateObject({
        model: fastModel,
        schema: CriteriaExpansionSchema,
        prompt,
        temperature: 0.2,
        maxOutputTokens: 2500,
      });

      return NextResponse.json({ success: true, criteria: object });
    }

    // 2. Save and activate the criteria
    if (action === "save") {
      if (!roleTitle || !expandedCriteria) {
        return NextResponse.json({ error: "Missing roleTitle or expandedCriteria" }, { status: 400 });
      }

      // Deactivate any previously active criteria for this user or demo accounts
      await JobCriteriaModel.updateMany(
        {
          $or: [
            { ownerId },
            { ownerId: "demo@example.com" },
            { ownerId: "6ac38d4d38823f67c5b6a9ae" },
          ],
        },
        { $set: { isActive: false } }
      );

      const criteriaDoc = await JobCriteriaModel.create({
        ownerId,
        roleTitle,
        rawRequirements: requirements || roleTitle,
        expandedCriteria,
        rubric,
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        criteriaId: criteriaDoc._id.toString(),
        message: `Active evaluation criteria updated for "${roleTitle}"!`,
      });
    }

    // 3. Re-score a single candidate against active criteria
    if (action === "rescore_item") {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
      }
      const status = await processItem(itemId, ownerId);
      if (status === "failed") {
        return NextResponse.json({ error: "Failed to evaluate candidate" }, { status: 500 });
      }

      const updatedItem = await ItemModel.findById(itemId).lean();

      return NextResponse.json({
        success: true,
        message: "Candidate re-evaluated against the active criteria!",
        item: updatedItem
          ? {
              id: String(updatedItem._id),
              score: updatedItem.score,
              sourceUrl: updatedItem.sourceUrl,
              aiSummary: updatedItem.aiSummary,
            }
          : undefined,
      });
    }

    // 4. Re-score all existing candidates against the active criteria
    if (action === "rescore_all") {
      const candidates = await ItemModel.find({
        $or: [
          { ownerId },
          { ownerId: "demo@example.com" },
          { ownerId: "6ac38d4d38823f67c5b6a9ae" },
        ],
      })
        .select("_id")
        .lean();
      let rescoredCount = 0;

      for (const cand of candidates) {
        try {
          await processItem(String(cand._id), ownerId);
          rescoredCount++;
        } catch (rescoreErr) {
          logger.warn("[criteria] Failed to rescore candidate", { id: cand._id, error: String(rescoreErr) });
        }
      }

      return NextResponse.json({
        success: true,
        rescoredCount,
        message: `Successfully re-scored ${rescoredCount} candidates against the updated criteria!`,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err: any) {
    logger.error("[criteria] POST error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

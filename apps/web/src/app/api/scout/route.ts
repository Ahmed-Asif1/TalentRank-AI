import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { JobCriteriaModel } from "@/lib/models";
import {
  generateScoutPayloadWithGemini,
  buildScoutPayloadFromQuery,
  type ApifyScoutPayload,
} from "@/lib/scout/mapping";
import { executeScoutPipeline } from "@/lib/scout/service";

export const maxDuration = 60; // Allow up to 60s for Apify actor + Gemini scoring

export async function POST(req: Request) {
  try {
    await connectMongoose();

    const session = await auth.api.getSession({ headers: await headers() });
    const ownerId =
      session?.user?.id ||
      (session?.user as any)?.email ||
      "demo@example.com";

    const body = await req.json().catch(() => ({}));
    const {
      query,
      jobDescription,
      location,
      seniority,
      maxItems = 3,
      useActiveCriteria = false,
    } = body;

    let payload: ApifyScoutPayload;

    if (useActiveCriteria) {
      // Find active job rubric for the current user/demo session
      const activeCriteria = await JobCriteriaModel.findOne({
        $or: [
          { ownerId },
          { ownerId: "demo@example.com" },
          { ownerId: "6ac38d4d38823f67c5b6a9ae" },
        ],
        isActive: true,
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      if (activeCriteria) {
        const jd = `${activeCriteria.roleTitle}\n\nRequirements:\n${activeCriteria.rawRequirements || ""}\n\nRubric:\n${activeCriteria.expandedCriteria || ""}`;
        payload = await generateScoutPayloadWithGemini(jd, {
          query: activeCriteria.roleTitle,
          location,
          seniority: seniority as any,
          maxItems: Number(maxItems),
        });
      } else {
        payload = buildScoutPayloadFromQuery({
          query: query || "Senior React Engineer",
          location,
          seniority: seniority as any,
          maxItems: Number(maxItems),
        });
      }
    } else if (jobDescription && String(jobDescription).trim().length > 20) {
      payload = await generateScoutPayloadWithGemini(String(jobDescription), {
        query,
        location,
        seniority: seniority as any,
        maxItems: Number(maxItems),
      });
    } else {
      payload = buildScoutPayloadFromQuery({
        query: query || "Senior Full-Stack Engineer",
        location,
        seniority: seniority as any,
        maxItems: Number(maxItems),
      });
    }

    // Execute candidate search and evaluation pipeline
    const candidates = await executeScoutPipeline({
      payload,
      ownerId,
    });

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
      payloadUsed: {
        searchQuery: payload.searchQuery,
        locations: payload.locations,
        functionIds: payload.functionIds,
        seniorityLevelIds: payload.seniorityLevelIds,
        maxItems: payload.maxItems,
      },
    });
  } catch (error) {
    console.error("[API /api/scout] Internal Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to scout candidates.",
      },
      { status: 500 }
    );
  }
}

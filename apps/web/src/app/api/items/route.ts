// Manifest item 37: List and create items route handler
// PLACEHOLDER DOMAIN — replace when real product domain is finalized.
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ItemCreateInputSchema } from "@/lib/contracts";
import { connectMongoose } from "@/lib/db";
import { ItemModel } from "@/lib/models";
import { processItem } from "@/lib/items/process";
import { logger } from "@/lib/logger";
import { extractLinkedInUrl } from "@/lib/candidate-ui";

/**
 * Retrieves the authenticated session owner info from Better Auth.
 * Falls back to anonymous session creation if no session exists, or null on failure.
 */
async function getSessionOwnerInfo(): Promise<{ id: string; email?: string } | null> {
  const reqHeaders = await headers();
  let session = null;
  try {
    session = await auth.api.getSession({ headers: reqHeaders });
  } catch (sessionErr) {
    logger.warn("[items] Failed to retrieve auth session", { error: String(sessionErr) });
  }

  if (session?.user?.id) {
    return { id: session.user.id, email: session.user.email };
  }

  try {
    const anon = await auth.api.signInAnonymous({ headers: reqHeaders });
    if (anon?.user?.id) {
      return { id: anon.user.id, email: anon.user.email };
    }
  } catch (anonErr) {
    logger.warn("[items] Anonymous sign-in attempt failed", { error: String(anonErr) });
  }

  return null;
}

function buildOwnerFilter(ownerInfo: { id: string; email?: string }) {
  const isDemo =
    ownerInfo.email === "demo@example.com" ||
    ownerInfo.id === "6ac38d4d38823f67c5b6a9ae";

  if (isDemo) {
    return {
      $or: [
        { ownerId: ownerInfo.id },
        { ownerId: "demo@example.com" },
        { ownerId: "6ac38d4d38823f67c5b6a9ae" },
      ],
    };
  }

  return {
    $or: [
      { ownerId: ownerInfo.id },
      ...(ownerInfo.email ? [{ ownerId: ownerInfo.email }] : []),
    ],
  };
}

export async function GET(req: Request): Promise<Response> {
  try {
    await connectMongoose();
    const ownerInfo = await getSessionOwnerInfo();

    if (!ownerInfo) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ownerFilter = buildOwnerFilter(ownerInfo);
    const items = await ItemModel.find(ownerFilter).sort({ createdAt: -1 }).lean();

    const formattedItems = items.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      content: item.content,
      sourceUrl: item.sourceUrl,
      mime: item.mime,
      status: item.status,
      aiSummary: item.aiSummary,
      aiTags: item.aiTags ?? [],
      createdAt: item.createdAt,
    }));

    return Response.json({ items: formattedItems });
  } catch (err) {
    logger.error("[items] Failed to fetch items", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await connectMongoose();
    const ownerInfo = await getSessionOwnerInfo();

    if (!ownerInfo) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ownerId = ownerInfo.id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Zod validation with ItemCreateInputSchema — client-supplied ownerId is never trusted
    const parsed = ItemCreateInputSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.format() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { title, content, sourceUrl, mime } = parsed.data;

    const detectedSourceUrl =
      sourceUrl ||
      extractLinkedInUrl(content) ||
      extractLinkedInUrl(title);

    const contentToProcess = content && content.trim().length > 0 ? content : title;

    const item = await ItemModel.create({
      ownerId, // Enforce session ownerId
      title,
      content: contentToProcess,
      sourceUrl: detectedSourceUrl,
      mime,
      status: "pending",
      aiTags: [],
    });
    
    const id = item._id.toString();
    
    // Call the shared process pipeline so domain fields (category, severity, score, fields) are properly populated
    try {
      await processItem(id, ownerId);
    } catch (processErr: any) {
      logger.error("[items] LLM processing failed", processErr);
      return new Response(JSON.stringify({ error: `LLM processing failed: ${processErr.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Re-fetch the item to get the fully processed fields
    const processedItem = await ItemModel.findById(id).lean();

    const responseItem = {
      id: processedItem?._id.toString() || id,
      title: processedItem?.title || title,
      content: processedItem?.content || contentToProcess,
      sourceUrl: processedItem?.sourceUrl || sourceUrl,
      mime: processedItem?.mime || mime,
      status: processedItem?.status || "pending",
      aiSummary: processedItem?.aiSummary,
      aiTags: processedItem?.aiTags ?? [],
      category: processedItem?.category,
      severity: processedItem?.severity,
      score: processedItem?.score,
      fields: processedItem?.fields,
      createdAt: processedItem?.createdAt,
    };

    return Response.json(
      {
        ...responseItem,
        item: responseItem,
      },
      { status: 201 }
    );
  } catch (dbErr) {
    logger.error("[items] Failed to create item in database", dbErr);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    await connectMongoose();
    const ownerInfo = await getSessionOwnerInfo();

    if (!ownerInfo) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    let id: string | null = searchParams.get("id");

    if (!id) {
      try {
        const body = (await req.json()) as { id?: string };
        id = body?.id ?? null;
      } catch {
        // searchParams fallback
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing candidate ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Direct deletion by ID enables anonymous demo and recruiter pipelines to delete candidates cleanly
    let deleted = await ItemModel.findByIdAndDelete(id);
    if (!deleted) {
      deleted = await ItemModel.findOneAndDelete({ _id: id });
    }

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Candidate not found or already deleted." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return Response.json({
      success: true,
      message: "Candidate profile deleted successfully.",
    });
  } catch (err) {
    logger.error("[items] Failed to delete candidate", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

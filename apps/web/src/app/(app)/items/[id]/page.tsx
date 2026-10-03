import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  RotateCcw,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { connectToDatabase, connectMongoose } from "@/lib/db";
import { ItemModel } from "@/lib/models";
import { processItem } from "@/lib/items/process";
import { SeverityBadge } from "@/components/domain/severity-badge";
import { FieldsPanel } from "@/components/domain/fields-panel";
import { domain } from "@/lib/domain";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StructuredResult } from "@/components/ai/structured-result";
import { Chat } from "@/components/ai/chat";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/");
  }

  await connectToDatabase();
  await connectMongoose();
  const rawItem = await ItemModel.findOne({ _id: id, ownerId: session.user.id }).lean();

  if (!rawItem) {
    notFound();
  }

  const item = {
    _id: rawItem._id.toString(),
    title: rawItem.title,
    content: rawItem.content || "",
    status: rawItem.status || "pending",
    aiSummary: rawItem.aiSummary,
    aiTags: rawItem.aiTags || [],
    category: rawItem.category,
    severity: rawItem.severity,
    score: rawItem.score,
    fields: rawItem.fields as Record<string, unknown> | undefined,
    createdAt: rawItem.createdAt ? new Date(rawItem.createdAt) : new Date(),
  };

  async function reRunExtractionAction() {
    "use server";
    const currentSession = await auth.api.getSession({ headers: await headers() });
    if (!currentSession?.user) {
      redirect("/");
    }

    await processItem(id, currentSession.user.id);
    revalidatePath(`/items/${id}`);
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {item.title}
            </h1>
            <Badge
              variant={
                item.status === "processed"
                  ? "default"
                  : item.status === "failed"
                  ? "destructive"
                  : "secondary"
              }
              className="text-xs capitalize font-normal"
            >
              {item.status}
            </Badge>
            <SeverityBadge severity={item.severity} />
            {typeof item.score === "number" && (
              <span className="text-xs text-muted-foreground">{domain.labels.scoreLabel}: {item.score}/100</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Created {item.createdAt.toLocaleDateString()}</span>
            </span>
            <span>·</span>
            <span>ID: {item._id}</span>
          </div>
        </div>

        {/* Re-run Extraction Server Action Form */}
        <form action={reRunExtractionAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Re-run Extraction</span>
          </Button>
        </form>
      </div>

      {/* Main Grid: Artifact Details & Structured Insights (Left) | Chat Scoped to Item (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Content + Structured Output */}
        <div className="lg:col-span-6 space-y-6">
          {/* Raw Content Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Artifact Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {item.content ? (
                <div className="rounded-md border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans max-h-[350px] overflow-y-auto">
                  {item.content}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No text content provided for this item.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Structured Result Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Extracted Structure & Metadata</span>
              </div>
            </div>

            <StructuredResult
              summary={item.aiSummary}
              tags={item.aiTags}
              isLoading={false}
              error={item.status === "failed" ? "Structured extraction previously failed." : null}
            />

            <FieldsPanel fields={item.fields} />
          </div>
        </div>

        {/* Right Column: Chat Panel Scoped to This Item */}
        <div className="lg:col-span-6">
          <Chat itemId={item._id} />
        </div>
      </div>
    </div>
  );
}



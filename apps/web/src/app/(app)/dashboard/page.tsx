import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Sparkles, Plus, ArrowRight, FileText, CheckCircle, ShieldAlert, Gauge, FolderOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { ItemModel } from "@/lib/models";
import { processItem } from "@/lib/items/process";
import { domain } from "@/lib/domain";
import { logger } from "@/lib/logger";
import { SEVERITY_LEVELS } from "@/lib/contracts";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "@/components/domain/severity-badge";

const L = domain.labels;
const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

async function createItemAction(formData: FormData) {
  "use server";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim() || "";
  if (!title) return;

  await connectMongoose();
  const created = await ItemModel.create({
    ownerId: session.user.id,
    title,
    content,
    status: "pending",
    aiTags: [],
  });
  const id = created._id.toString();

  // Extraction + embedding run before the redirect so the detail page opens fully analyzed.
  try {
    await processItem(id, session.user.id);
  } catch (err) {
    logger.warn("[dashboard] processItem threw", { error: String(err) });
  }

  revalidatePath("/dashboard");
  redirect(`/items/${id}`);
}

function CreateForm({ idPrefix }: { idPrefix: string }): React.JSX.Element {
  return (
    <form action={createItemAction} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-title`} className="text-xs font-medium text-muted-foreground">
          Title
        </label>
        <Input id={`${idPrefix}-title`} name="title" required placeholder={L.titlePlaceholder} className="text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-content`} className="text-xs font-medium text-muted-foreground">
          Content
        </label>
        <Textarea
          id={`${idPrefix}-content`}
          name="content"
          placeholder={L.contentPlaceholder}
          className="min-h-[110px] text-sm"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
          <Sparkles className="h-3.5 w-3.5" />
          {L.createCta}
        </Button>
      </div>
    </form>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; severity?: string; status?: string }>;
}): Promise<React.JSX.Element> {
  const { q = "", severity = "", status = "" } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  await connectMongoose();
  const all = await ItemModel.find({ ownerId: session.user.id }).sort({ createdAt: -1 }).limit(500).lean();

  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (i) =>
      (!severity || i.severity === severity) &&
      (!status || i.status === status) &&
      (!needle || [i.title, i.aiSummary ?? "", ...(i.aiTags ?? [])].join(" ").toLowerCase().includes(needle))
  );

  const analyzed = all.filter((i) => i.status === "processed").length;
  const highRisk = all.filter((i) => i.severity === "high" || i.severity === "critical").length;
  const scored = all.filter((i) => typeof i.score === "number");
  const avgScore = scored.length ? Math.round(scored.reduce((s, i) => s + (i.score ?? 0), 0) / scored.length) : null;
  const filtering = Boolean(q || severity || status);

  const kpis = [
    { label: `Total ${L.plural.toLowerCase()}`, value: all.length, icon: FileText },
    { label: "Analyzed", value: analyzed, icon: CheckCircle },
    { label: `High ${L.severityLabel.toLowerCase()}`, value: highRisk, icon: ShieldAlert },
    { label: `Average ${L.scoreLabel.toLowerCase()}`, value: avgScore ?? "—", icon: Gauge },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{L.plural}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{L.tagline}</p>
        </div>
        {all.length > 0 && (
          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none select-none items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              <span>New {L.singular.toLowerCase()}</span>
            </summary>
            <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-border bg-card p-4 shadow-xl sm:w-96">
              <CreateForm idPrefix="top" />
            </div>
          </details>
        )}
      </div>

      {all.length === 0 ? (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-dashed border-border bg-card/40 p-6 sm:p-10">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-3 rounded-full bg-primary/10 p-4 text-primary">
              <FolderOpen className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">No {L.plural.toLowerCase()} yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first {L.singular.toLowerCase()} below. It is analyzed as soon as you save it.
            </p>
          </div>
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add a {L.singular.toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateForm idPrefix="first" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="bg-card/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
                Search
              </label>
              <Input id="q" name="q" defaultValue={q} placeholder="Title, summary, or tag" className="w-56 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="severity" className="text-xs font-medium text-muted-foreground">
                {L.severityLabel}
              </label>
              <select id="severity" name="severity" defaultValue={severity} className={SELECT_CLASS}>
                <option value="">All</option>
                {SEVERITY_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select id="status" name="status" defaultValue={status} className={SELECT_CLASS}>
                <option value="">All</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <Button type="submit" size="sm" className="h-9 cursor-pointer">
              Apply filters
            </Button>
            {filtering && (
              <Link href="/dashboard" className="pb-2 text-xs text-muted-foreground underline underline-offset-4">
                Clear filters
              </Link>
            )}
          </form>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  {L.plural}: {rows.length} shown of {all.length}
                </caption>
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">{L.singular}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">{L.categoryLabel}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">{L.severityLabel}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">{L.scoreLabel}</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Added</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No {L.plural.toLowerCase()} match these filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((item) => {
                      const id = String(item._id);
                      return (
                        <tr key={id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="max-w-[260px] px-4 py-3">
                            <Link href={`/items/${id}`} className="block truncate font-medium hover:underline">
                              {item.title}
                            </Link>
                            {item.aiSummary && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.aiSummary}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{item.category ?? "—"}</td>
                          <td className="px-4 py-3"><SeverityBadge severity={item.severity} /></td>
                          <td className="px-4 py-3">
                            {typeof item.score === "number" ? (
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-14 rounded-full bg-muted" aria-hidden="true">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                                </div>
                                <span className="text-xs tabular-nums">{item.score}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={item.status === "processed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}
                              className="px-1.5 py-0 text-[10px] capitalize"
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/items/${id}`}
                              aria-label={`Open ${item.title}`}
                              className="inline-flex text-muted-foreground hover:text-foreground"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <CardFooter className="justify-between border-t border-border p-3 text-xs text-muted-foreground">
              <span>
                Showing {rows.length} of {all.length}
              </span>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

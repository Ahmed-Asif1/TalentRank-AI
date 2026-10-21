"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface Rubric {
  roleSummary?: string;
  mustHave?: string[];
  niceToHave?: string[];
  redFlags?: string[];
  scoringGuidelines?: string;
  interviewQuestions?: string[];
  fullCriteriaPrompt?: string;
}

export interface ActiveCriteria {
  _id: string;
  roleTitle: string;
  rawRequirements: string;
  expandedCriteria: string;
  rubric?: Rubric;
  isActive: boolean;
}

const INPUT_CLASS = "border-input bg-well text-zinc-50 placeholder:text-zinc-500";

type Tone = "emerald" | "amber" | "rose" | "blue";

const TONE_CLASS: Record<Tone, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  blue: "text-blue-400",
};

const MARKER_CLASS: Record<Tone, string> = {
  emerald: "marker:text-emerald-500/70",
  amber: "marker:text-amber-500/70",
  rose: "marker:text-rose-500/70",
  blue: "marker:text-blue-400/80",
};

function RubricList({
  title,
  items,
  tone,
  icon: Icon,
  ordered = false,
}: {
  title: string;
  items?: string[];
  tone: Tone;
  icon: LucideIcon;
  ordered?: boolean;
}): React.JSX.Element | null {
  if (!items || items.length === 0) return null;
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div className="space-y-2">
      <h4 className={`flex items-center gap-1.5 text-xs font-semibold ${TONE_CLASS[tone]}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
        <span className="font-mono text-[11px] font-normal text-zinc-500 tabular-nums">
          {items.length}
        </span>
      </h4>
      <ListTag
        className={`space-y-1.5 pl-5 text-xs leading-relaxed text-zinc-300 ${MARKER_CLASS[tone]} ${
          ordered ? "list-decimal" : "list-disc"
        }`}
      >
        {items.map((item, idx) => (
          <li key={`${idx}-${item}`}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

export function JobCriteriaModal({
  initialCriteria = null,
}: {
  initialCriteria?: ActiveCriteria | null;
}) {
  const [open, setOpen] = useState(false);
  const [activeCriteria, setActiveCriteria] = useState<ActiveCriteria | null>(initialCriteria);
  const [roleTitle, setRoleTitle] = useState(initialCriteria?.roleTitle ?? "");
  const [requirements, setRequirements] = useState(initialCriteria?.rawRequirements ?? "");
  const [generatedRubric, setGeneratedRubric] = useState<Rubric | null>(null);
  const [expandedCriteriaText, setExpandedCriteriaText] = useState(
    initialCriteria?.expandedCriteria ?? "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const router = useRouter();

  const fetchActiveCriteria = useCallback(async () => {
    try {
      const res = await fetch("/api/criteria");
      if (!res.ok) return;
      const data = await res.json();
      const active: ActiveCriteria | null = data.activeCriteria ?? null;
      if (!active) return;
      setActiveCriteria(active);
      setRoleTitle((prev) => prev || active.roleTitle);
      setRequirements((prev) => prev || active.rawRequirements || "");
      setExpandedCriteriaText((prev) => prev || active.expandedCriteria || "");
    } catch {
      // Background refresh only; the modal still works with what it has.
    }
  }, []);

  useEffect(() => {
    if (open) void fetchActiveCriteria();
  }, [open, fetchActiveCriteria]);

  /** What the rubric panel shows: the unsaved draft if there is one, else the active rubric. */
  const rubric: Rubric | null = generatedRubric ?? activeCriteria?.rubric ?? null;
  const hasUnsavedDraft = generatedRubric !== null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim() || !requirements.trim()) {
      toast.error("Enter a role title and some requirements first.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          roleTitle: roleTitle.trim(),
          requirements: requirements.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to generate criteria.");

      setGeneratedRubric(data.criteria as Rubric);
      setExpandedCriteriaText(
        data.criteria?.fullCriteriaPrompt || data.criteria?.scoringGuidelines || "",
      );
      toast.success("Rubric generated. Review it, then apply it as the active criteria.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate criteria.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveActive = async () => {
    const criteriaText = expandedCriteriaText.trim() || activeCriteria?.expandedCriteria || "";
    if (!roleTitle.trim() || !criteriaText) {
      toast.error("Generate a rubric before applying it.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          roleTitle: roleTitle.trim(),
          requirements: requirements.trim(),
          expandedCriteria: criteriaText,
          rubric: generatedRubric ?? activeCriteria?.rubric,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save criteria.");

      toast.success(`Active criteria set to ${roleTitle.trim()}.`);
      setGeneratedRubric(null);
      await fetchActiveCriteria();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save criteria.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRescoreAll = async () => {
    setIsRescoring(true);
    try {
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rescore_all" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to re-score candidates.");

      toast.success(data?.message || "Pipeline re-scored against the active criteria.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to re-score candidates.");
    } finally {
      setIsRescoring(false);
    }
  };

  const busy = isGenerating || isSaving || isRescoring;
  const mustHaveCount = activeCriteria?.rubric?.mustHave?.length ?? 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="group h-9 cursor-pointer gap-2 rounded-lg border border-white/[0.12] bg-gradient-to-b from-white/[0.07] to-white/[0.02] px-3.5 text-xs font-medium text-zinc-200 shadow-raised transition-all hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
      >
        <Target className="h-3.5 w-3.5 text-sage transition-transform group-hover:scale-105" aria-hidden="true" />
        <span>Job criteria</span>
        {mustHaveCount > 0 && (
          <span className="ml-1 rounded bg-sage/20 px-1.5 py-0.5 text-[10px] font-semibold text-sage tabular-nums">
            {mustHaveCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-xl border border-border bg-card text-white shadow-2xl sm:max-w-[720px]">
          <DialogHeader className="p-6 pb-4 border-b border-border shrink-0 space-y-1.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {hasUnsavedDraft ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-sans font-medium text-amber-300">
                  Draft, not applied
                </span>
              ) : activeCriteria ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-sans font-medium text-emerald-300">
                  Active: {activeCriteria.roleTitle}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-zinc-700/50 bg-zinc-800/40 px-2.5 py-0.5 text-[11px] font-sans font-medium text-zinc-400">
                  No active role
                </span>
              )}
            </div>
            <DialogTitle className="font-serif text-2xl font-normal tracking-tight text-white">
              Job criteria
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-400">
              Describe the role in rough notes. AI expands them into a scoring rubric that every
              candidate is evaluated against.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <form onSubmit={handleGenerate} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="role-title" className="text-xs font-medium text-zinc-300">
                Role title <span className="text-rose-400">*</span>
              </label>
              <Input
                id="role-title"
                type="text"
                placeholder="e.g. Senior React / Next.js Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                disabled={busy}
                className={`h-9 text-sm ${INPUT_CLASS}`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role-requirements" className="text-xs font-medium text-zinc-300">
                Requirements and notes <span className="text-rose-400">*</span>
              </label>
              <Textarea
                id="role-requirements"
                rows={4}
                placeholder="e.g. 3+ years with React and Next.js App Router. Scalable cloud architecture. EdTech background is a strong plus. Avoid candidates with repeated tenures under a year."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                disabled={busy}
                className={`min-h-[100px] resize-y text-sm leading-relaxed ${INPUT_CLASS}`}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={busy || !roleTitle.trim() || !requirements.trim()}
                className="cursor-pointer gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Expanding criteria...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    AI Expand Criteria
                  </>
                )}
              </Button>
            </div>
          </form>

          {rubric && (
            <div className="mt-6 space-y-5 rounded-lg border border-border bg-well p-5">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="font-serif text-lg font-normal tracking-tight text-white">
                  {hasUnsavedDraft ? "Generated rubric" : "Active rubric"}
                </h3>
                <span className="font-mono text-[11px] text-zinc-500">Scored 0 to 100</span>
              </div>

              {rubric.roleSummary && (
                <p className="text-sm leading-relaxed text-pretty text-zinc-300">{rubric.roleSummary}</p>
              )}

              <RubricList
                title="Must-have (deal-breakers)"
                items={rubric.mustHave}
                tone="emerald"
                icon={CheckCircle2}
              />
              <RubricList
                title="Nice-to-have (bonus)"
                items={rubric.niceToHave}
                tone="amber"
                icon={Sparkles}
              />
              <RubricList
                title="Red flags"
                items={rubric.redFlags}
                tone="rose"
                icon={AlertTriangle}
              />

              {rubric.scoringGuidelines && (
                <div className="rounded-md border border-border bg-card p-3.5 text-xs">
                  <h4 className="font-semibold text-zinc-200">Scoring guidelines</h4>
                  <p className="mt-1.5 leading-relaxed whitespace-pre-line text-zinc-400">
                    {rubric.scoringGuidelines}
                  </p>
                </div>
              )}

              <RubricList
                title="Screening questions"
                items={rubric.interviewQuestions}
                tone="blue"
                icon={HelpCircle}
                ordered
              />

              <details className="group rounded-md border border-border bg-card">
                <summary className="cursor-pointer list-none px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition-colors select-none hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                  Edit the evaluation prompt
                </summary>
                <div className="space-y-1.5 border-t border-border p-3.5">
                  <label htmlFor="criteria-prompt" className="sr-only">
                    Evaluation prompt
                  </label>
                  <Textarea
                    id="criteria-prompt"
                    rows={8}
                    value={expandedCriteriaText}
                    onChange={(e) => setExpandedCriteriaText(e.target.value)}
                    disabled={busy}
                    className={`min-h-[140px] resize-y font-mono text-xs leading-5 ${INPUT_CLASS}`}
                  />
                  <p className="text-[11px] text-zinc-500">
                    This text is injected into every candidate evaluation. Changes take effect when you
                    apply the criteria.
                  </p>
                </div>
              </details>

              <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRescoreAll}
                    disabled={busy || hasUnsavedDraft || !activeCriteria}
                    className="cursor-pointer gap-2 border-input bg-transparent text-xs text-zinc-200 hover:bg-secondary hover:text-white"
                  >
                    {isRescoring ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isRescoring ? "Re-scoring pipeline..." : "Re-Score All Pipeline Candidates"}
                  </Button>
                  <p className="max-w-[300px] text-[11px] leading-relaxed text-zinc-500">
                    {hasUnsavedDraft
                      ? "Apply the new criteria first, then re-score existing candidates."
                      : "Re-scores every candidate one at a time. This can take a few minutes."}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSaveActive}
                  disabled={busy}
                  className="cursor-pointer gap-2 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Apply as Active Criteria
                </Button>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="p-4 border-t border-border shrink-0 bg-well/40 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-muted-foreground hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

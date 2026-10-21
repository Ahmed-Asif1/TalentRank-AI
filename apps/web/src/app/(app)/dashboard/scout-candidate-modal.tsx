"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Briefcase,
  MapPin,
  Users,
  Compass,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/ui/foundry";
import { toast } from "sonner";
import type { ActiveCriteria } from "./job-criteria-modal";

interface ScoutedCandidate {
  id: string;
  candidateName: string;
  linkedinUrl?: string;
  headline?: string;
  score?: number;
  verdict?: string;
  yearsOfExperience?: number;
}

export function ScoutCandidateModal({
  activeCriteria,
}: {
  activeCriteria?: ActiveCriteria | null;
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "custom" | "jd">(
    activeCriteria ? "active" : "custom"
  );

  // Form states
  const [customQuery, setCustomQuery] = useState("Senior React / Next.js Engineer");
  const [location, setLocation] = useState("");
  const [seniority, setSeniority] = useState<"all" | "junior" | "mid" | "senior" | "lead">("senior");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [maxItems, setMaxItems] = useState(3);

  // Execution states
  const [isScouting, setIsScouting] = useState(false);
  const [scoutStep, setScoutStep] = useState(0);
  const [results, setResults] = useState<ScoutedCandidate[] | null>(null);

  const handleStartScout = async () => {
    setIsScouting(true);
    setScoutStep(1);
    setResults(null);

    // Step 2 transition timer
    const step2Timer = setTimeout(() => setScoutStep(2), 2200);
    // Step 3 transition timer
    const step3Timer = setTimeout(() => setScoutStep(3), 6500);

    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useActiveCriteria: tab === "active",
          query: tab === "custom" ? customQuery : undefined,
          jobDescription: tab === "jd" ? jobDescriptionText : undefined,
          location: location.trim() || undefined,
          seniority: seniority === "all" ? undefined : seniority,
          maxItems,
        }),
      });

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to scout candidates");
      }

      setResults(data.candidates || []);
      toast.success(
        `Scouted and scored ${data.count} candidates from LinkedIn!`,
        { description: "Candidates have been integrated into your pipeline." }
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Scouting failed. Please try again.");
    } finally {
      setIsScouting(false);
      setScoutStep(0);
    }
  };

  const handleDone = () => {
    setOpen(false);
    setResults(null);
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 gap-1.5 rounded-lg border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-3.5 text-xs font-medium text-zinc-200 shadow-raised transition-all hover:border-white/25 hover:bg-white/[0.10] hover:text-white"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5 text-ochre" />
        <span className="font-medium">AI Scout</span>
        <span className="rounded bg-ochre/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-ochre uppercase">
          PRO
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-zinc-950 text-white shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Sparkles className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold text-white">
                AI Talent Scout — LinkedIn Candidate Sourcing
              </DialogTitle>
              <span className="ml-auto rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                ✨ Premium Engine
              </span>
            </div>
            <DialogDescription className="text-xs text-zinc-400">
              Powered by Apify Actor & Google Gemini. Automatically discovers, scrapes, and scores active LinkedIn candidate profiles matching your role specifications.
            </DialogDescription>
          </DialogHeader>

          {/* Sourcing in Progress View */}
          {isScouting ? (
            <div className="my-6 space-y-6 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-6 text-center">
              <div className="relative mx-auto flex size-14 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
                <Loader2 className="size-8 animate-spin text-amber-400" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  Scouting LinkedIn Candidates...
                </p>
                <p className="text-xs text-zinc-400">
                  Please hold on while our automated agent queries candidate indices and performs AI evaluations.
                </p>
              </div>

              {/* Progress Stepper */}
              <div className="mx-auto max-w-md space-y-2 text-left text-xs">
                <div className={`flex items-center gap-2.5 ${scoutStep >= 1 ? "text-amber-300" : "text-zinc-600"}`}>
                  <CheckCircle2 className={`size-4 shrink-0 ${scoutStep >= 1 ? "text-amber-400" : "text-zinc-700"}`} />
                  <span>1. Parsing job requirements & mapping LinkedIn search parameters</span>
                </div>
                <div className={`flex items-center gap-2.5 ${scoutStep >= 2 ? "text-amber-300" : "text-zinc-600"}`}>
                  <CheckCircle2 className={`size-4 shrink-0 ${scoutStep >= 2 ? "text-amber-400" : "text-zinc-700"}`} />
                  <span>2. Scanning LinkedIn profile index via Apify Actor (no cookies required)</span>
                </div>
                <div className={`flex items-center gap-2.5 ${scoutStep >= 3 ? "text-amber-300" : "text-zinc-600"}`}>
                  <CheckCircle2 className={`size-4 shrink-0 ${scoutStep >= 3 ? "text-amber-400" : "text-zinc-700"}`} />
                  <span>3. Evaluating candidate qualifications, computing fit scores & generating dossiers</span>
                </div>
              </div>
            </div>
          ) : results ? (
            /* Results View */
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">
                    Found & Ranked {results.length} Candidates
                  </p>
                </div>
                <span className="text-xs text-zinc-400">Added to pipeline</span>
              </div>

              <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                {results.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-900/60 p-3.5 transition-colors hover:border-amber-500/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{c.candidateName}</span>
                        {c.linkedinUrl && (
                          <a
                            href={c.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 hover:underline"
                          >
                            LinkedIn <ExternalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {c.headline || "Software Professional"}
                      </p>
                      {c.verdict && (
                        <p className="mt-1 text-[11px] text-zinc-300 italic">
                          Verdict: {c.verdict}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Match Score</div>
                        <div className="text-base font-bold text-emerald-400 tabular-nums">
                          {c.score ?? "—"}/100
                        </div>
                      </div>
                      <ScoreRing score={c.score} size={42} stroke={3.5} />
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={handleDone}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  View on Pipeline Leaderboard →
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Configure & Launch Form */
            <div className="space-y-4 py-2">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 gap-1 rounded-md border border-white/10 bg-zinc-900/80 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTab("active")}
                  disabled={!activeCriteria}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
                    tab === "active"
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
                  }`}
                >
                  <Briefcase className="size-3.5" />
                  <span>Active Role</span>
                  {!activeCriteria && <span className="text-[10px] opacity-60">(None)</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("custom")}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
                    tab === "custom"
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Compass className="size-3.5" />
                  <span>Custom Query</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("jd")}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 font-medium transition-colors ${
                    tab === "jd"
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Job Description</span>
                </button>
              </div>

              {tab === "active" && activeCriteria && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Target Role
                    </span>
                    <span className="text-[11px] text-zinc-400">Active Rubric</span>
                  </div>
                  <p className="text-sm font-medium text-white">{activeCriteria.roleTitle}</p>
                  {activeCriteria.rawRequirements && (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {activeCriteria.rawRequirements}
                    </p>
                  )}
                </div>
              )}

              {tab === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Target Role or Skill Query
                  </label>
                  <Input
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    placeholder="e.g. Senior React / Next.js Engineer, Data Engineer, Product Manager"
                    className="border-white/10 bg-zinc-900 text-sm text-white placeholder:text-zinc-500"
                  />
                </div>
              )}

              {tab === "jd" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Paste Job Description
                  </label>
                  <Textarea
                    value={jobDescriptionText}
                    onChange={(e) => setJobDescriptionText(e.target.value)}
                    placeholder="Paste the role requirements, responsibilities, and target qualifications..."
                    rows={4}
                    className="border-white/10 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                  />
                </div>
              )}

              {/* Filters row: Location & Seniority */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <MapPin className="size-3 text-zinc-400" />
                    <span>Location (Optional)</span>
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote, San Francisco, London, Pakistan"
                    className="border-white/10 bg-zinc-900 text-xs text-white placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Users className="size-3 text-zinc-400" />
                    <span>Seniority Level</span>
                  </label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value as any)}
                    className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="all">Any Seniority</option>
                    <option value="junior">Junior (1–2 yrs)</option>
                    <option value="mid">Mid-Level (3–5 yrs)</option>
                    <option value="senior">Senior (6–10 yrs)</option>
                    <option value="lead">Lead / Principal (10+ yrs)</option>
                  </select>
                </div>
              </div>

              {/* Candidate Quantity Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Profiles to Discover
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 3, label: "3 Profiles", speed: "⚡ ~10s (Fastest)" },
                    { count: 5, label: "5 Profiles", speed: "✨ ~18s (Recommended)" },
                    { count: 10, label: "10 Profiles", speed: "🔍 ~30s (Deep Scout)" },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => setMaxItems(opt.count)}
                      className={`rounded-md border p-2 text-left transition-all ${
                        maxItems === opt.count
                          ? "border-amber-500/60 bg-amber-500/15 text-white"
                          : "border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs font-semibold text-white">{opt.label}</div>
                      <div className="text-[10px] text-amber-300/80">{opt.speed}</div>
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartScout}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-zinc-950 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-orange-500/20"
                >
                  <Sparkles className="size-3.5" />
                  <span>Launch Talent Scout</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

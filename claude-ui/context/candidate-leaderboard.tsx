"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  MoreVertical,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { clampScore, formatYears, getScoreStyle, getStatusStyle } from "@/lib/candidate-ui";
import { FitBadge, Tag } from "@/components/ui/foundry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type LeaderboardCandidate = {
  id: string;
  title: string;
  headline?: string;
  summary?: string;
  score?: number;
  status: string;
  category?: string;
  aiTags?: string[];
  yearsOfExperience?: number;
};

type FitFilter = "all" | "strong" | "potential" | "unqualified";

const FIT_LABELS = new Set(["Strong Fit", "Potential", "Unqualified"]);

const FILTERS: {
  key: FitFilter;
  label: string;
  dot?: string;
  match: (score: number) => boolean;
}[] = [
  { key: "all", label: "All", match: () => true },
  { key: "strong", label: "Strong Fit", dot: "bg-emerald-400", match: (s) => s >= 80 },
  { key: "potential", label: "Potential", dot: "bg-amber-400", match: (s) => s >= 60 && s < 80 },
  { key: "unqualified", label: "Unqualified", dot: "bg-rose-400", match: (s) => s < 60 },
];

type MenuState = {
  x: number;
  y: number;
  candidate: LeaderboardCandidate;
  source: "button" | "context";
};

const MENU_WIDTH = 192;
const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-default disabled:opacity-40";

function getInitials(name: string): string {
  const clean = name.replace(/\s+-\s+LinkedIn Profile$/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || "C";
}

function Rank({ rank }: { rank: number }): React.JSX.Element {
  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center font-mono text-xs tabular-nums ${
        rank <= 3 ? "font-semibold text-zinc-100" : "text-zinc-500"
      }`}
    >
      {rank}
    </span>
  );
}

function MiniRing({ score }: { score?: number }): React.JSX.Element {
  const style = getScoreStyle(score);
  return (
    <svg
      className={`size-4 shrink-0 -rotate-90 ${style.text}`}
      viewBox="0 0 36 36"
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4" className="stroke-white/10" />
      {typeof score === "number" && (
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${clampScore(score)} 100`}
        />
      )}
    </svg>
  );
}

export function CandidateLeaderboard({
  candidates,
}: {
  candidates: LeaderboardCandidate[];
}): React.JSX.Element {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [rescoringIds, setRescoringIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<LeaderboardCandidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const close = () => setMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const ranked = [...candidates].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const rankOf = new Map(ranked.map((c, i) => [c.id, i + 1]));
  const activeFilter = FILTERS.find((f) => f.key === fitFilter) ?? FILTERS[0]!;
  const countFor = (match: (score: number) => boolean) =>
    ranked.filter((c) => match(c.score ?? 0)).length;
  const displayed = ranked.filter((c) => activeFilter.match(c.score ?? 0));

  const handleReevaluate = async (candidate: LeaderboardCandidate) => {
    setMenu(null);
    setRescoringIds((prev) => new Set(prev).add(candidate.id));
    toast.info(`Re-evaluating ${candidate.title}...`);

    try {
      const res = await fetch("/api/criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rescore_item", itemId: candidate.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to re-evaluate candidate.");

      toast.success(`${candidate.title} re-evaluated.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to re-evaluate.");
    } finally {
      setRescoringIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete candidate.");

      toast.success("Candidate deleted.");
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete candidate.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (ranked.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-4 py-12 text-center">
        <p className="text-sm font-medium text-white">No candidates yet</p>
        <p className="mt-1 text-[13px] text-zinc-500">
          Import a profile or resume to score your first candidate.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Filter by fit"
          className="inline-flex items-center gap-0.5 rounded-md border border-white/[0.07] bg-white/[0.03] p-0.5"
        >
          {FILTERS.map((f) => {
            const active = fitFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFitFilter(f.key)}
                className={`inline-flex h-6 cursor-pointer items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                  active ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {f.dot && <span className={`size-1.5 rounded-full ${f.dot}`} aria-hidden="true" />}
                {f.label}
                <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                  {f.key === "all" ? ranked.length : countFor(f.match)}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs text-zinc-500 tabular-nums">
          Showing <span className="font-medium text-zinc-200">{displayed.length}</span> of{" "}
          {ranked.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-card shadow-raised">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-medium text-zinc-500">
                <th scope="col" className="w-14 px-3 py-2 font-medium">
                  Rank
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Candidate
                </th>
                <th scope="col" className="w-28 px-2 py-2 font-medium">
                  Match
                </th>
                <th scope="col" className="w-24 px-2 py-2 font-medium">
                  Experience
                </th>
                <th scope="col" className="w-32 px-2 py-2 font-medium">
                  Fit
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Signals
                </th>
                <th scope="col" className="w-28 px-3 py-2 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((candidate, index) => {
                const score = candidate.score;
                const hasScore = typeof score === "number";
                const isRescoring = rescoringIds.has(candidate.id);
                const status = getStatusStyle(candidate.status);
                const tags = candidate.aiTags ?? [];
                const summary =
                  candidate.summary ||
                  candidate.headline ||
                  (candidate.category && !FIT_LABELS.has(candidate.category)
                    ? candidate.category
                    : "");
                const busy = isRescoring || candidate.status === "pending";

                return (
                  <tr
                    key={candidate.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenu({
                        x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8)),
                        y: Math.max(8, Math.min(e.clientY, window.innerHeight - 140)),
                        candidate,
                        source: "context",
                      });
                    }}
                    style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                    className="tr-fade border-b border-white/5 transition-colors select-none last:border-b-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-3 py-2 align-middle">
                      <Rank rank={rankOf.get(candidate.id) ?? index + 1} />
                    </td>

                    <td className="max-w-[360px] px-2 py-2 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04] text-[11px] font-medium text-zinc-400">
                          {getInitials(candidate.title)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/items/${candidate.id}`}
                              className="truncate text-[13px] font-medium text-zinc-100 transition-colors hover:text-white hover:underline hover:underline-offset-4 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            >
                              {candidate.title}
                            </Link>
                            {busy ? (
                              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-zinc-400">
                                <Loader2
                                  className="size-3 animate-spin motion-reduce:animate-none"
                                  aria-hidden="true"
                                />
                                {isRescoring ? "Re-evaluating" : "Evaluating"}
                              </span>
                            ) : candidate.status !== "processed" ? (
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${status.text}`}
                              >
                                <span className={`size-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
                                {status.label}
                              </span>
                            ) : null}
                          </div>
                          {summary && (
                            <p className="line-clamp-1 text-xs text-zinc-500">{summary}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <MiniRing score={score} />
                        <span className="font-mono text-[13px] font-medium text-zinc-100 tabular-nums">
                          {isRescoring ? "…" : hasScore ? `${Math.round(score)}%` : "--"}
                        </span>
                      </div>
                    </td>

                    <td className="px-2 py-2 align-middle">
                      {candidate.yearsOfExperience === undefined ? (
                        <span className="text-xs text-zinc-600">--</span>
                      ) : (
                        <span className="font-mono text-[13px] text-zinc-200 tabular-nums">
                          {formatYears(candidate.yearsOfExperience)}
                          <span className="ml-1 text-[11px] text-zinc-500">yrs</span>
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-2 align-middle">
                      <FitBadge score={score} />
                    </td>

                    <td className="px-2 py-2 align-middle">
                      {tags.length > 0 ? (
                        <span className="flex flex-wrap items-center gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                          {tags.length > 3 && (
                            <span className="px-0.5 font-mono text-[11px] text-zinc-500 tabular-nums">
                              +{tags.length - 3}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">--</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/items/${candidate.id}`}
                          aria-label={`Inspect profile: ${candidate.title}`}
                          className="group inline-flex h-7 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          Inspect
                          <ArrowRight
                            className="size-3 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-200 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                            aria-hidden="true"
                          />
                        </Link>

                        <button
                          type="button"
                          aria-label={`More actions for ${candidate.title}`}
                          aria-haspopup="menu"
                          aria-expanded={menu?.source === "button" && menu.candidate.id === candidate.id}
                          title="More options (or right-click row)"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (menu?.source === "button" && menu.candidate.id === candidate.id) {
                              setMenu(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenu({
                              x: Math.max(8, rect.right - MENU_WIDTH),
                              y: rect.bottom + 4,
                              candidate,
                              source: "button",
                            });
                          }}
                          className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                            menu?.source === "button" && menu.candidate.id === candidate.id
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          <MoreVertical className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {mounted &&
        menu &&
        createPortal(
          <div
            role="menu"
            style={{ top: menu.y, left: menu.x }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-48 rounded-lg border border-white/[0.08] bg-zinc-900 p-1 text-left shadow-[0_12px_32px_rgba(0,0,0,0.6)] animate-in fade-in-0 zoom-in-95"
          >
            {menu.source === "context" && (
              <p className="mb-1 truncate border-b border-white/5 px-2 py-1.5 text-xs font-medium text-white">
                {menu.candidate.title}
              </p>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleReevaluate(menu.candidate)}
              disabled={rescoringIds.has(menu.candidate.id)}
              className={MENU_ITEM}
            >
              <RotateCcw className="size-3.5 text-zinc-500" aria-hidden="true" />
              Re-evaluate criteria
            </button>
            <Link
              href={`/items/${menu.candidate.id}`}
              role="menuitem"
              onClick={() => setMenu(null)}
              className={MENU_ITEM}
            >
              <ExternalLink className="size-3.5 text-zinc-500" aria-hidden="true" />
              Inspect dossier
            </Link>
            <div className="my-1 border-t border-white/5" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const target = menu.candidate;
                setMenu(null);
                setDeleteCandidate(target);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete candidate
            </button>
          </div>,
          document.body,
        )}

      <Dialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <DialogContent className="max-w-md rounded-lg border border-white/[0.08] bg-card p-5 text-white shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04] text-rose-400">
              <Trash2 className="size-4" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-white">
              Delete candidate?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-zinc-400">
              <span className="font-medium text-zinc-200">{deleteCandidate?.title}</span> and all
              match scores, extracted evidence, screening questions, and evaluation notes will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteCandidate(null)}
              disabled={isDeleting}
              className="h-8 cursor-pointer text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="h-8 cursor-pointer gap-1.5 bg-rose-600 px-3 text-xs font-medium text-white hover:bg-rose-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

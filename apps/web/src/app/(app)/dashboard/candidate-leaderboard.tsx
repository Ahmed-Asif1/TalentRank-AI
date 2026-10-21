"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Filter,
  Loader2,
  MoreVertical,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
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
  sourceUrl?: string;
};

type FitFilter = "all" | "strong" | "potential" | "unqualified";
export type SortOption =
  | "score_desc"
  | "score_asc"
  | "exp_desc"
  | "exp_asc"
  | "name_asc";

const FIT_LABELS = new Set(["Strong Fit", "Potential", "Unqualified"]);

const FILTERS: {
  key: FitFilter;
  label: string;
  dot?: string;
  match: (score: number) => boolean;
}[] = [
  { key: "all", label: "All", match: () => true },
  { key: "strong", label: "Strong Fit", dot: "bg-sage", match: (s) => s >= 80 },
  { key: "potential", label: "Potential", dot: "bg-ochre", match: (s) => s >= 60 && s < 80 },
  { key: "unqualified", label: "Unqualified", dot: "bg-terracotta", match: (s) => s < 60 },
];

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type MenuState = {
  x: number;
  y?: number;
  bottom?: number;
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

function LinkedInIcon({ className = "size-3" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
    </svg>
  );
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
  initialQuery = "",
  initialStatus = "all",
}: {
  candidates: LeaderboardCandidate[];
  initialQuery?: string;
  initialStatus?: string;
}): React.JSX.Element {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all");
  const [fitFilter, setFitFilter] = useState<FitFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("score_desc");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [rescoringIds, setRescoringIds] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<LeaderboardCandidate | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-clamp dropdown menu inside visible viewport boundaries so it is never cut off
  useIsomorphicLayoutEffect(() => {
    if (menu && menuRef.current) {
      const el = menuRef.current;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (rect.right > viewportWidth - 8) {
        const overflow = rect.right - (viewportWidth - 8);
        const currentLeft = parseFloat(el.style.left || "0");
        el.style.left = `${Math.max(8, currentLeft - overflow)}px`;
      }

      if (menu.y !== undefined && rect.bottom > viewportHeight - 8) {
        const overflow = rect.bottom - (viewportHeight - 8);
        const currentTop = parseFloat(el.style.top || "0");
        el.style.top = `${Math.max(8, currentTop - overflow)}px`;
      }

      if (menu.bottom !== undefined && rect.top < 8) {
        const overflow = 8 - rect.top;
        const currentBottom = parseFloat(el.style.bottom || "0");
        el.style.bottom = `${Math.max(8, currentBottom - overflow)}px`;
      }
    }
  }, [menu]);

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

  // Canonical absolute pipeline rank (by score descending)
  const canonicalRanked = useMemo(
    () => candidates.filter((c) => !deletedIds.has(c.id)).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    [candidates, deletedIds],
  );
  const rankOf = useMemo(
    () => new Map(canonicalRanked.map((c, i) => [c.id, i + 1])),
    [canonicalRanked],
  );

  const needle = searchQuery.trim().toLowerCase();

  // Candidates matching search & status filter
  const matchingSearchAndStatus = useMemo(() => {
    return candidates.filter((c) => {
      if (deletedIds.has(c.id)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (needle) {
        const titleMatch = c.title.toLowerCase().includes(needle);
        const summaryMatch = c.summary?.toLowerCase().includes(needle);
        const headlineMatch = c.headline?.toLowerCase().includes(needle);
        const tagMatch = c.aiTags?.some((t) => t.toLowerCase().includes(needle));
        const categoryMatch = c.category?.toLowerCase().includes(needle);
        if (!titleMatch && !summaryMatch && !headlineMatch && !tagMatch && !categoryMatch) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, statusFilter, needle, deletedIds]);

  const activeFitFilter = FILTERS.find((f) => f.key === fitFilter) ?? FILTERS[0]!;

  // Candidates after fit filter
  const filtered = useMemo(() => {
    return matchingSearchAndStatus.filter((c) => activeFitFilter.match(c.score ?? 0));
  }, [matchingSearchAndStatus, activeFitFilter]);

  // Candidates sorted according to sortBy
  const displayed = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "score_desc") {
        return (b.score ?? -1) - (a.score ?? -1);
      }
      if (sortBy === "score_asc") {
        return (a.score ?? -1) - (b.score ?? -1);
      }
      if (sortBy === "exp_desc") {
        const expA = a.yearsOfExperience ?? -1;
        const expB = b.yearsOfExperience ?? -1;
        if (expB !== expA) return expB - expA;
        return (b.score ?? -1) - (a.score ?? -1);
      }
      if (sortBy === "exp_asc") {
        const expA = a.yearsOfExperience ?? 999;
        const expB = b.yearsOfExperience ?? 999;
        if (expA !== expB) return expA - expB;
        return (b.score ?? -1) - (a.score ?? -1);
      }
      if (sortBy === "name_asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filtered, sortBy]);

  const countForFit = (match: (score: number) => boolean) =>
    matchingSearchAndStatus.filter((c) => match(c.score ?? 0)).length;

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    fitFilter !== "all" ||
    sortBy !== "score_desc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFitFilter("all");
    setSortBy("score_desc");
  };

  const toggleScoreSort = () => {
    setSortBy((prev) => (prev === "score_desc" ? "score_asc" : "score_desc"));
  };

  const toggleExpSort = () => {
    setSortBy((prev) => (prev === "exp_desc" ? "exp_asc" : "exp_desc"));
  };

  const toggleNameSort = () => {
    setSortBy((prev) => (prev === "name_asc" ? "score_desc" : "name_asc"));
  };

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
    const targetId = deleteCandidate.id;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete candidate.");

      setDeletedIds((prev) => new Set([...prev, targetId]));
      toast.success("Candidate profile deleted.");
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete candidate.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
        <p className="text-sm font-medium text-white">No candidates yet</p>
        <p className="mt-1 text-[13px] text-zinc-500">
          Import a profile or resume to score your first candidate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls Bar: Dynamic Search, Status Filter, Sort By */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Dynamic As-You-Type Search */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, skills (e.g. React, AWS), tags, summary..."
              className="h-8 w-full rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-7 text-xs text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-white/20 focus:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition-colors hover:text-white"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by evaluation status"
              className="h-8 cursor-pointer appearance-none rounded-md border border-white/10 bg-white/[0.04] pl-2.5 pr-7 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="all" className="bg-zinc-900 text-zinc-200">
                All statuses
              </option>
              <option value="processed" className="bg-zinc-900 text-zinc-200">
                Evaluated
              </option>
              <option value="pending" className="bg-zinc-900 text-zinc-200">
                Pending
              </option>
              <option value="failed" className="bg-zinc-900 text-zinc-200">
                Failed
              </option>
            </select>
            <Filter
              className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort candidates by"
              className="h-8 cursor-pointer appearance-none rounded-md border border-white/10 bg-white/[0.04] pl-2.5 pr-7 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <option value="score_desc" className="bg-zinc-900 text-zinc-200">
                Score: High → Low
              </option>
              <option value="score_asc" className="bg-zinc-900 text-zinc-200">
                Score: Low → High
              </option>
              <option value="exp_desc" className="bg-zinc-900 text-zinc-200">
                Experience: Most → Least
              </option>
              <option value="exp_asc" className="bg-zinc-900 text-zinc-200">
                Experience: Least → Most
              </option>
              <option value="name_asc" className="bg-zinc-900 text-zinc-200">
                Name: A → Z
              </option>
            </select>
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Sub-bar: Fit Tabs & Live Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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
                  {f.key === "all" ? matchingSearchAndStatus.length : countForFit(f.match)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="cursor-pointer text-xs font-medium text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-200 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              Reset filters
            </button>
          )}
          <span className="text-xs text-zinc-500 tabular-nums">
            Showing <span className="font-medium text-zinc-200">{displayed.length}</span> of{" "}
            {candidates.length}
          </span>
        </div>
      </div>

      {/* Table or Empty Results */}
      {displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-card/40 px-6 py-12 text-center">
          <Search className="mx-auto size-6 text-zinc-600" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-white">No candidates match these filters</p>
          <p className="mt-1 text-xs text-zinc-500">
            {searchQuery
              ? `No candidates match "${searchQuery}". Try a different skill tag or keyword.`
              : "Try adjusting your status filter or fit threshold."}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-3 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <RotateCcw className="size-3 text-zinc-400" aria-hidden="true" />
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-card shadow-raised">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.04] text-[11px] font-medium text-zinc-500">
                  <th scope="col" className="w-14 px-4 py-3 font-medium">
                    Rank
                  </th>
                  <th
                    scope="col"
                    onClick={toggleNameSort}
                    className="cursor-pointer px-3 py-3 font-medium transition-colors hover:text-white select-none"
                    title="Click to sort by candidate name"
                  >
                    <div className="flex items-center gap-1">
                      <span>Candidate</span>
                      {sortBy === "name_asc" ? (
                        <ArrowUp className="size-3 text-white" aria-hidden="true" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-600 opacity-60" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={toggleScoreSort}
                    className="w-28 cursor-pointer px-3 py-3 font-medium transition-colors hover:text-white select-none"
                    title="Click to toggle Match Score sort (High ↔ Low)"
                  >
                    <div className="flex items-center gap-1">
                      <span>Match</span>
                      {sortBy === "score_desc" ? (
                        <ArrowDown className="size-3 text-zinc-200" aria-hidden="true" />
                      ) : sortBy === "score_asc" ? (
                        <ArrowUp className="size-3 text-zinc-200" aria-hidden="true" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-600 opacity-60" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={toggleExpSort}
                    className="w-28 cursor-pointer px-3 py-3 font-medium transition-colors hover:text-white select-none"
                    title="Click to toggle Experience sort (Most ↔ Least)"
                  >
                    <div className="flex items-center gap-1">
                      <span>Experience</span>
                      {sortBy === "exp_desc" ? (
                        <ArrowDown className="size-3 text-zinc-200" aria-hidden="true" />
                      ) : sortBy === "exp_asc" ? (
                        <ArrowUp className="size-3 text-zinc-200" aria-hidden="true" />
                      ) : (
                        <ArrowUpDown className="size-3 text-zinc-600 opacity-60" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="w-32 px-3 py-3 font-medium">
                    Fit
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Signals
                  </th>
                  <th scope="col" className="w-28 px-4 py-3.5 text-right font-medium">
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
                        const MENU_HEIGHT = 185;
                        const spaceBelow = window.innerHeight - e.clientY;
                        const spaceAbove = e.clientY;
                        const openUpward = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;
                        setMenu({
                          x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8)),
                          ...(openUpward
                            ? { bottom: Math.max(8, window.innerHeight - e.clientY) }
                            : { y: Math.max(8, e.clientY) }),
                          candidate,
                          source: "context",
                        });
                      }}
                      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
                      className="tr-fade border-b border-white/[0.04] transition-colors select-none last:border-b-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <Rank rank={rankOf.get(candidate.id) ?? index + 1} />
                      </td>

                      <td className="max-w-[360px] px-3 py-3.5 align-middle">
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
                              {candidate.sourceUrl && (
                                <a
                                  href={candidate.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex shrink-0 items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-steel transition-colors hover:bg-white/[0.09] hover:text-white"
                                  title={`Open ${candidate.title}'s LinkedIn profile in a new tab`}
                                >
                                  <LinkedInIcon className="size-2.5 text-steel" />
                                  <span>LinkedIn</span>
                                  <ExternalLink className="size-2.5 opacity-70" aria-hidden="true" />
                                </a>
                              )}
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

                      <td className="px-3 py-3.5 align-middle">
                        <div className="flex items-center gap-2">
                          <MiniRing score={score} />
                          <span className="font-mono text-[13px] font-medium text-zinc-100 tabular-nums">
                            {isRescoring ? "…" : hasScore ? `${Math.round(score)}%` : "--"}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 align-middle">
                        {candidate.yearsOfExperience === undefined ? (
                          <span className="text-xs text-zinc-600">--</span>
                        ) : (
                          <span className="font-mono text-[13px] text-zinc-200 tabular-nums">
                            {formatYears(candidate.yearsOfExperience)}
                            <span className="ml-1 text-[11px] text-zinc-500">yrs</span>
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 align-middle">
                        <FitBadge score={score} />
                      </td>

                      <td className="px-3 py-3.5 align-middle">
                        {tags.length > 0 ? (
                          <span className="flex flex-wrap items-center gap-1">
                            {tags.slice(0, 3).map((tag) => (
                              <Tag
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className="cursor-pointer transition-colors hover:border-white/20 hover:text-white"
                              >
                                {tag}
                              </Tag>
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

                      <td className="px-4 py-3.5 text-right align-middle whitespace-nowrap">
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
                              const MENU_HEIGHT = 185;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;
                              const openUpward = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;

                              setMenu({
                                x: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
                                ...(openUpward
                                  ? { bottom: Math.max(8, window.innerHeight - rect.top + 4) }
                                  : { y: Math.max(8, rect.bottom + 4) }),
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
      )}

      {mounted &&
        menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              left: menu.x,
              ...(menu.y !== undefined ? { top: menu.y } : { bottom: menu.bottom }),
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-48 rounded-xl border border-white/[0.08] bg-popover p-1 text-left shadow-overlay animate-in fade-in-0 zoom-in-95"
          >
            {menu.source === "context" && (
              <p className="mb-1 truncate border-b border-white/[0.04] px-2 py-1.5 text-xs font-medium text-white">
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
            {menu.candidate.sourceUrl && (
              <a
                href={menu.candidate.sourceUrl}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                onClick={() => setMenu(null)}
                className={MENU_ITEM}
              >
                <LinkedInIcon className="size-3.5 text-steel" />
                View LinkedIn profile
              </a>
            )}
            <Link
              href={`/items/${menu.candidate.id}`}
              role="menuitem"
              onClick={() => setMenu(null)}
              className={MENU_ITEM}
            >
              <ExternalLink className="size-3.5 text-zinc-500" aria-hidden="true" />
              Inspect dossier
            </Link>
            <Link
              href={`/compare?a=${menu.candidate.id}`}
              role="menuitem"
              onClick={() => setMenu(null)}
              className={MENU_ITEM}
            >
              <ArrowLeftRight className="size-3.5 text-zinc-500" aria-hidden="true" />
              Compare candidate
            </Link>
            <div className="my-1 border-t border-white/[0.04]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const target = menu.candidate;
                setMenu(null);
                setDeleteCandidate(target);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-terracotta transition-colors hover:bg-terracotta/10 hover:text-terracotta"
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
        <DialogContent className="max-w-md rounded-xl border border-white/[0.08] bg-card p-7 text-white shadow-overlay">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04] text-terracotta">
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
              className="h-8 cursor-pointer gap-1.5 px-3 text-xs font-medium"
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
    </div>
  );
}

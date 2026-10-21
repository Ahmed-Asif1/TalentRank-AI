"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import {
  FitBadge,
  MeterBar,
  ScoreRing,
  StatusBadge,
} from "@/components/ui/foundry";
import {
  candidateDisplayName,
  clampScore,
  extractHeadline,
  formatYears,
  pad2,
} from "@/lib/candidate-ui";
import type { ParsedProfile } from "@/lib/candidate-profile";

function LinkedInIcon({ className = "size-3.5" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
    </svg>
  );
}

export interface CandidateComparisonData {
  id: string;
  name: string;
  headline?: string;
  linkedInUrl?: string;
  score?: number;
  status: string;
  verdict?: string;
  summary?: string;
  yearsOfExperience?: number;
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  competencies: Array<{ label: string; score: number }>;
  profile: ParsedProfile;
}

export function CompareClientView({
  candidates,
  initialIdA,
  initialIdB,
  activeRoleTitle,
}: {
  candidates: CandidateComparisonData[];
  initialIdA?: string;
  initialIdB?: string;
  activeRoleTitle?: string;
}): React.JSX.Element {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [idA, setIdA] = useState<string>(
    initialIdA && candidates.some((c) => c.id === initialIdA)
      ? initialIdA
      : candidates[0]?.id ?? "",
  );

  const [idB, setIdB] = useState<string>(() => {
    if (initialIdB && candidates.some((c) => c.id === initialIdB)) {
      return initialIdB;
    }
    const second = candidates.find((c) => c.id !== (initialIdA ?? candidates[0]?.id));
    return second?.id ?? candidates[1]?.id ?? candidates[0]?.id ?? "";
  });

  const candA = candidates.find((c) => c.id === idA) ?? candidates[0];
  const candB = candidates.find((c) => c.id === idB) ?? candidates[1] ?? candidates[0];

  const handleSelectA = (newId: string) => {
    setIdA(newId);
    startTransition(() => {
      router.replace(`/compare?a=${newId}&b=${idB}`, { scroll: false });
    });
  };

  const handleSelectB = (newId: string) => {
    setIdB(newId);
    startTransition(() => {
      router.replace(`/compare?a=${idA}&b=${newId}`, { scroll: false });
    });
  };

  const handleSwap = () => {
    const nextA = idB;
    const nextB = idA;
    setIdA(nextA);
    setIdB(nextB);
    startTransition(() => {
      router.replace(`/compare?a=${nextA}&b=${nextB}`, { scroll: false });
    });
  };

  if (!candA || !candB || candidates.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400">
          <ArrowLeftRight className="size-6 text-zinc-400" />
        </div>
        <h2 className="font-serif text-2xl font-normal text-zinc-100">No candidates available</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Import candidates to your pipeline first to compare their profiles side-by-side.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-4 text-xs font-medium text-zinc-950 transition hover:bg-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Pipeline</span>
        </Link>
      </div>
    );
  }

  // Calculate score delta
  const scoreA = candA.score;
  const scoreB = candB.score;
  const hasBothScores = typeof scoreA === "number" && typeof scoreB === "number";
  const scoreDelta = hasBothScores ? Math.round(scoreA - scoreB) : null;

  // Gather unique competency labels from both candidates
  const competencyLabels = Array.from(
    new Set([
      ...candA.competencies.map((c) => c.label),
      ...candB.competencies.map((c) => c.label),
    ]),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-20">
      {/* Top Header */}
      <header className="tr-rise space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-md text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to pipeline</span>
          </Link>

          {activeRoleTitle && (
            <div className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400">
              <span className="size-1.5 rounded-full bg-sage" />
              <span>Role: <strong className="text-zinc-200">{activeRoleTitle}</strong></span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-50 sm:text-4xl">
              Candidate Comparison
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Side-by-side evaluation of qualifications, match criteria, and potential risk signals.
            </p>
          </div>
        </div>
      </header>

      {/* Candidate Selectors Bar */}
      <section
        aria-label="Candidate Selectors"
        className="sticky top-16 z-30 rounded-xl border border-white/[0.08] bg-card/90 p-4 shadow-overlay backdrop-blur-md"
      >
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Candidate A Selector */}
          <div className="flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-xs font-medium text-zinc-300">
              A
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                aria-label="Select Candidate A"
                value={candA.id}
                onChange={(e) => handleSelectA(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-3.5 pr-9 text-xs font-medium text-zinc-100 transition-colors hover:border-white/20 focus:border-white/30 focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={`a-${c.id}`} value={c.id} className="bg-zinc-900 text-zinc-200">
                    {c.name} {typeof c.score === "number" ? `(${Math.round(c.score)}%)` : ""} {c.yearsOfExperience !== undefined ? `· ${c.yearsOfExperience} yrs` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            </div>
            <Link
              href={`/items/${candA.id}`}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
              title="Open Candidate A Dossier"
            >
              <span>Dossier</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap candidates"
              aria-label="Swap candidates"
              className="group flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeftRight className="size-3.5 transition-transform group-hover:rotate-180" />
            </button>
          </div>

          {/* Candidate B Selector */}
          <div className="flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-xs font-medium text-zinc-300">
              B
            </span>
            <div className="relative min-w-0 flex-1">
              <select
                aria-label="Select Candidate B"
                value={candB.id}
                onChange={(e) => handleSelectB(e.target.value)}
                className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-3.5 pr-9 text-xs font-medium text-zinc-100 transition-colors hover:border-white/20 focus:border-white/30 focus:outline-none"
              >
                {candidates.map((c) => (
                  <option key={`b-${c.id}`} value={c.id} className="bg-zinc-900 text-zinc-200">
                    {c.name} {typeof c.score === "number" ? `(${Math.round(c.score)}%)` : ""} {c.yearsOfExperience !== undefined ? `· ${c.yearsOfExperience} yrs` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            </div>
            <Link
              href={`/items/${candB.id}`}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
              title="Open Candidate B Dossier"
            >
              <span>Dossier</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* High-Level Delta & Metrics Comparison */}
      <section
        aria-label="Score & Match Overview"
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised md:p-8"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
          {/* Candidate A Card */}
          <div className="flex flex-col items-center space-y-4 text-center md:items-start md:text-left">
            <div className="flex items-center gap-4">
              <ScoreRing score={scoreA} size={84} stroke={6} />
              <div>
                <h3 className="font-serif text-xl font-normal text-zinc-100">{candA.name}</h3>
                {candA.headline && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{candA.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FitBadge score={scoreA} className="text-[11px]" />
                  <StatusBadge status={candA.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>Experience: <strong className="text-zinc-200">{candA.yearsOfExperience !== undefined ? `${candA.yearsOfExperience} yrs` : "--"}</strong></span>
              {candA.linkedInUrl && (
                <a
                  href={candA.linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-steel hover:underline"
                >
                  <LinkedInIcon className="size-3" />
                  <span>Profile</span>
                </a>
              )}
            </div>
          </div>

          {/* Delta Comparison Column in Center */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.02] p-5 text-center">
            <p className="text-[11px] font-medium tracking-wide uppercase text-zinc-500">
              Match Delta
            </p>
            {hasBothScores ? (
              <div className="mt-2 space-y-1">
                {scoreDelta === 0 ? (
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-300">
                    <UserCheck className="size-4 text-zinc-400" />
                    <span>Equal match scores ({Math.round(scoreA!)}%)</span>
                  </div>
                ) : scoreDelta! > 0 ? (
                  <>
                    <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-sage">
                      <TrendingUp className="size-4" />
                      <span>{candA.name} +{scoreDelta}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Higher alignment with rubric criteria
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-sage">
                      <TrendingUp className="size-4" />
                      <span>{candB.name} +{Math.abs(scoreDelta!)}%</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Higher alignment with rubric criteria
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                Score both candidates to view delta
              </p>
            )}

            {/* Experience comparison note */}
            {candA.yearsOfExperience !== undefined && candB.yearsOfExperience !== undefined && (
              <div className="mt-4 border-t border-white/[0.04] pt-3 text-[11px] text-zinc-400">
                {candA.yearsOfExperience === candB.yearsOfExperience ? (
                  <span>Both have {candA.yearsOfExperience} years of experience</span>
                ) : candA.yearsOfExperience > candB.yearsOfExperience ? (
                  <span>{candA.name} has +{candA.yearsOfExperience - candB.yearsOfExperience} yrs more tenure</span>
                ) : (
                  <span>{candB.name} has +{candB.yearsOfExperience - candA.yearsOfExperience} yrs more tenure</span>
                )}
              </div>
            )}
          </div>

          {/* Candidate B Card */}
          <div className="flex flex-col items-center space-y-4 text-center md:items-end md:text-right">
            <div className="flex flex-row-reverse items-center gap-4">
              <ScoreRing score={scoreB} size={84} stroke={6} />
              <div>
                <h3 className="font-serif text-xl font-normal text-zinc-100">{candB.name}</h3>
                {candB.headline && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{candB.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                  <FitBadge score={scoreB} className="text-[11px]" />
                  <StatusBadge status={candB.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              {candB.linkedInUrl && (
                <a
                  href={candB.linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-steel hover:underline"
                >
                  <LinkedInIcon className="size-3" />
                  <span>Profile</span>
                </a>
              )}
              <span>Experience: <strong className="text-zinc-200">{candB.yearsOfExperience !== undefined ? `${candB.yearsOfExperience} yrs` : "--"}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Section: Hiring Verdict & Executive Summary */}
      <section aria-labelledby="summaries-heading" className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Award className="size-4" />
          <h2 id="summaries-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Hiring Verdicts & Executive Summaries
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Cand A Verdict & Summary */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <span className="text-xs font-medium text-zinc-400">Candidate A</span>
              <strong className="text-xs text-zinc-200">{candA.name}</strong>
            </div>

            {candA.verdict ? (
              <p className="font-serif text-base leading-snug text-zinc-100 sm:text-lg">
                &ldquo;{candA.verdict}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">No verdict generated yet.</p>
            )}

            {candA.summary && (
              <div className="mt-4 border-t border-white/[0.04] pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Summary</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">{candA.summary}</p>
              </div>
            )}
          </div>

          {/* Cand B Verdict & Summary */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <span className="text-xs font-medium text-zinc-400">Candidate B</span>
              <strong className="text-xs text-zinc-200">{candB.name}</strong>
            </div>

            {candB.verdict ? (
              <p className="font-serif text-base leading-snug text-zinc-100 sm:text-lg">
                &ldquo;{candB.verdict}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">No verdict generated yet.</p>
            )}

            {candB.summary && (
              <div className="mt-4 border-t border-white/[0.04] pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Summary</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">{candB.summary}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Side-by-Side Section: Strengths and Evidence */}
      <section aria-labelledby="strengths-heading" className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <ShieldCheck className="size-4 text-sage" />
          <h2 id="strengths-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Key Strengths & Evidence
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Cand A Strengths */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-sage" />
                <span className="text-xs font-medium text-zinc-200">{candA.name}</span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">{candA.strengths.length} strengths</span>
            </div>

            {candA.strengths.length === 0 ? (
              <p className="text-xs text-zinc-500">No strengths extracted from this profile.</p>
            ) : (
              <ul className="space-y-3">
                {candA.strengths.map((item, i) => (
                  <li key={`a-str-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sage" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cand B Strengths */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-sage" />
                <span className="text-xs font-medium text-zinc-200">{candB.name}</span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">{candB.strengths.length} strengths</span>
            </div>

            {candB.strengths.length === 0 ? (
              <p className="text-xs text-zinc-500">No strengths extracted from this profile.</p>
            ) : (
              <ul className="space-y-3">
                {candB.strengths.map((item, i) => (
                  <li key={`b-str-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sage" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Side-by-Side Section: Risks, Weaknesses & Discrepancies */}
      <section aria-labelledby="risks-heading" className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <ShieldAlert className="size-4 text-terracotta" />
          <h2 id="risks-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Risks, Discrepancies & Experience Gaps
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Cand A Risks */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-terracotta" />
                <span className="text-xs font-medium text-zinc-200">{candA.name}</span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">
                {candA.redFlags.length + candA.weaknesses.length} items
              </span>
            </div>

            {candA.redFlags.length === 0 && candA.weaknesses.length === 0 ? (
              <p className="text-xs text-zinc-500">No red flags or material gaps detected.</p>
            ) : (
              <div className="space-y-4">
                {candA.redFlags.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-terracotta">Points to verify</p>
                    <ul className="space-y-2">
                      {candA.redFlags.map((item, i) => (
                        <li key={`a-rf-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {candA.weaknesses.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-zinc-400">Experience gaps</p>
                    <ul className="space-y-2">
                      {candA.weaknesses.map((item, i) => (
                        <li key={`a-wk-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cand B Risks */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-terracotta" />
                <span className="text-xs font-medium text-zinc-200">{candB.name}</span>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">
                {candB.redFlags.length + candB.weaknesses.length} items
              </span>
            </div>

            {candB.redFlags.length === 0 && candB.weaknesses.length === 0 ? (
              <p className="text-xs text-zinc-500">No red flags or material gaps detected.</p>
            ) : (
              <div className="space-y-4">
                {candB.redFlags.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-terracotta">Points to verify</p>
                    <ul className="space-y-2">
                      {candB.redFlags.map((item, i) => (
                        <li key={`b-rf-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {candB.weaknesses.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-zinc-400">Experience gaps</p>
                    <ul className="space-y-2">
                      {candB.weaknesses.map((item, i) => (
                        <li key={`b-wk-${i}`} className="flex items-start gap-2.5 text-xs leading-relaxed text-zinc-300">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terracotta/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Side-by-Side Section: Competencies Comparison */}
      {competencyLabels.length > 0 && (
        <section aria-labelledby="competencies-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <TrendingUp className="size-4 text-steel" />
            <h2 id="competencies-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Competency Benchmark
            </h2>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised">
            <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.05] pb-3 text-xs">
              <span className="font-medium text-zinc-200">{candA.name}</span>
              <span className="text-zinc-500 uppercase tracking-wider text-[11px]">Skill Area</span>
              <span className="text-right font-medium text-zinc-200">{candB.name}</span>
            </div>

            <div className="space-y-5">
              {competencyLabels.map((label) => {
                const itemA = candA.competencies.find((c) => c.label.toLowerCase() === label.toLowerCase());
                const itemB = candB.competencies.find((c) => c.label.toLowerCase() === label.toLowerCase());
                const valA = itemA ? clampScore(itemA.score) : 0;
                const valB = itemB ? clampScore(itemB.score) : 0;

                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-300 tabular-nums">
                        {itemA ? `${valA}%` : "--"}
                      </span>
                      <span className="text-center font-medium text-zinc-200">{label}</span>
                      <span className="font-mono text-zinc-300 tabular-nums">
                        {itemB ? `${valB}%` : "--"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Cand A bar (left side, right-to-left fill or standard) */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            valA >= 75 ? "bg-sage" : valA >= 50 ? "bg-ochre" : "bg-terracotta"
                          }`}
                          style={{ width: `${valA}%` }}
                        />
                      </div>
                      {/* Cand B bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            valB >= 75 ? "bg-sage" : valB >= 50 ? "bg-ochre" : "bg-terracotta"
                          }`}
                          style={{ width: `${valB}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Side-by-Side Section: Career Background & Education */}
      <section aria-labelledby="background-heading" className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Briefcase className="size-4" />
          <h2 id="background-heading" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Work Experience & Education History
          </h2>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {/* Cand A Background */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-2">
                <span className="text-xs font-medium text-zinc-200">Experience · {candA.name}</span>
                <span className="text-[11px] text-zinc-500">{candA.profile.experience.length} roles</span>
              </div>
              {candA.profile.experience.length === 0 ? (
                <p className="text-xs text-zinc-500">No detailed timeline parsed.</p>
              ) : (
                <div className="space-y-4">
                  {candA.profile.experience.map((exp, i) => (
                    <div key={`a-exp-${i}`} className="border-l-2 border-white/10 pl-3">
                      <p className="text-xs font-medium text-zinc-200">{exp.title}</p>
                      <p className="text-[11px] text-zinc-400">
                        {exp.company}
                        {(exp.start || exp.end) && ` · ${exp.start ?? ""} - ${exp.end ?? "Present"}`}
                      </p>
                      {exp.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {candA.profile.education.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-2">
                  <span className="text-xs font-medium text-zinc-200">Education</span>
                </div>
                <div className="space-y-2">
                  {candA.profile.education.map((edu, i) => (
                    <div key={`a-edu-${i}`} className="text-xs">
                      <p className="font-medium text-zinc-200">{edu.degree}</p>
                      <p className="text-[11px] text-zinc-400">{edu.school} {edu.period ? `(${edu.period})` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cand B Background */}
          <div className="flex flex-col rounded-xl border border-white/[0.08] bg-card p-6 shadow-raised space-y-6">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-2">
                <span className="text-xs font-medium text-zinc-200">Experience · {candB.name}</span>
                <span className="text-[11px] text-zinc-500">{candB.profile.experience.length} roles</span>
              </div>
              {candB.profile.experience.length === 0 ? (
                <p className="text-xs text-zinc-500">No detailed timeline parsed.</p>
              ) : (
                <div className="space-y-4">
                  {candB.profile.experience.map((exp, i) => (
                    <div key={`b-exp-${i}`} className="border-l-2 border-white/10 pl-3">
                      <p className="text-xs font-medium text-zinc-200">{exp.title}</p>
                      <p className="text-[11px] text-zinc-400">
                        {exp.company}
                        {(exp.start || exp.end) && ` · ${exp.start ?? ""} - ${exp.end ?? "Present"}`}
                      </p>
                      {exp.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {candB.profile.education.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between border-b border-white/[0.05] pb-2">
                  <span className="text-xs font-medium text-zinc-200">Education</span>
                </div>
                <div className="space-y-2">
                  {candB.profile.education.map((edu, i) => (
                    <div key={`b-edu-${i}`} className="text-xs">
                      <p className="font-medium text-zinc-200">{edu.degree}</p>
                      <p className="text-[11px] text-zinc-400">{edu.school} {edu.period ? `(${edu.period})` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Dossier Action Links */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Leaderboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/items/${candA.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <span>Inspect {candA.name}</span>
            <ExternalLink className="size-3 text-zinc-500" />
          </Link>
          <Link
            href={`/items/${candB.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <span>Inspect {candB.name}</span>
            <ExternalLink className="size-3 text-zinc-500" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

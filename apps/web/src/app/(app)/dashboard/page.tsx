import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowLeftRight,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { ItemModel, JobCriteriaModel } from "@/lib/models";
import { domain } from "@/lib/domain";
import { candidateDisplayName, extractHeadline, extractLinkedInUrl } from "@/lib/candidate-ui";
import { ImportCandidateButton } from "./import-candidate-button";
import { JobCriteriaModal, type ActiveCriteria } from "./job-criteria-modal";
import { ScoutCandidateModal } from "./scout-candidate-modal";
import { CandidateLeaderboard, type LeaderboardCandidate } from "./candidate-leaderboard";

const L = domain.labels;

type CandidateFields = {
  strengths: string[];
  weaknesses: string[];
  verdict?: string;
  yearsOfExperience?: number;
};

function getCandidateFields(value: unknown): CandidateFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { strengths: [], weaknesses: [] };
  }

  const fields = value as Record<string, unknown>;
  return {
    strengths: Array.isArray(fields.strengths)
      ? fields.strengths.filter((entry): entry is string => typeof entry === "string")
      : [],
    weaknesses: Array.isArray(fields.weaknesses)
      ? fields.weaknesses.filter((entry): entry is string => typeof entry === "string")
      : [],
    verdict: typeof fields.verdict === "string" ? fields.verdict : undefined,
    yearsOfExperience:
      typeof fields.yearsOfExperience === "number" &&
      Number.isFinite(fields.yearsOfExperience)
        ? fields.yearsOfExperience
        : undefined,
  };
}

function extractCandidateSummary(item: {
  aiSummary?: string | null;
  content?: string | null;
  fields?: unknown;
}): string | undefined {
  if (item.aiSummary && typeof item.aiSummary === "string" && item.aiSummary.trim().length > 0) {
    return item.aiSummary.trim();
  }
  const fields = getCandidateFields(item.fields);
  if (fields.verdict && typeof fields.verdict === "string" && fields.verdict.trim().length > 0) {
    return fields.verdict.trim();
  }
  if (item.content && typeof item.content === "string") {
    const summaryMatch = item.content.match(/^\s*Summary:\s*(.+)$/im)?.[1]?.trim();
    if (summaryMatch) return summaryMatch;
    const headlineMatch = item.content.match(/^\s*Headline:\s*(.+)$/im)?.[1]?.trim();
    if (headlineMatch) return headlineMatch;
  }
  return undefined;
}

/** Stagger offsets for the entrance (classes defined in the shell layout). */
function delay(ms: number): React.CSSProperties {
  return { animationDelay: `${ms}ms` };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}): Promise<React.JSX.Element> {
  const { q = "", status = "" } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  await connectMongoose();
  const ownerQuery = {
    $or: [
      { ownerId: session.user.id },
      ...(session.user.email ? [{ ownerId: session.user.email }] : []),
      { ownerId: "demo@example.com" },
      { ownerId: "6ac38d4d38823f67c5b6a9ae" },
    ],
  };
  const [all, activeDoc] = await Promise.all([
    ItemModel.find(ownerQuery).sort({ createdAt: -1 }).limit(500).lean(),
    JobCriteriaModel.findOne({ ...ownerQuery, isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
  ]);

  // Serialize for the client modal (ObjectIds and Mongoose internals can't cross the boundary).
  const activeCriteria: ActiveCriteria | null = activeDoc
    ? {
        _id: String(activeDoc._id),
        roleTitle: activeDoc.roleTitle,
        rawRequirements: activeDoc.rawRequirements ?? "",
        expandedCriteria: activeDoc.expandedCriteria ?? "",
        rubric: activeDoc.rubric ? JSON.parse(JSON.stringify(activeDoc.rubric)) : undefined,
        isActive: true,
      }
    : null;
  const mustHaveCount = activeCriteria?.rubric?.mustHave?.length ?? 0;
  const niceToHaveCount = activeCriteria?.rubric?.niceToHave?.length ?? 0;
  const redFlagCount = activeCriteria?.rubric?.redFlags?.length ?? 0;
  const criteriaTotal = mustHaveCount + niceToHaveCount + redFlagCount;

  const candidateList: LeaderboardCandidate[] = all.map((item) => {
    const fields = getCandidateFields(item.fields);
    return {
      id: String(item._id),
      title: candidateDisplayName(item.title),
      headline: extractHeadline(item.content),
      summary: extractCandidateSummary(item),
      score: typeof item.score === "number" ? item.score : undefined,
      status: item.status,
      category: item.category,
      aiTags: item.aiTags,
      yearsOfExperience: fields.yearsOfExperience,
      sourceUrl:
        item.sourceUrl ||
        extractLinkedInUrl(item.content) ||
        extractLinkedInUrl(item.title) ||
        undefined,
    };
  });

  const topMatches = all.filter(
    (item) => typeof item.score === "number" && item.score >= 80,
  ).length;
  const scored = all.filter((item) => typeof item.score === "number");
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length)
    : null;

  const kpis = [
    {
      label: "Total candidates",
      value: all.length,
      hint: `${scored.length} scored`,
      icon: Users,
    },
    {
      label: "Top matches (80+)",
      value: topMatches,
      hint: all.length ? `${Math.round((topMatches / all.length) * 100)}% of pipeline` : "No candidates",
      icon: Award,
    },
    {
      label: "Average match",
      value: avgScore === null ? "--" : `${avgScore}%`,
      hint: scored.length ? `Across ${scored.length} scored` : "Nothing scored yet",
      icon: TrendingUp,
    },
    {
      label: "Active criteria",
      value: activeCriteria ? criteriaTotal : "--",
      hint: activeCriteria ? "Rubric items in force" : "No role set",
      icon: CheckCircle2,
    },
  ];

  const rubricStats = [
    { label: "Must-have", count: mustHaveCount, dot: "bg-sage" },
    { label: "Nice-to-have", count: niceToHaveCount, dot: "bg-ochre" },
    { label: "Red flags", count: redFlagCount, dot: "bg-terracotta" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-36">
      <header className="tr-rise flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-white">Talent pipeline</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-pretty text-zinc-500">
            {L.tagline}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {all.length > 1 && (
            <Link
              href="/compare"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeftRight className="size-3.5 text-steel" aria-hidden="true" />
              <span>Compare</span>
            </Link>
          )}
          <JobCriteriaModal initialCriteria={activeCriteria} />
          <ScoutCandidateModal activeCriteria={activeCriteria} />
          <ImportCandidateButton />
        </div>
      </header>

      <section
        aria-label="Active job criteria"
        style={delay(40)}
        className="tr-rise flex flex-col gap-3 rounded-xl border border-white/[0.09] bg-gradient-to-b from-white/[0.05] via-card to-card px-6 py-4 shadow-raised sm:flex-row sm:items-center sm:justify-between"
      >
        {activeCriteria ? (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-2 shrink-0 rounded-full bg-sage shadow-[0_0_8px_rgba(107,144,128,0.4)]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-500">Active rubric</p>
                <p className="truncate text-[13px] font-medium text-white">
                  {activeCriteria.roleTitle}
                </p>
              </div>
            </div>
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {rubricStats.map(({ label, count, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="font-mono text-zinc-200 tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="size-1.5 shrink-0 rounded-full bg-ochre" aria-hidden="true" />
            <div>
              <p className="text-[13px] font-medium text-white">No active role</p>
              <p className="text-xs text-zinc-500">
                Set job criteria so candidates are scored against your requirements.
              </p>
            </div>
          </div>
        )}
      </section>

      {all.length === 0 ? (
        <section
          style={delay(80)}
          className="tr-rise mx-auto w-full max-w-xl rounded-xl border border-white/[0.07] bg-card p-10 text-center shadow-raised"
        >
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04] text-zinc-400">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-white">No candidates yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-pretty text-zinc-500">
            Paste a profile, upload a resume or scrape a LinkedIn URL to get a match score, an
            experience estimate and a hiring recommendation.
          </p>
          <div className="mt-5 flex justify-center">
            <ImportCandidateButton />
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Pipeline overview" style={delay(80)} className="tr-rise">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] shadow-raised lg:grid-cols-4">
              {kpis.map(({ label, value, hint, icon: Icon }) => (
                <div key={label} className="bg-card px-6 py-5 transition-colors hover:bg-card/90">
                  <dt className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>{label}</span>
                    <Icon className="size-4 text-zinc-400" aria-hidden="true" />
                  </dt>
                  <dd className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">
                    {value}
                  </dd>
                  <dd className="mt-1 text-xs text-zinc-500 tabular-nums">{hint}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section
            aria-labelledby="leaderboard-heading"
            style={delay(120)}
            className="tr-rise space-y-3"
          >
            <div>
              <div className="flex items-baseline gap-2">
                <h2
                  id="leaderboard-heading"
                  className="text-[15px] font-semibold tracking-tight text-white"
                >
                  Candidate leaderboard
                </h2>
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  {all.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Ranked by match score, experience, or custom filters
              </p>
            </div>

            <CandidateLeaderboard
              candidates={candidateList}
              initialQuery={q}
              initialStatus={status}
            />
          </section>
        </>
      )}
    </div>
  );
}

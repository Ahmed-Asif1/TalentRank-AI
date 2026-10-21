import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import {
  AlignLeft,
  ArrowLeft,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { ItemModel, JobCriteriaModel } from "@/lib/models";
import {
  candidateDisplayName,
  clampScore,
  extractHeadline,
  extractLinkedInUrl,
  formatYears,
  pad2,
  cleanCandidateProfileText,
} from "@/lib/candidate-ui";
import { FitBadge, MeterBar, Panel, ScoreRing, StatusBadge, Tag } from "@/components/ui/foundry";
import { Chat } from "@/components/ai/chat";
import { parseProfileText } from "@/lib/candidate-profile";
import { ProfileTabs } from "./profile-tabs";
import { ReevaluateButton } from "./reevaluate-button";
import { DeleteCandidateButton } from "./delete-candidate-button";
import { CompareCandidateButton } from "./compare-button";

function LinkedInIcon({ className = "size-3.5" }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
    </svg>
  );
}

type Competency = { label: string; score: number };

type DossierFields = {
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  interviewQuestions: string[];
  competencies: Competency[];
  verdict?: string;
  yearsOfExperience?: number;
};

const MAX_COMPETENCIES = 6;

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    : [];
}

/** Reads `[{ label, score }]` defensively. Older candidates have none, which is fine. */
function competencyList(value: unknown): Competency[] {
  if (!Array.isArray(value)) return [];
  const out: Competency[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { label, score } = entry as Record<string, unknown>;
    if (typeof label !== "string" || label.trim() === "") continue;
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    out.push({ label: label.trim(), score: clampScore(score) });
    if (out.length === MAX_COMPETENCIES) break;
  }
  return out;
}

function getDossierFields(value: unknown): DossierFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      strengths: [],
      weaknesses: [],
      redFlags: [],
      interviewQuestions: [],
      competencies: [],
    };
  }
  const fields = value as Record<string, unknown>;
  return {
    strengths: stringList(fields.strengths),
    weaknesses: stringList(fields.weaknesses),
    redFlags: stringList(fields.redFlags),
    interviewQuestions: stringList(fields.interviewQuestions),
    competencies: competencyList(fields.competencies),
    verdict: typeof fields.verdict === "string" ? fields.verdict : undefined,
    yearsOfExperience:
      typeof fields.yearsOfExperience === "number" && Number.isFinite(fields.yearsOfExperience)
        ? fields.yearsOfExperience
        : undefined,
  };
}

function delay(ms: number): React.CSSProperties {
  return { animationDelay: `${ms}ms` };
}

function BulletList({
  items,
  dot,
  empty,
}: {
  items: string[];
  dot: string;
  empty: string;
}): React.JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{empty}</p>;
  }
  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
          <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RiskGroup({
  label,
  items,
  dot,
}: {
  label: string;
  items: string[];
  dot: string;
}): React.JSX.Element {
  return (
    <div>
      <h3 className="mb-3.5 text-xs text-zinc-400">{label}</h3>
      <BulletList items={items} dot={dot} empty="" />
    </div>
  );
}

export default async function CandidateDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectMongoose();
  const ownerQuery = {
    $or: [
      { ownerId: session.user.id },
      ...(session.user.email ? [{ ownerId: session.user.email }] : []),
      { ownerId: "demo@example.com" },
      { ownerId: "6ac38d4d38823f67c5b6a9ae" },
    ],
  };
  const [item, activeDoc, allItems] = await Promise.all([
    ItemModel.findOne({ _id: id, ...ownerQuery }).lean(),
    JobCriteriaModel.findOne({ ...ownerQuery, isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
    ItemModel.find(ownerQuery)
      .select({ _id: 1, title: 1, score: 1, content: 1, fields: 1 })
      .sort({ score: -1, createdAt: -1 })
      .lean(),
  ]);
  if (!item) notFound();

  const compareCandidatesList = (allItems ?? []).map((c) => {
    const candidateFields = getDossierFields(c.fields);
    return {
      id: String(c._id),
      name: candidateDisplayName(c.title),
      score: typeof c.score === "number" ? c.score : undefined,
      headline: extractHeadline(c.content),
      yearsOfExperience: candidateFields.yearsOfExperience,
    };
  });

  const fields = getDossierFields(item.fields);
  const name = candidateDisplayName(item.title);
  const headline = extractHeadline(item.content);
  const linkedInUrl =
    item.sourceUrl ||
    extractLinkedInUrl(item.content) ||
    extractLinkedInUrl(item.title);
  const score = typeof item.score === "number" ? item.score : undefined;
  const tags = item.aiTags ?? [];
  const verdict = fields.verdict || item.aiSummary || "";
  const summary = typeof item.aiSummary === "string" ? item.aiSummary.trim() : "";
  const rawText = typeof item.content === "string" ? item.content : "";
  const parsedProfile = parseProfileText(rawText);

  // Prefer questions stored on the candidate; otherwise use the active role's rubric.
  const rubricQuestions = stringList(
    (activeDoc?.rubric as unknown as { interviewQuestions?: unknown } | undefined)
      ?.interviewQuestions,
  );
  const questions = fields.interviewQuestions.length > 0 ? fields.interviewQuestions : rubricQuestions;
  const gapItems = fields.weaknesses;
  const riskCount = fields.redFlags.length + gapItems.length;
  const hasRisks = riskCount > 0;
  const evaluated = item.status === "processed";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-16">
      {/* Header */}
      <header className="tr-rise space-y-7">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-2 rounded-md text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-100 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowLeft
            className="size-3.5 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            aria-hidden="true"
          />
          Back to pipeline
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-4xl font-normal tracking-tight text-balance text-zinc-50 sm:text-5xl">
              {name}
            </h1>
            {headline && (
              <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-400">
                {headline}
              </p>
            )}
            {linkedInUrl && (
              <div className="mt-3">
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-steel transition-colors hover:text-zinc-100 hover:underline"
                  title="Open candidate's LinkedIn profile in a new tab"
                >
                  <LinkedInIcon className="size-3" />
                  <span>{linkedInUrl}</span>
                  <ExternalLink className="size-3 opacity-70" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {linkedInUrl && (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                title="Open candidate's LinkedIn profile in a new tab"
              >
                <LinkedInIcon className="size-3.5 text-steel" />
                <span>LinkedIn profile</span>
                <ExternalLink className="size-3 text-zinc-500" aria-hidden="true" />
              </a>
            )}
            <CompareCandidateButton
              currentCandidateId={String(item._id)}
              currentCandidateName={name}
              candidates={compareCandidatesList}
            />
            <ReevaluateButton itemId={String(item._id)} />
            <DeleteCandidateButton candidateId={String(item._id)} candidateName={name} />
          </div>
        </div>
      </header>

      {/* Recommendation */}
      <section
        aria-labelledby="verdict-heading"
        style={delay(80)}
        className="tr-rise overflow-hidden rounded-xl border border-white/[0.07] bg-card"
      >
        <div className="grid gap-8 p-8 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12">
          <div className="flex flex-col items-center gap-3.5 md:items-start">
            <ScoreRing score={score} size={128} stroke={8} />
            <p className="text-xs text-zinc-400">Match score</p>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="verdict-heading" className="text-sm text-zinc-400">
                Hiring recommendation
              </h2>
              <FitBadge score={score} className="px-2.5 py-1 text-xs" />
              <StatusBadge status={item.status} />
            </div>

            {verdict ? (
              <p className="max-w-2xl font-serif text-xl leading-snug text-pretty text-zinc-100 sm:text-2xl">
                {verdict}
              </p>
            ) : (
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">
                No verdict yet. Re-evaluate this candidate to generate one.
              </p>
            )}

            <dl className="flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/[0.04] pt-5">
              <div>
                <dt className="text-xs text-zinc-500">Experience</dt>
                <dd className="mt-1.5">
                  {fields.yearsOfExperience === undefined ? (
                    <span className="text-xs text-zinc-600">--</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold tracking-tight text-zinc-100 tabular-nums">
                        {formatYears(fields.yearsOfExperience)}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500">yrs</span>
                    </div>
                  )}
                </dd>
              </div>
              {tags.length > 0 && (
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500">Signals</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {tags.slice(0, 6).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* Executive summary (narrative overview directly below recommendation) */}
      {summary && summary !== verdict.trim() && (
        <section
          aria-labelledby="summary-heading"
          style={delay(120)}
          className="tr-rise overflow-hidden rounded-xl border border-white/[0.07] bg-card p-6 sm:p-7 shadow-xs"
        >
          <div className="mb-4 flex items-center gap-2.5 border-b border-white/[0.04] pb-3.5">
            <AlignLeft className="size-4 text-zinc-500" aria-hidden="true" />
            <h2 id="summary-heading" className="text-sm font-medium text-zinc-100">
              Executive summary
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">{summary}</p>
        </section>
      )}

      {/* Strengths & Weaknesses / Risks side-by-side */}
      <section
        aria-label="Evaluation breakdown"
        style={delay(160)}
        className="tr-rise grid grid-cols-1 items-stretch gap-6 md:grid-cols-2"
      >
        {/* Left Column: Strengths & Evidence */}
        <div className="flex flex-col">
          <Panel
            title="Strengths and evidence"
            icon={ShieldCheck}
            aside={pad2(fields.strengths.length)}
            className="flex flex-1 flex-col"
            bodyClassName="p-6 flex-1 flex flex-col justify-between space-y-6"
          >
            <BulletList
              items={fields.strengths}
              dot="bg-sage"
              empty="No strengths were extracted from this profile."
            />
            {fields.competencies.length > 0 && (
              <div className="border-t border-white/[0.04] pt-5">
                <h3 className="mb-3.5 text-xs text-zinc-400">Competency breakdown</h3>
                <div className="space-y-3.5">
                  {fields.competencies.map((c) => (
                    <MeterBar key={c.label} label={c.label} value={c.score} />
                  ))}
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Right Column: Risks & Experience Gaps (Weaknesses) */}
        <div className="flex flex-col">
          <section
            aria-labelledby="risks-heading"
            className={`flex flex-1 flex-col overflow-hidden rounded-xl border bg-card ${
              hasRisks ? "border-terracotta/25" : "border-white/[0.07]"
            }`}
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-6 py-4">
              <h2 id="risks-heading" className="flex items-center gap-2.5 text-sm font-medium text-zinc-100">
                {hasRisks ? (
                  <ShieldAlert className="size-4 text-terracotta" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4 text-sage" aria-hidden="true" />
                )}
                Risks and discrepancies
              </h2>
              <span className="text-xs text-zinc-500 tabular-nums">
                {hasRisks ? `${riskCount} to review` : evaluated ? "None identified" : "Not evaluated"}
              </span>
            </header>
            <div className="flex-1 p-6">
              {hasRisks ? (
                <div className="space-y-6">
                  {fields.redFlags.length > 0 && (
                    <RiskGroup label="Points to verify" items={fields.redFlags} dot="bg-terracotta" />
                  )}
                  {gapItems.length > 0 && (
                    <RiskGroup label="Experience gaps" items={gapItems} dot="bg-terracotta/50" />
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-zinc-400">
                  {evaluated
                    ? "No material risks or experience gaps were identified from this profile."
                    : "Risks and gaps appear here once the candidate has been evaluated."}
                </p>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* Screening questions */}
      {questions.length > 0 && (
        <section aria-labelledby="questions-heading" style={delay(240)} className="tr-rise space-y-6">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="size-4 text-zinc-500" aria-hidden="true" />
            <h2
              id="questions-heading"
              className="font-serif text-2xl font-normal tracking-tight text-zinc-50"
            >
              Screening interview questions
            </h2>
          </div>
          <ol className="divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-white/[0.07] bg-card">
            {questions.map((question, i) => (
              <li key={`${i}-${question}`} className="flex items-start gap-5 px-7 py-5">
                <span className="mt-0.5 text-xs text-zinc-500 tabular-nums">{pad2(i + 1)}</span>
                <p className="text-sm leading-relaxed text-zinc-200">{question}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Candidate profile tabs & source */}
      <section aria-label="Candidate profile" style={delay(280)} className="tr-rise space-y-4">
        <div className="flex items-center gap-2.5">
          <FileText className="size-4 text-zinc-500" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-normal tracking-tight text-zinc-50">
            Candidate profile & source
          </h2>
        </div>
        <ProfileTabs profile={parsedProfile} rawText={cleanCandidateProfileText(rawText) || rawText} />
      </section>

      {/* Candidate insights (contextual search over the profile) */}
      <section aria-labelledby="insights-heading" style={delay(340)} className="tr-rise space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <MessageSquareText className="size-4 text-zinc-500" aria-hidden="true" />
            <h2
              id="insights-heading"
              className="font-serif text-2xl font-normal tracking-tight text-zinc-50"
            >
              Candidate insights
            </h2>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Ask about this candidate&apos;s experience. Each answer cites the part of the profile it
            came from.
          </p>
        </div>
        <Chat itemId={String(item._id)} />
      </section>
    </div>
  );
}

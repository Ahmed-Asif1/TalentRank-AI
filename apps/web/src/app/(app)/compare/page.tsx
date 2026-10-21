import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { ItemModel, JobCriteriaModel } from "@/lib/models";
import {
  candidateDisplayName,
  clampScore,
  extractHeadline,
  extractLinkedInUrl,
} from "@/lib/candidate-ui";
import { parseProfileText } from "@/lib/candidate-profile";
import { CompareClientView } from "./compare-client-view";
import type { CandidateComparisonData } from "./compare-client-view";

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "")
    : [];
}

function competencyList(value: unknown): Array<{ label: string; score: number }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ label: string; score: number }> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const { label, score } = entry as Record<string, unknown>;
    if (typeof label !== "string" || label.trim() === "") continue;
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    out.push({ label: label.trim(), score: clampScore(score) });
    if (out.length === 6) break;
  }
  return out;
}

export const metadata = {
  title: "Candidate Comparison | TalentRank AI",
  description: "Compare candidate profiles side-by-side across scores, competencies, and background criteria.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<React.JSX.Element> {
  const { a: initialA, b: initialB } = await searchParams;
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

  const [items, activeDoc] = await Promise.all([
    ItemModel.find(ownerQuery)
      .sort({ score: -1, createdAt: -1 })
      .lean(),
    JobCriteriaModel.findOne({ ...ownerQuery, isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean(),
  ]);

  const candidatesData: CandidateComparisonData[] = items.map((item) => {
    const rawFields = item.fields && typeof item.fields === "object" && !Array.isArray(item.fields)
      ? (item.fields as Record<string, unknown>)
      : {};

    const strengths = stringList(rawFields.strengths);
    const weaknesses = stringList(rawFields.weaknesses);
    const redFlags = stringList(rawFields.redFlags);
    const competencies = competencyList(rawFields.competencies);
    const verdict = typeof rawFields.verdict === "string" ? rawFields.verdict : (item.aiSummary ?? "");
    const summary = typeof item.aiSummary === "string" ? item.aiSummary.trim() : "";
    const rawText = typeof item.content === "string" ? item.content : "";
    const profile = parseProfileText(rawText);

    const yearsOfExp =
      typeof rawFields.yearsOfExperience === "number" && Number.isFinite(rawFields.yearsOfExperience)
        ? rawFields.yearsOfExperience
        : undefined;

    return {
      id: String(item._id),
      name: candidateDisplayName(item.title),
      headline: extractHeadline(item.content),
      linkedInUrl:
        item.sourceUrl ||
        extractLinkedInUrl(item.content) ||
        extractLinkedInUrl(item.title) ||
        undefined,
      score: typeof item.score === "number" ? item.score : undefined,
      status: item.status,
      verdict,
      summary,
      yearsOfExperience: yearsOfExp,
      strengths,
      weaknesses,
      redFlags,
      competencies,
      profile,
    };
  });

  return (
    <CompareClientView
      candidates={candidatesData}
      initialIdA={initialA}
      initialIdB={initialB}
      activeRoleTitle={activeDoc?.roleTitle}
    />
  );
}

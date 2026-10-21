/**
 * Shared presentational helpers for the dashboard and candidate views.
 * Pure functions, no React: safe from server and client components.
 *
 * Class names are written out in full so Tailwind v4's source scanner finds them.
 */

export type ScoreStyle = {
  /** Qualitative band shown next to the score. */
  label: string;
  /** Muted text color. SVG rings and dots inherit it through currentColor. */
  text: string;
  /** Neutral translucent pill: background, text and border. Color lives in the dot. */
  badge: string;
  /** Accent dot color. */
  dot: string;
  /** Solid fill for bars. */
  bar: string;
};

const NEUTRAL_BADGE = "bg-white/5 text-zinc-300 border-white/[0.07]";

/** 80+ strong fit, 60+ potential, otherwise unqualified. */
export function getScoreStyle(score: number | null | undefined): ScoreStyle {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return {
      label: "Unscored",
      text: "text-zinc-500",
      badge: "bg-white/[0.03] text-zinc-500 border-white/5",
      dot: "bg-zinc-600",
      bar: "bg-zinc-700",
    };
  }
  if (score >= 80) {
    return {
      label: "Strong Fit",
      text: "text-emerald-400/90",
      badge: NEUTRAL_BADGE,
      dot: "bg-emerald-400",
      bar: "bg-emerald-400/70",
    };
  }
  if (score >= 60) {
    return {
      label: "Potential",
      text: "text-amber-400/90",
      badge: NEUTRAL_BADGE,
      dot: "bg-amber-400",
      bar: "bg-amber-400/70",
    };
  }
  return {
    label: "Unqualified",
    text: "text-rose-400/90",
    badge: NEUTRAL_BADGE,
    dot: "bg-rose-400",
    bar: "bg-rose-400/70",
  };
}

export function clampScore(score: number | null | undefined): number {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

export type StatusStyle = {
  label: string;
  text: string;
  dot: string;
};

/** processed = evaluated (emerald), failed = rose, anything else = pending (amber). */
export function getStatusStyle(status: string): StatusStyle {
  if (status === "processed") {
    return { label: "Evaluated", text: "text-zinc-400", dot: "bg-emerald-400" };
  }
  if (status === "failed") {
    return { label: "Failed", text: "text-rose-400/90", dot: "bg-rose-400" };
  }
  return { label: "Pending", text: "text-zinc-400", dot: "bg-amber-400" };
}

export function getStatusDot(status: string): string {
  return getStatusStyle(status).dot;
}

/** Zero-padded readout, e.g. 7 -> "07". */
export function pad2(value: number): string {
  return String(Math.max(0, Math.trunc(value))).padStart(2, "0");
}

/** Imported candidates are titled "Name - LinkedIn Profile"; show just the name. */
export function candidateDisplayName(title: string): string {
  return title.replace(/\s+-\s+LinkedIn Profile$/i, "").trim() || title;
}

/** Pulls a "Headline: ..." line out of stored profile text, when present. */
export function extractHeadline(content: string | null | undefined): string | undefined {
  if (!content) return undefined;
  const value = content.match(/^\s*Headline:\s*(.+)$/im)?.[1]?.trim();
  return value || undefined;
}

/** 5 -> "5", 5.5 -> "5.5" */
export function formatYears(years: number): string {
  return Number.isInteger(years) ? String(years) : years.toFixed(1);
}

/**
 * Sanitizer for candidate profile text (pasted LinkedIn text or scraped PDF resumes).
 * Strips navigation boilerplate, tracking parameters and zero-width characters,
 * and collapses excess whitespace.
 */
export function cleanCandidateProfileText(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";

  const boilerplatePatterns = [
    /^skip to main content/i,
    /^sign in\b/i,
    /^join now\b/i,
    /^join to view full profile/i,
    /^see all \d+ (experiences|skills|connections|details|updates)/i,
    /^show all \d+ (experiences|skills|connections|details|updates)/i,
    /^show more\b/i,
    /^show less\b/i,
    /^report this profile/i,
    /^people also viewed/i,
    /^people you may know/i,
    /^page \d+ of \d+/i,
    /^printed from linkedin/i,
    /^©\s*\d{4}\s*linkedin/i,
    /^activity\s*$/i,
    /^endorse(d)?\b/i,
    /^message\s*$/i,
    /^more\s*$/i,
    /^connect\s*$/i,
    /^follow\s*$/i,
  ];

  const cleanedLines: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleanedLines.push("");
      continue;
    }
    if (boilerplatePatterns.some((pattern) => pattern.test(trimmed))) continue;

    cleanedLines.push(
      line
        .replace(/[?&](trk|lipi|miniProfileUrn|trackingId|originalReferer)=[^&\s)]+/gi, "")
        .replace(/[​-‍﻿]/g, ""),
    );
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

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

const NEUTRAL_BADGE = "badge-gradient-neutral text-zinc-300 border-white/[0.08]";

/** 80+ strong fit, 60+ potential, otherwise unqualified. */
export function getScoreStyle(score: number | null | undefined): ScoreStyle {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return {
      label: "Unscored",
      text: "text-zinc-500",
      badge: "badge-gradient-neutral text-zinc-500 border-white/5",
      dot: "bg-zinc-600",
      bar: "bg-zinc-700",
    };
  }
  if (score >= 80) {
    return {
      label: "Strong Fit",
      text: "text-sage",
      badge: "badge-gradient-sage text-zinc-200 border-sage/30",
      dot: "bg-sage",
      bar: "bg-sage/70",
    };
  }
  if (score >= 60) {
    return {
      label: "Potential",
      text: "text-ochre",
      badge: "badge-gradient-ochre text-zinc-200 border-ochre/30",
      dot: "bg-ochre",
      bar: "bg-ochre/70",
    };
  }
  return {
    label: "Unqualified",
    text: "text-terracotta",
    badge: "badge-gradient-terracotta text-zinc-200 border-terracotta/30",
    dot: "bg-terracotta",
    bar: "bg-terracotta/70",
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

/** processed = evaluated (sage), failed = terracotta, anything else = pending (ochre). */
export function getStatusStyle(status: string): StatusStyle {
  if (status === "processed") {
    return { label: "Evaluated", text: "text-zinc-400", dot: "bg-sage" };
  }
  if (status === "failed") {
    return { label: "Failed", text: "text-terracotta", dot: "bg-terracotta" };
  }
  return { label: "Pending", text: "text-zinc-400", dot: "bg-ochre" };
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
        .replace(/[\u200B-\u200D\uFEFF]/g, ""),
    );
  }

  return cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const KNOWN_CANDIDATE_LINKEDIN_MAP: Record<string, string> = {
  "muhammad ahmed asif": "https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318",
  "muhammad ahmed": "https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318",
  "ahmed asif": "https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318",
  "abdullah (hafiz) anwar": "https://www.linkedin.com/in/abdullah-anwar-cs",
  "abdullah anwar": "https://www.linkedin.com/in/abdullah-anwar-cs",
  "hafiz abdullah anwar": "https://www.linkedin.com/in/abdullah-anwar-cs",
  "muhammad hassan": "https://www.linkedin.com/in/muhammad-hassan-035a78375",
  "hassan moin": "https://www.linkedin.com/in/muhammad-hassan-035a78375",
  "muhammad yahya shahzad": "https://www.linkedin.com/in/myahyashahzad",
  "muhammad yahya": "https://www.linkedin.com/in/myahyashahzad",
  "yahya shahzad": "https://www.linkedin.com/in/myahyashahzad",
  "yahya": "https://www.linkedin.com/in/myahyashahzad",
  "mahad ehtesham hashmi": "https://www.linkedin.com/in/mahad-hashmi",
  "mahad hashmi": "https://www.linkedin.com/in/mahad-hashmi",
};

/**
 * Detects and extracts a valid LinkedIn profile URL from unstructured text or resumes.
 * Handles variations such as:
 * - https://www.linkedin.com/in/username
 * - http://pk.linkedin.com/in/username/
 * - linkedin.com/in/username
 * - PDF multi-line column breaks: www.linkedin.com/in/\nusername (LinkedIn)
 * - (https://linkedin.com/in/username?utm_source=...)
 * Strips tracking parameters, trailing punctuation, slashes, and brackets.
 * Returns canonical `https://www.linkedin.com/in/{slug}` or undefined.
 */
export function extractLinkedInUrl(text: string | null | undefined): string | undefined {
  if (!text || typeof text !== "string") return undefined;

  // 1. Match domain and profile slug, allowing optional whitespace/newlines for PDF column breaks
  const match = text.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9_-]+\.)?linkedin\.com\/in\/\s*([a-zA-Z0-9_\-%]+)/i);
  if (match && match[1]) {
    // Clean trailing punctuation, brackets, parentheses, or trailing slashes
    let slug = match[1].replace(/^[/\s]+|[/\s.,;:!?)\]}>]+$/g, "");
    // If slug contains query parameters or hash, isolate just the identifier
    slug = slug.split(/[?#]/)[0] ?? "";
    slug = slug.trim();

    if (slug && slug.length >= 2) {
      return `https://www.linkedin.com/in/${slug}`;
    }
  }

  // 2. Fallback: match known candidate profiles by name in text/title
  const lower = text.toLowerCase();
  for (const [key, url] of Object.entries(KNOWN_CANDIDATE_LINKEDIN_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }

  return undefined;
}

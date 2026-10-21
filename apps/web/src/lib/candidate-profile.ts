// Parses the plain-text profile format stored in Item.content ("Name:", "Headline:", "Summary:" lines,
// then "Experience:", "Education:", "Skills:" ... sections) into structured sections for display.
// Written by the LinkedIn importers and AI sourcing; pasted text and PDFs usually have no sections,
// in which case only the raw text is shown. Pure and client-safe.

export interface ExperienceEntry {
  title: string;
  company?: string;
  start?: string;
  end?: string;
  meta?: string;
  description?: string;
}

export interface EducationEntry {
  degree: string;
  school?: string;
  period?: string;
}

export interface ParsedProfile {
  headline?: string;
  location?: string;
  openToWork: boolean;
  summary?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  certifications: string[];
  languages: string[];
  /** True when at least one section was found, i.e. the tabs are worth showing. */
  structured: boolean;
}

type Section = "experience" | "education" | "skills" | "certifications" | null;

const SECTION_HEADERS: Record<string, Exclude<Section, null>> = {
  experience: "experience",
  education: "education",
  skills: "skills",
  certifications: "certifications",
};

// "- Senior Engineer at Acme (Jan 2021 to Present) · Full-time, Remote"
const EXPERIENCE_RE = /^(.+?)(?: at (.+?))?(?: \(([^()]*?) to ([^()]*?)\))?(?: · (.+))?$/;
// "- B.S. Computer Science at MIT (2014 - 2018)"
const EDUCATION_RE = /^(.+?)(?: at (.+?))?(?: \(([^()]+)\))?$/;

function splitCommaList(text: string): string[] {
  return text
    .split(/,|•|·/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseProfileText(content: string | null | undefined): ParsedProfile {
  const profile: ParsedProfile = {
    openToWork: false,
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    structured: false,
  };
  if (!content) return profile;

  let section: Section = null;
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Top-level "Key: value" lines
    const keyed = line.match(/^(Name|Headline|Location|Open to work|Summary|Languages):\s*(.*)$/i);
    if (keyed && !rawLine.startsWith(" ")) {
      const [, key = "", value = ""] = keyed;
      const k = key.toLowerCase();
      if (k === "headline") profile.headline = value || undefined;
      else if (k === "location") profile.location = value || undefined;
      else if (k === "open to work") profile.openToWork = /^yes/i.test(value);
      else if (k === "summary") profile.summary = value || undefined;
      else if (k === "languages") profile.languages = splitCommaList(value);
      section = null;
      continue;
    }

    // Section headers: "Experience:" (optionally with inline content, e.g. "Skills: a, b")
    const header = line.match(/^(Experience|Education|Skills|Certifications):\s*(.*)$/i);
    if (header && !rawLine.startsWith(" ")) {
      section = SECTION_HEADERS[(header[1] ?? "").toLowerCase()] ?? null;
      const inline = header[2]?.trim();
      if (inline && section === "skills") profile.skills.push(...splitCommaList(inline));
      continue;
    }

    if (section === "experience") {
      if (line.startsWith("- ")) {
        const m = line.slice(2).match(EXPERIENCE_RE);
        profile.experience.push({
          title: m?.[1]?.trim() || line.slice(2),
          company: m?.[2]?.trim() || undefined,
          start: m?.[3]?.trim() || undefined,
          end: m?.[4]?.trim() || undefined,
          meta: m?.[5]?.trim() || undefined,
        });
      } else {
        // Indented description lines belong to the latest role
        const last = profile.experience.at(-1);
        if (last) last.description = last.description ? `${last.description} ${line}` : line;
      }
    } else if (section === "education") {
      if (line.startsWith("- ")) {
        const m = line.slice(2).match(EDUCATION_RE);
        profile.education.push({
          degree: m?.[1]?.trim() || line.slice(2),
          school: m?.[2]?.trim() || undefined,
          period: m?.[3]?.trim() || undefined,
        });
      }
    } else if (section === "skills") {
      profile.skills.push(...splitCommaList(line.replace(/^-\s*/, "")));
    } else if (section === "certifications") {
      if (line.startsWith("- ")) profile.certifications.push(line.slice(2).trim());
    }
  }

  profile.skills = [...new Set(profile.skills)];
  profile.structured =
    profile.experience.length > 0 ||
    profile.education.length > 0 ||
    profile.skills.length > 0 ||
    profile.certifications.length > 0;
  return profile;
}

/** LinkedIn deep links for one profile. `profileUrl` must be normalized. */
export function linkedinSectionLinks(profileUrl: string): { label: string; href: string }[] {
  const base = profileUrl.replace(/\/+$/, "");
  return [
    { label: "Experience", href: `${base}/details/experience/` },
    { label: "Skills", href: `${base}/details/skills/` },
    { label: "Education", href: `${base}/details/education/` },
    { label: "Certifications", href: `${base}/details/certifications/` },
    { label: "Recommendations", href: `${base}/details/recommendations/` },
    { label: "Activity", href: `${base}/recent-activity/all/` },
  ];
}

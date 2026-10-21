import { generateText } from "ai";
import { fastModel } from "@/lib/ai/models";

/**
 * Reference Charts designed by Mahad Hashmi (Team TensorSlow)
 * for Apify LinkedIn Profile Search Scraper (Actor: M2FMdjRVeF1HPGFcc)
 */

export const YEARS_ID_MAP = {
  LESS_THAN_1_YEAR: "1",
  ONE_TO_TWO_YEARS: "2",
  THREE_TO_FIVE_YEARS: "3",
  SIX_TO_TEN_YEARS: "4",
  MORE_THAN_10_YEARS: "5",
} as const;

export const FUNCTION_ID_MAP: Record<string, string> = {
  accounting: "1",
  administrative: "2",
  "arts and design": "3",
  design: "3",
  "business development": "4",
  "community and social services": "5",
  consulting: "6",
  education: "7",
  engineering: "8",
  software: "8",
  developer: "8",
  entrepreneurship: "9",
  finance: "10",
  "healthcare services": "11",
  "human resources": "12",
  hr: "12",
  "information technology": "13",
  it: "13",
  legal: "14",
  marketing: "15",
  "media and communication": "16",
  "military and protective services": "17",
  operations: "18",
  "product management": "19",
  product: "19",
  "program and project management": "20",
  project: "20",
  purchasing: "21",
  "quality assurance": "22",
  qa: "22",
  "real estate": "23",
  research: "24",
  sales: "25",
  "customer success and support": "26",
  support: "26",
};

export const SENIORITY_LEVEL_ID_MAP: Record<string, string> = {
  intern: "100",
  "in training": "100",
  training: "100",
  junior: "110",
  "entry level": "110",
  entry: "110",
  mid: "110",
  senior: "120",
  sr: "120",
  lead: "120",
  strategic: "130",
  manager: "200",
  "entry level manager": "200",
  "experienced manager": "210",
  director: "220",
  "vice president": "300",
  vp: "300",
  cxo: "310",
  cto: "310",
  ceo: "310",
  cfo: "310",
  founder: "320",
  owner: "320",
  partner: "320",
};

export interface ApifyScoutPayload {
  autoQuerySegmentation: boolean;
  currentCompanies: string[];
  currentJobTitles: string[];
  functionIds: string[];
  locations: string[];
  maxItems: number;
  pastCompanies: string[];
  pastJobTitles: string[];
  profileScraperMode: "Full" | "Short";
  recentlyChangedJobs: boolean;
  recentlyPostedOnLinkedIn: boolean;
  schools: string[];
  searchQuery: string;
  seniorityLevelIds: string[];
  yearsAtCurrentCompanyIds: string[];
  yearsOfExperienceIds: string[];
  startPage?: number;
}

export interface ScoutOptions {
  query?: string;
  jobDescription?: string;
  location?: string;
  seniority?: "all" | "junior" | "mid" | "senior" | "lead" | "director";
  maxItems?: number;
}

/**
 * Creates default fallback search parameters from query terms and heuristics.
 */
export function buildScoutPayloadFromQuery(options: ScoutOptions): ApifyScoutPayload {
  const query = (options.query || "").trim() || "Software Engineer";
  const location = (options.location || "").trim();
  const maxItems = Math.min(Math.max(options.maxItems ?? 5, 1), 20);

  const functionIds: string[] = ["8"]; // Default to Engineering ("8")
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("product")) functionIds.push("19");
  if (lowerQuery.includes("data") || lowerQuery.includes("analytics")) functionIds.push("13", "24");
  if (lowerQuery.includes("design") || lowerQuery.includes("ui") || lowerQuery.includes("ux")) functionIds.push("3");
  if (lowerQuery.includes("marketing")) functionIds.push("15");

  const seniorityIds: string[] = [];
  const yearsIds: string[] = [];

  const seniority = options.seniority || "senior";
  if (seniority === "junior" || lowerQuery.includes("junior") || lowerQuery.includes("entry")) {
    seniorityIds.push("110");
    yearsIds.push("1", "2");
  } else if (seniority === "lead" || lowerQuery.includes("lead") || lowerQuery.includes("principal")) {
    seniorityIds.push("120", "200");
    yearsIds.push("4", "5");
  } else if (seniority === "director" || lowerQuery.includes("director") || lowerQuery.includes("head")) {
    seniorityIds.push("220", "300");
    yearsIds.push("5");
  } else {
    // Default Senior
    seniorityIds.push("120");
    yearsIds.push("3", "4");
  }

  return {
    autoQuerySegmentation: false,
    currentCompanies: [],
    currentJobTitles: [],
    functionIds: Array.from(new Set(functionIds)),
    locations: location ? [location] : [],
    maxItems,
    pastCompanies: [],
    pastJobTitles: [],
    profileScraperMode: "Full",
    recentlyChangedJobs: false,
    recentlyPostedOnLinkedIn: false,
    schools: [],
    searchQuery: query,
    seniorityLevelIds: seniorityIds,
    yearsAtCurrentCompanyIds: [],
    yearsOfExperienceIds: yearsIds,
    startPage: 1,
  };
}

const SYSTEM_SCOUT_PROMPT = `You are an expert technical recruiter and data extractor. Your task is to analyze a provided job description and convert its requirements into a strict JSON search parameter payload for a LinkedIn candidate scraping API.

Instructions:
1. Analyze the Job Posting: Extract the core job title, required locations, target schools/companies (if explicitly mentioned), years of experience, function, and seniority level.
2. Map to IDs using the Reference Charts:
   Years ID Chart:
   - Less than 1 year: "1"
   - 1 to 2 years: "2"
   - 3 to 5 years: "3"
   - 6 to 10 years: "4"
   - More than 10 years: "5"
   Function ID Chart:
   - Accounting: "1", Administrative: "2", Arts and Design: "3", Business Development: "4", Community: "5", Consulting: "6", Education: "7", Engineering: "8", Entrepreneurship: "9", Finance: "10", Healthcare: "11", HR: "12", Information Technology: "13", Legal: "14", Marketing: "15", Media: "16", Military: "17", Operations: "18", Product Management: "19", Program/Project Management: "20", Purchasing: "21", QA: "22", Real Estate: "23", Research: "24", Sales: "25", Customer Success: "26"
   Seniority Level ID Chart:
   - In Training: "100", Entry Level: "110", Senior: "120", Strategic: "130", Entry Level Manager: "200", Experienced Manager: "210", Director: "220", Vice President: "300", CXO: "310", Owner / Partner: "320"
3. Handle Empty Fields: If criteria (pastCompanies, schools, etc.) is not mentioned, leave array empty [].
4. Output: Return ONLY raw JSON matching the ApifyScoutPayload structure. No markdown backticks, no explanations.`;

/**
 * Uses Gemini to parse a freeform Job Description into an Apify candidate search payload.
 */
export async function generateScoutPayloadWithGemini(
  jobDescription: string,
  options?: Partial<ScoutOptions>
): Promise<ApifyScoutPayload> {
  const fallback = buildScoutPayloadFromQuery({
    query: options?.query || jobDescription.slice(0, 60),
    jobDescription,
    location: options?.location,
    seniority: options?.seniority,
    maxItems: options?.maxItems ?? 5,
  });

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return fallback;
  }

  try {
    const { text } = await generateText({
      model: fastModel,
      system: SYSTEM_SCOUT_PROMPT,
      prompt: `Job Description to Analyze:\n${jobDescription}\n\nTarget Candidate Count: ${options?.maxItems ?? 5}`,
      temperature: 0.1,
    });

    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<ApifyScoutPayload>;

    return {
      autoQuerySegmentation: false,
      currentCompanies: Array.isArray(parsed.currentCompanies) ? parsed.currentCompanies : [],
      currentJobTitles: Array.isArray(parsed.currentJobTitles) ? parsed.currentJobTitles : [],
      functionIds: Array.isArray(parsed.functionIds) && parsed.functionIds.length > 0 ? parsed.functionIds : fallback.functionIds,
      locations: options?.location ? [options.location] : Array.isArray(parsed.locations) ? parsed.locations : [],
      maxItems: Math.min(Math.max(options?.maxItems ?? parsed.maxItems ?? 5, 1), 20),
      pastCompanies: Array.isArray(parsed.pastCompanies) ? parsed.pastCompanies : [],
      pastJobTitles: Array.isArray(parsed.pastJobTitles) ? parsed.pastJobTitles : [],
      profileScraperMode: "Full",
      recentlyChangedJobs: false,
      recentlyPostedOnLinkedIn: false,
      schools: Array.isArray(parsed.schools) ? parsed.schools : [],
      searchQuery: parsed.searchQuery?.trim() || fallback.searchQuery,
      seniorityLevelIds: Array.isArray(parsed.seniorityLevelIds) && parsed.seniorityLevelIds.length > 0 ? parsed.seniorityLevelIds : fallback.seniorityLevelIds,
      yearsAtCurrentCompanyIds: [],
      yearsOfExperienceIds: Array.isArray(parsed.yearsOfExperienceIds) && parsed.yearsOfExperienceIds.length > 0 ? parsed.yearsOfExperienceIds : fallback.yearsOfExperienceIds,
      startPage: 1,
    };
  } catch (error) {
    console.warn("[Scout Mapping] Gemini parsing failed; falling back to deterministic payload:", error);
    return fallback;
  }
}

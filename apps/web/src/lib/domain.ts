import { z } from "zod";

export type DomainId = "workforce_recruiting";

export interface DomainConfig {
  id: DomainId;
  labels: {
    product: string;
    tagline: string;
    singular: string;
    plural: string;
    categoryLabel: string;
    severityLabel: string;
    scoreLabel: string;
    createCta: string;
    titlePlaceholder: string;
    contentPlaceholder: string;
  };
  problem: string;
  solution: string;
  extractionHint: string;
  chatPersona: string;
  quickPrompts: string[];
  fieldsSchema: z.ZodType;
  preview: any;
}

export const CompetencySchema = z.object({
  label: z.string().describe("Competency name."),
  score: z.number().min(0).max(100).describe("Evidence-based rating from 0 to 100."),
});

export const RecruitmentFieldsSchema = z.object({
  strengths: z.array(z.string()).describe("Evidence-backed reasons this candidate is a good fit."),
  weaknesses: z.array(z.string()).describe("Missing skills, risks, or gaps to discuss."),
  verdict: z.string().describe("A concise hiring recommendation for this candidate."),
  yearsOfExperience: z.number().nonnegative().optional().describe("Estimated total years of relevant experience."),
  competencies: z
    .array(CompetencySchema)
    .optional()
    .describe(
      "Four ratings, in this order with these exact labels: Technical depth, System architecture, Modern frontend, Collaboration & execution. Base each on evidence in the profile and keep them broadly consistent with the overall score.",
    ),
});

export const workforce_recruiting: DomainConfig = {
  id: "workforce_recruiting",
  labels: {
    product: "TalentRank AI",
    tagline: "Automated candidate evaluation and ranking for recruiters.",
    singular: "Candidate",
    plural: "Candidates",
    categoryLabel: "Role Fit",
    severityLabel: "Priority",
    scoreLabel: "Match Score",
    createCta: "Evaluate Profile",
    titlePlaceholder: "e.g. Jane Doe - Senior Frontend Engineer",
    contentPlaceholder: "Paste the raw LinkedIn profile text here...",
  },
  problem: "Reviewing hundreds of scraped profiles to find the perfect candidate is entirely manual and biased.",
  solution: "AI instantly reads the profile, scores it 0-100 against exact job requirements, and highlights red flags.",
  
  // 👉 THE PROMPT GUY WILL EDIT THIS LATER WITH THE EXACT JOB REQUIREMENTS
  extractionHint: `
    You are an expert Principal Technical Recruiter and Staff Hiring Lead evaluating candidates for a Senior React/Next.js Engineer role in EdTech.

    EVALUATION PRINCIPLES:
    1. Base all evaluations strictly on verified claims and evidence in the text. Do not invent facts or assume unstated skills.
    2. Holistic & Proportionate Scoring: Software engineers with relevant skills (e.g. Next.js, React, Flutter, Python, TypeScript, Web Development) possess genuine engineering foundations. Award proportionate technical points (25-45 pts) rather than giving an abrupt zero score.
    3. Reserve 0-19 strictly for completely irrelevant, non-technical, or spam profiles (e.g. non-software domains).
    4. Provide constructive, insightful verdicts that highlight both verified technical strengths and specific seniority gaps required for this role.

    CALIBRATED SCORING BREAKDOWN (0 - 100):
    1. Core Technical Stack & Frontend Competencies (up to 40 points):
       - 3+ years production React/Next.js: 35-40 pts.
       - 1.5 - 3 years React/Next.js or strong TypeScript frontend: 25-34 pts.
       - 1 - 1.5 years React/Next.js, or adjacent modern application frameworks (Flutter, Python full-stack, Web Development): 15-24 pts.
       - Foundational programming & software baseline: 5-14 pts.
    2. Engineering Depth, Scale & Architecture (up to 25 points):
       - Distributed cloud architecture, serverless, microservices, or high-scale systems: 20-25 pts.
       - Practical API development, scraping, backend logic, state architecture, or testing: 10-19 pts.
       - Standard web application implementation: 5-9 pts.
    3. Domain & Transferable Alignment (up to 20 points):
       - Direct EdTech / educational technology platform background: 15-20 pts.
       - Interactive SaaS, consumer web, mobile apps, or digital products: 8-14 pts.
       - Transferable engineering experience: 3-7 pts.
    4. Career Trajectory, Education & Stability (up to 15 points):
       - Computer Science degree, continuous professional learning, or steady career growth: 10-15 pts.
       - Deduct up to 15 points only if there is unexplained, severe job-hopping (multiple tenures under 6 months).

    CATEGORIZATION BENCHMARKS:
    - 'Strong Fit' (80-100): Senior engineer meeting or exceeding core stack and domain requirements. Severity: 'high' or 'critical'. Verdict must clearly recommend interviewing.
    - 'Potential' (50-79): Capable engineer with strong technical foundations; suitable for mid-level or with targeted upskilling in scale/EdTech. Severity: 'medium'. Verdict must note conditional / mid-level fit.
    - 'Unqualified' (0-49): Junior profile (e.g. 1-2 yrs) or stack mismatch for Senior level; clearly acknowledge their actual skills while noting seniority gaps. Severity: 'low'. Verdict must state seniority mismatch.

    CONSISTENCY REQUIREMENT:
    The 'score', 'category', and 'verdict' MUST BE 100% MUTUALLY CONSISTENT:
    - If verdict is positive / recommend interview -> score must be >= 80 and category 'Strong Fit'.
    - If verdict indicates conditional / mid-level fit -> score must be between 50 and 79 and category 'Potential'.
    - If verdict indicates unqualified / seniority mismatch -> score must be < 50 and category 'Unqualified'.

    COMPETENCY BREAKDOWN:
    Also return 'competencies': four 0-100 ratings labeled exactly "Technical depth", "System architecture", "Modern frontend" and "Collaboration & execution". Base each strictly on evidence in the profile; where evidence is thin, give a lower rating rather than a guess. Keep them broadly consistent with the overall score.
  `,
  chatPersona: "You are an executive Technical Talent Lead and Staff Engineer advising hiring managers. Provide thorough, articulate, and insightful analysis of candidate experience, technical claims, strengths, gaps, and growth trajectory. Structure your answers with clear headings, clean bullet points, bold key terms, and actionable interview probing suggestions. When citing sources, integrate citations seamlessly and ground all observations in evidence.",
  quickPrompts: [
    "Summarize this candidate's strongest technical skills.",
    "Are there any red flags or employment gaps?",
    "How does this candidate compare to the core job requirements?",
  ],
  fieldsSchema: RecruitmentFieldsSchema,
  preview: {
    title: "Jane Doe - Senior React Dev",
    severity: "low",
    score: 92,
    summary: "Senior engineer with 5 years of Next.js experience and a previous stint at Coursera.",
    tags: ["react", "nextjs", "edtech"],
    fields: {
      strengths: ["5 years building with Next.js", "Previous experience in education technology"],
      weaknesses: ["Cloud architecture ownership is not clear from the profile"],
      verdict: "Strong fit — invite to a technical interview.",
      yearsOfExperience: 5,
      competencies: [
        { label: "Technical depth", score: 90 },
        { label: "System architecture", score: 78 },
        { label: "Modern frontend", score: 94 },
        { label: "Collaboration & execution", score: 86 },
      ],
    },
    question: "Should we interview Jane?",
    answer: "Yes. Her experience at Coursera perfectly aligns with our EdTech requirements and she exceeds the 3-year Next.js baseline. Schedule a technical screen.",
    cite: "Profile: Jane Doe",
  },
};

export const DOMAINS: Record<DomainId, DomainConfig> = { workforce_recruiting };
export const ACTIVE_DOMAIN_ID: DomainId = "workforce_recruiting";
export const domain: DomainConfig = DOMAINS[ACTIVE_DOMAIN_ID];

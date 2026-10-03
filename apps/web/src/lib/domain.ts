import { z } from "zod";
import { SeveritySchema, type Severity } from "@/lib/contracts";

/**
 * DOMAIN REGISTRY — the one file to edit when the product idea changes.
 *
 * Flip ACTIVE_DOMAIN_ID at the bottom and the labels, extraction fields, chat persona,
 * quick prompts, landing copy and dashboard wording all follow.
 * Client-safe (no server imports): used by Server and Client Components.
 */

export type DomainId = "generic" | "contracts" | "meetings" | "tickets";

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
  /** Appended to EXTRACTION_PROMPT: what severity/score/fields mean in this domain. */
  extractionHint: string;
  /** Appended to SYSTEM_PROMPT: tone and guardrails. Chat UI renders plain text, so no markdown. */
  chatPersona: string;
  quickPrompts: string[];
  /** Domain-specific extraction payload stored in Item.fields. Keep every key optional. */
  fieldsSchema: z.ZodType;
  /** Static sample for the landing-page preview card. */
  preview: {
    title: string;
    severity: Severity;
    score: number;
    summary: string;
    tags: string[];
    question: string;
    answer: string;
    cite: string;
  };
}

const PLAIN_TEXT_RULE =
  "Write short paragraphs and simple '-' bullets. Do not use markdown headers, tables, or bold: the chat renders plain text.";

const generic: DomainConfig = {
  id: "generic",
  labels: {
    product: "App-agnostic AI foundation",
    tagline:
      "Auth, vector search, structured extraction and streaming chat, wired together and ready for your idea.",
    singular: "Item",
    plural: "Items",
    categoryLabel: "Category",
    severityLabel: "Priority",
    scoreLabel: "Score",
    createCta: "Create and analyze",
    titlePlaceholder: "e.g. Q3 planning overview",
    contentPlaceholder: "Paste notes, specs, or any text to analyze...",
  },
  problem:
    "Most hackathon time goes to plumbing: auth, storage, retrieval, streaming. Little is left for the idea.",
  solution:
    "Paste any text. It is summarized, tagged, scored, embedded and made searchable, and you can chat with it with sources cited.",
  extractionHint:
    "severity = how urgent or important the item is. score = 0-100 overall importance. Put 3-5 key points in fields.keyPoints.",
  chatPersona: `Be concise and practical. ${PLAIN_TEXT_RULE}`,
  quickPrompts: [
    "Summarize this in bullet points.",
    "What are the key action items?",
    "Which items are highest priority?",
  ],
  fieldsSchema: z.object({
    keyPoints: z.array(z.string()).describe("3-5 key points").optional(),
  }),
  preview: {
    title: "Q3 planning overview",
    severity: "medium",
    score: 62,
    summary: "Roadmap priorities for Q3 with two unresolved staffing risks.",
    tags: ["planning", "roadmap", "staffing"],
    question: "What are the staffing risks?",
    answer: "Two roles are unfilled before the launch window, and one depends on a contractor start date.",
    cite: "Q3 planning overview",
  },
};

const contracts: DomainConfig = {
  id: "contracts",
  labels: {
    product: "Contract Risk Radar",
    tagline: "Paste a contract and see what you are really agreeing to, clause by clause, before you sign.",
    singular: "Contract",
    plural: "Contracts",
    categoryLabel: "Type",
    severityLabel: "Risk",
    scoreLabel: "Risk score",
    createCta: "Analyze contract",
    titlePlaceholder: "e.g. Acme Cloud SaaS agreement",
    contentPlaceholder: "Paste the contract text here...",
  },
  problem:
    "Freelancers and small teams sign vendor contracts without a lawyer and miss auto-renewals, liability caps and one-sided termination terms.",
  solution:
    "Every clause is rated for risk and explained in plain English. A risk score, renewal date and notice period are pulled out, and you can ask questions with the exact clause cited.",
  extractionHint:
    "severity = overall contract risk to the signer. score = 0-100 risk (0 safe, 100 dangerous). Fill fields.clauses with the most consequential clauses (max 8), each with a short verbatim quote. Dates must be ISO (YYYY-MM-DD).",
  chatPersona: `You are a careful contract analyst for non-lawyers. Explain in plain English and quote the relevant clause. State once, briefly, that this is not legal advice. ${PLAIN_TEXT_RULE}`,
  quickPrompts: [
    "What are the biggest risks in this contract?",
    "When does it renew and how do I cancel?",
    "Which contract is riskiest overall?",
  ],
  fieldsSchema: z.object({
    contractType: z.string().describe("e.g. SaaS agreement, NDA, lease, freelance").optional(),
    parties: z.array(z.string()).optional(),
    autoRenews: z.boolean().optional(),
    renewalDate: z.string().describe("ISO date or empty string if unknown").optional(),
    noticePeriodDays: z.coerce.number().optional(),
    clauses: z
      .array(
        z.object({
          heading: z.string(),
          quote: z.string().describe("Short verbatim excerpt, under 200 characters"),
          category: z
            .enum(["termination", "liability", "payment", "renewal", "ip", "confidentiality", "other"])
            .catch("other"),
          severity: SeveritySchema.catch("medium"),
          explanation: z.string().describe("Why this matters, in one plain-English sentence"),
        })
      )
      .max(8)
      .optional(),
  }),
  preview: {
    title: "Acme Cloud SaaS agreement (sample)",
    severity: "high",
    score: 78,
    summary: "Auto-renews for 12 months and caps vendor liability at one month of fees.",
    tags: ["auto-renewal", "liability-cap", "saas"],
    question: "What happens if I cancel in month 3?",
    answer:
      "Cancelling mid-term does not end your obligation: fees stay due until the term ends unless you give 90 days' notice before renewal.",
    cite: "Term and renewal",
  },
};

const meetings: DomainConfig = {
  id: "meetings",
  labels: {
    product: "Meeting action engine",
    tagline: "Turn a messy transcript into decisions, owners and due dates in seconds.",
    singular: "Meeting",
    plural: "Meetings",
    categoryLabel: "Meeting type",
    severityLabel: "Urgency",
    scoreLabel: "Action clarity",
    createCta: "Extract actions",
    titlePlaceholder: "e.g. Pricing sync, Oct 1",
    contentPlaceholder: "Paste the meeting transcript or notes here...",
  },
  problem: "Teams leave meetings with decisions nobody wrote down and action items with no owner or date.",
  solution:
    "Decisions and action items are extracted with owners and due dates, gaps are flagged, and you can ask what was decided across every past meeting.",
  extractionHint:
    "severity = urgency of follow-up. score = 0-100 action clarity (100 means every action has an owner and a date). Use empty strings for unknown owners or dates.",
  chatPersona: `You are a chief of staff. Be direct about who owns what and what is still unowned. ${PLAIN_TEXT_RULE}`,
  quickPrompts: ["What did we decide?", "Which actions have no owner?", "What is due this week?"],
  fieldsSchema: z.object({
    attendees: z.array(z.string()).optional(),
    decisions: z.array(z.string()).optional(),
    actionItems: z
      .array(
        z.object({
          task: z.string(),
          owner: z.string().describe("Empty string if nobody was assigned"),
          due: z.string().describe("ISO date or empty string"),
          priority: SeveritySchema.catch("medium"),
        })
      )
      .optional(),
  }),
  preview: {
    title: "Pricing sync, Oct 1 (sample)",
    severity: "medium",
    score: 71,
    summary: "Agreed to pilot usage-based pricing. Four actions, two without owners.",
    tags: ["pricing", "pilot", "follow-ups"],
    question: "Who owns the pricing follow-ups?",
    answer: "Dana owns the competitor benchmark, due Friday. The migration FAQ has no owner yet.",
    cite: "Pricing sync, Oct 1",
  },
};

const tickets: DomainConfig = {
  id: "tickets",
  labels: {
    product: "Support triage copilot",
    tagline: "Classify every ticket, rank urgency, and draft a reply grounded in how similar tickets were solved.",
    singular: "Ticket",
    plural: "Tickets",
    categoryLabel: "Category",
    severityLabel: "Urgency",
    scoreLabel: "Escalation score",
    createCta: "Triage ticket",
    titlePlaceholder: "e.g. Charged twice after upgrade",
    contentPlaceholder: "Paste the customer message here...",
  },
  problem: "Support agents drown in tickets and keep re-answering questions that earlier tickets already solved.",
  solution:
    "Each ticket is categorized, rated for urgency and sentiment, and answered with a drafted reply that cites similar resolved tickets.",
  extractionHint:
    "severity = urgency. score = 0-100 likelihood the ticket needs escalation. Draft a short, polite fields.suggestedReply.",
  chatPersona: `You are a support lead. Be empathetic and concrete, and base replies on resolved tickets when sources exist. Never promise refunds or credits that the sources do not support. ${PLAIN_TEXT_RULE}`,
  quickPrompts: [
    "Draft a reply to this ticket.",
    "Have we solved this before?",
    "Which tickets should be escalated?",
  ],
  fieldsSchema: z.object({
    customerSentiment: z.enum(["positive", "neutral", "frustrated", "angry"]).catch("neutral").optional(),
    product: z.string().optional(),
    needsEscalation: z.boolean().optional(),
    suggestedReply: z.string().optional(),
  }),
  preview: {
    title: "Charged twice after upgrade (sample)",
    severity: "high",
    score: 84,
    summary: "Customer was billed twice after a plan upgrade and is asking for a refund.",
    tags: ["billing", "refund", "duplicate-charge"],
    question: "Draft a reply.",
    answer:
      "Apologize, confirm the duplicate charge, and refund within 3-5 business days, as in the earlier resolved billing ticket.",
    cite: "Ticket 1042",
  },
};

export const DOMAINS: Record<DomainId, DomainConfig> = { generic, contracts, meetings, tickets };

/** One-line switch: "generic" | "contracts" | "meetings" | "tickets". */
export const ACTIVE_DOMAIN_ID: DomainId = "generic";

export const domain: DomainConfig = DOMAINS[ACTIVE_DOMAIN_ID];

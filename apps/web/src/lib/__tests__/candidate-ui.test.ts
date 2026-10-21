import { describe, it, expect } from "vitest";
import {
  extractLinkedInUrl,
  cleanCandidateProfileText,
  candidateDisplayName,
  extractHeadline,
  formatYears,
  getScoreStyle,
} from "@/lib/candidate-ui";

describe("extractLinkedInUrl", () => {
  it("extracts canonical LinkedIn URL from standard https URL", () => {
    const text = "Candidate profile: https://www.linkedin.com/in/muhammad-ahmed-123";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/muhammad-ahmed-123");
  });

  it("extracts URL with country subdomain and strips trailing slash", () => {
    const text = "Connect with me at https://pk.linkedin.com/in/johndoe/";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/johndoe");
  });

  it("extracts URL without protocol and strips query tracking params", () => {
    const text = "Check out linkedin.com/in/jane-doe-phd?utm_source=share&utm_medium=member_android";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/jane-doe-phd");
  });

  it("handles URLs enclosed in parentheses or punctuation in resumes", () => {
    const text = "Resume header: (linkedin.com/in/alex-smith-dev), Email: alex@example.com.";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/alex-smith-dev");
  });

  it("handles PDF export multiline formatting with column breaks", () => {
    const text = "Contact\nwww.linkedin.com/in/\nmyahyashahzad (LinkedIn)\nTop Skills";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/myahyashahzad");
  });

  it("resolves team member LinkedIn profile when name is in text/title", () => {
    const text = "Muhammad Ahmed Asif - LinkedIn Profile\nCS @ NUST";
    expect(extractLinkedInUrl(text)).toBe("https://www.linkedin.com/in/muhammad-ahmed-asif-5b0842318");
  });

  it("returns undefined when no LinkedIn URL or recognized profile is present", () => {
    expect(extractLinkedInUrl("Just some resume text without links")).toBeUndefined();
    expect(extractLinkedInUrl(null)).toBeUndefined();
    expect(extractLinkedInUrl("")).toBeUndefined();
    expect(extractLinkedInUrl("https://github.com/myusername")).toBeUndefined();
  });
});

describe("cleanCandidateProfileText", () => {
  it("strips common LinkedIn boilerplate lines and tracking queries", () => {
    const raw = `
      Skip to main content
      John Doe
      Headline: Senior Engineer
      Sign in
      Connect
      Experience: 5 years at TechCorp
      See all 24 skills
    `;
    const cleaned = cleanCandidateProfileText(raw);
    expect(cleaned).toContain("John Doe");
    expect(cleaned).toContain("Headline: Senior Engineer");
    expect(cleaned).toContain("Experience: 5 years at TechCorp");
    expect(cleaned).not.toContain("Skip to main content");
    expect(cleaned).not.toContain("Sign in");
    expect(cleaned).not.toContain("See all 24 skills");
  });
});

describe("candidate presentation helpers", () => {
  it("candidateDisplayName removes '- LinkedIn Profile' suffix", () => {
    expect(candidateDisplayName("Mahad Hashmi - LinkedIn Profile")).toBe("Mahad Hashmi");
    expect(candidateDisplayName("Muhammad Ahmed")).toBe("Muhammad Ahmed");
  });

  it("extractHeadline extracts Headline line correctly", () => {
    const content = "Name: John Doe\nHeadline: Senior Full Stack Architect\nExperience: ...";
    expect(extractHeadline(content)).toBe("Senior Full Stack Architect");
  });

  it("formatYears formats integers and decimals cleanly", () => {
    expect(formatYears(5)).toBe("5");
    expect(formatYears(6.5)).toBe("6.5");
  });

  it("getScoreStyle gives appropriate style bands", () => {
    expect(getScoreStyle(92).label).toBe("Strong Fit");
    expect(getScoreStyle(68).label).toBe("Potential");
    expect(getScoreStyle(45).label).toBe("Unqualified");
    expect(getScoreStyle(null).label).toBe("Unscored");
  });
});

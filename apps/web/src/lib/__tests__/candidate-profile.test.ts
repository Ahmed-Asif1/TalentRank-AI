import { describe, it, expect } from "vitest";
import { linkedinSectionLinks, parseProfileText } from "@/lib/candidate-profile";

const SOURCED = `Name: Ana Lee
Headline: Senior React Engineer
Location: Lahore, Pakistan
Open to work: yes
Summary: Builds fintech dashboards.

Experience:
- Senior Engineer at PayCo (Jan 2022 to Present) · Full-time, Hybrid
  Owns the merchant dashboard.
- Frontend Developer at Acme (Jun 2019 to Dec 2021)

Education:
- BS, Computer Science at FAST (2015 - 2019)

Skills:
React, Next.js, TypeScript, React

Certifications:
- AWS Developer (Amazon)

Languages: English (Full professional proficiency), Urdu (Native or bilingual proficiency)`;

describe("parseProfileText", () => {
  it("parses every section of the sourced-profile format", () => {
    const p = parseProfileText(SOURCED);
    expect(p).toMatchObject({ headline: "Senior React Engineer", location: "Lahore, Pakistan", openToWork: true, structured: true });
    expect(p.experience[0]).toEqual({
      title: "Senior Engineer",
      company: "PayCo",
      start: "Jan 2022",
      end: "Present",
      meta: "Full-time, Hybrid",
      description: "Owns the merchant dashboard.",
    });
    expect(p.experience[1]).toMatchObject({ title: "Frontend Developer", company: "Acme", end: "Dec 2021" });
    expect(p.education).toEqual([{ degree: "BS, Computer Science", school: "FAST", period: "2015 - 2019" }]);
    expect(p.skills).toEqual(["React", "Next.js", "TypeScript"]);
    expect(p.certifications).toEqual(["AWS Developer (Amazon)"]);
    expect(p.languages).toHaveLength(2);
  });

  it("treats free text without sections as unstructured", () => {
    const p = parseProfileText("John Smith\nJava developer with 5 years of experience.");
    expect(p.structured).toBe(false);
    expect(p.experience).toEqual([]);
  });

  it("handles empty content", () => {
    expect(parseProfileText(undefined).structured).toBe(false);
  });
});

describe("linkedinSectionLinks", () => {
  it("builds section deep links from a profile URL", () => {
    const links = linkedinSectionLinks("https://www.linkedin.com/in/ana-lee");
    expect(links.map((l) => l.href)).toContain("https://www.linkedin.com/in/ana-lee/details/experience/");
    expect(links.map((l) => l.href)).toContain("https://www.linkedin.com/in/ana-lee/recent-activity/all/");
  });
});

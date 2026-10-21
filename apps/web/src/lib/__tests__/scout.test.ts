import { describe, it, expect } from "vitest";
import {
  YEARS_ID_MAP,
  FUNCTION_ID_MAP,
  SENIORITY_LEVEL_ID_MAP,
  buildScoutPayloadFromQuery,
  generateScoutPayloadWithGemini,
} from "@/lib/scout/mapping";
import { formatApifyProfileToRawText } from "@/lib/scout/service";

describe("Apify Scout Mapping & Reference Charts", () => {
  it("contains valid IDs for experience years according to Mahad's specification", () => {
    expect(YEARS_ID_MAP.LESS_THAN_1_YEAR).toBe("1");
    expect(YEARS_ID_MAP.ONE_TO_TWO_YEARS).toBe("2");
    expect(YEARS_ID_MAP.THREE_TO_FIVE_YEARS).toBe("3");
    expect(YEARS_ID_MAP.SIX_TO_TEN_YEARS).toBe("4");
    expect(YEARS_ID_MAP.MORE_THAN_10_YEARS).toBe("5");
  });

  it("contains valid function IDs for engineering and IT", () => {
    expect(FUNCTION_ID_MAP.engineering).toBe("8");
    expect(FUNCTION_ID_MAP.software).toBe("8");
    expect(FUNCTION_ID_MAP["information technology"]).toBe("13");
    expect(FUNCTION_ID_MAP["product management"]).toBe("19");
  });

  it("contains valid seniority IDs for entry, senior, and manager", () => {
    expect(SENIORITY_LEVEL_ID_MAP.junior).toBe("110");
    expect(SENIORITY_LEVEL_ID_MAP.senior).toBe("120");
    expect(SENIORITY_LEVEL_ID_MAP.manager).toBe("200");
    expect(SENIORITY_LEVEL_ID_MAP.director).toBe("220");
  });

  describe("buildScoutPayloadFromQuery", () => {
    it("builds a senior engineering payload by default", () => {
      const payload = buildScoutPayloadFromQuery({
        query: "Senior React Engineer",
        location: "San Francisco",
        maxItems: 5,
      });

      expect(payload.searchQuery).toBe("Senior React Engineer");
      expect(payload.locations).toEqual(["San Francisco"]);
      expect(payload.functionIds).toContain("8"); // Engineering
      expect(payload.seniorityLevelIds).toContain("120"); // Senior
      expect(payload.maxItems).toBe(5);
      expect(payload.profileScraperMode).toBe("Full");
    });

    it("maps junior seniority and experience years appropriately", () => {
      const payload = buildScoutPayloadFromQuery({
        query: "Junior Frontend Developer",
        seniority: "junior",
        maxItems: 3,
      });

      expect(payload.seniorityLevelIds).toContain("110");
      expect(payload.yearsOfExperienceIds).toEqual(["1", "2"]);
      expect(payload.maxItems).toBe(3);
    });

    it("clamps candidate count within safe bounds [1, 20]", () => {
      const low = buildScoutPayloadFromQuery({ maxItems: 0 });
      expect(low.maxItems).toBe(1);

      const high = buildScoutPayloadFromQuery({ maxItems: 100 });
      expect(high.maxItems).toBe(20);
    });
  });

  describe("formatApifyProfileToRawText", () => {
    it("transforms Apify LinkedIn profile into clean candidate resume text", () => {
      const sampleItem = {
        firstName: "Muhammad",
        lastName: "Hammad Afzal",
        publicIdentifier: "mhammad33",
        linkedinUrl: "https://www.linkedin.com/in/mhammad33",
        headline: "Full-Stack Software Engineer | React, Next.js, Node.js",
        location: {
          parsed: { text: "Islamabad, Pakistan" },
        },
        about: "Passionate developer building high-performance web apps.",
        experience: [
          {
            position: "Software Engineer",
            companyName: "We.R.Play",
            duration: "2 yrs",
            description: "Building scalable web tools with Next.js",
          },
        ],
        educations: [
          {
            schoolName: "FAST NUCES",
            degree: "BS",
            fieldOfStudy: "Computer Science",
          },
        ],
        skills: ["React", "Next.js", "TypeScript", "Node.js"],
      };

      const result = formatApifyProfileToRawText(sampleItem);

      expect(result.name).toBe("Muhammad Hammad Afzal");
      expect(result.linkedinUrl).toBe("https://www.linkedin.com/in/mhammad33");
      expect(result.rawText).toContain("Candidate: Muhammad Hammad Afzal");
      expect(result.rawText).toContain("LinkedIn: https://www.linkedin.com/in/mhammad33");
      expect(result.rawText).toContain("Software Engineer at We.R.Play");
      expect(result.rawText).toContain("FAST NUCES");
      expect(result.rawText).toContain("React, Next.js, TypeScript, Node.js");
    });
  });

  describe("generateScoutPayloadWithGemini", () => {
    it("falls back gracefully to deterministic query payload when offline", async () => {
      const payload = await generateScoutPayloadWithGemini(
        "We are looking for a Senior React / Next.js Engineer with 5+ years experience in building high scale frontend platforms.",
        { maxItems: 4 }
      );

      expect(payload.searchQuery).toBeDefined();
      expect(payload.maxItems).toBe(4);
      expect(payload.functionIds).toContain("8");
    });
  });
});

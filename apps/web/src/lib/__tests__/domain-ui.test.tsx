import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";
import { DOMAINS } from "@/lib/domain";
import { CitedText } from "@/components/ai/cited-text";
import { FieldsPanel } from "@/components/domain/fields-panel";
import { SeverityBadge } from "@/components/domain/severity-badge";
import { createTools } from "@/lib/ai/tools";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
// db.ts connects at import time; tools/process import it transitively
vi.mock("@/lib/db", () => ({ connectMongoose: vi.fn(), connectToDatabase: vi.fn(), getRawDb: vi.fn() }));

describe("domain field schemas accept realistic and sloppy LLM output", () => {
  it("workforce_recruiting", () => {
    const r = DOMAINS.workforce_recruiting.fieldsSchema.safeParse({
      strengths: ["a", "b"],
      weaknesses: ["c"],
      verdict: "Strong fit",
      yearsOfExperience: 5
    });
    expect(r.success).toBe(true);
  });
});

describe("components", () => {
  it("CitedText turns markers into links and hides an unfinished one", () => {
    const html = renderToStaticMarkup(<CitedText text="Renews yearly [[item:65f0a1b2c3d4e5f600000001|Acme MSA]] ok [[item:65f0" />);
    expect(html).toContain('href="/items/65f0a1b2c3d4e5f600000001"');
    expect(html).toContain(">Acme MSA<");
    expect(html).not.toContain("[[item:65f0");
  });
  it("FieldsPanel renders nested arrays and returns nothing when empty", () => {
    expect(renderToStaticMarkup(<FieldsPanel fields={{}} />)).toBe("");
    const html = renderToStaticMarkup(<FieldsPanel fields={{ autoRenews: true, clauses: [{ heading: "Term", severity: "high" }, null], empty: "" }} />);
    expect(html).toContain("Auto Renews");
    expect(html).toContain("Yes");
    expect(html).toContain("Term");
  });
  it("SeverityBadge shows text, not just colour", () => {
    expect(renderToStaticMarkup(<SeverityBadge severity="critical" />)).toContain("critical");
    expect(renderToStaticMarkup(<SeverityBadge />)).toContain("Not rated");
  });
});

describe("createTools", () => {
  it("exposes five owner-scoped tools; getItem rejects invalid ids without touching the DB", async () => {
    const t = createTools("user-1");
    expect(Object.keys(t).sort()).toEqual(["compareItems", "createItem", "getItem", "getPortfolioStats", "searchItems"]);
    const out = await (t.getItem.execute as (a: { id: string }, o: unknown) => Promise<unknown>)({ id: "not-an-id" }, {});
    expect(out).toEqual({ item: null });
    expect(z.toJSONSchema(t.compareItems.inputSchema as z.ZodType)).toBeTruthy();
  });
});

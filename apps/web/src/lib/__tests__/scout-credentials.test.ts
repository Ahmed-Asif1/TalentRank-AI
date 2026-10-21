import { afterEach, describe, expect, it, vi } from "vitest";
import { ApifyClient } from "apify-client";
import { executeScoutPipeline } from "@/lib/scout/service";
import { ItemModel } from "@/lib/models";
import { buildScoutPayloadFromQuery } from "@/lib/scout/mapping";

vi.mock("apify-client", () => ({ ApifyClient: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { APIFY_API_TOKEN: "" } }));
vi.mock("@/lib/items/process", () => ({ processItem: vi.fn() }));
vi.mock("@/lib/models", () => ({
  ItemModel: {
    create: vi.fn(async () => ({ _id: "fixture-candidate" })),
    findById: vi.fn(() => ({ lean: async () => ({ fields: {} }) })),
  },
}));

afterEach(() => vi.restoreAllMocks());

describe("Scout credential handling", () => {
  it("uses the existing sample fallback without creating an API client when no token is configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const results = await executeScoutPipeline({
      ownerId: "fixture-owner",
      payload: buildScoutPayloadFromQuery({ query: "Engineer", maxItems: 1 }),
    });
    expect(ApifyClient).not.toHaveBeenCalled();
    expect(ItemModel.create).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("fixture-candidate");
  });
});

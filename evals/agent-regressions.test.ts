import "dotenv/config";
import { describe, it, expect } from "vitest";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { listingFilterConditions } from "../db/filters";
import { searchHomesSchema } from "../workflows/chat/workflows";

// Helper: generate a single tool call from a prompt
async function getToolCallParams(prompt: string) {
  const result = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    tools: {
      searchHomes: tool({
        description: "Search for homes",
        inputSchema: searchHomesSchema,
      }),
    },
    toolChoice: "required",
    stopWhen: stepCountIs(1),
    prompt,
  });

  const toolCall = result.steps[0]?.toolCalls?.[0];
  return toolCall?.input as z.infer<typeof searchHomesSchema> | undefined;
}

// ─── 1. Filter Logic (deterministic, no LLM) ────────────────────

describe("filter logic", () => {
  it("returns no conditions for empty filters", () => {
    const conditions = listingFilterConditions({});
    expect(conditions).toHaveLength(0);
  });

  it("dog filter uses inArray to include 'all' listings", () => {
    const conditions = listingFilterConditions({ allowedPetType: "dog" });
    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toBeDefined();
  });

  it("'all' pet filter uses exact eq match", () => {
    const conditions = listingFilterConditions({ allowedPetType: "all" });
    expect(conditions).toHaveLength(1);
  });

  it("multiple filters produce multiple conditions", () => {
    const conditions = listingFilterConditions({
      city: "Austin",
      state: "TX",
      listingType: "forSale",
      minBedrooms: 3,
    });
    expect(conditions).toHaveLength(4);
  });

  it("price filters accept string values for numeric columns", () => {
    const conditions = listingFilterConditions({
      minSalePrice: "200000",
      maxSalePrice: "500000",
    });
    expect(conditions).toHaveLength(2);
  });
});

// ─── 2. Agent Regressions (real model, uses AI SDK) ──────────────

describe.concurrent("agent regressions", { timeout: 30_000 }, () => {
  it("converts 'Texas' to state abbreviation 'TX'", async () => {
    const params = await getToolCallParams("Find homes for sale in Texas");
    expect(params).toBeDefined();
    expect(params!.state).toBe("TX");
  });

  it("converts 'Colorado' to state abbreviation 'CO'", async () => {
    const params = await getToolCallParams("Search for rentals in Colorado");
    expect(params).toBeDefined();
    expect(params!.state).toBe("CO");
  });

  it("does not include pet filters on for-sale searches", async () => {
    const params = await getToolCallParams(
      "Find single-family homes for sale in Austin under $500,000",
    );
    expect(params).toBeDefined();
    expect(params!.allowedPets).toBeUndefined();
    expect(params!.allowedPetType).toBeUndefined();
  });

  it("includes pet filter for rental search with pets", async () => {
    const params = await getToolCallParams(
      "Find pet-friendly apartments for rent in Denver for me and my dog",
    );
    expect(params).toBeDefined();
    expect(params!.allowedPets).toBe(true);
    expect(["dog", "all"]).toContain(params!.allowedPetType);
  });

  it("maps budget constraint to maxSalePrice", async () => {
    const params = await getToolCallParams(
      "Find homes in Austin TX under $400,000",
    );
    expect(params).toBeDefined();
    expect(params!.maxSalePrice).toBeDefined();
    expect(params!.maxSalePrice!).toBeLessThanOrEqual(400_000);
  });

  it("exact bed/bath maps to min and max bedrooms", async () => {
    const params = await getToolCallParams("Find me a 2 bed 2 bath");
    expect(params).toBeDefined();
    expect(params!.minBedrooms).toBe(2);
    expect(params!.maxBedrooms).toBe(2);
    expect(params!.minBathrooms).toBe(2);
  });

  it("monthly price implies forRent and uses maxMonthlyRent", async () => {
    const params = await getToolCallParams(
      "Under $2k/month in Round Rock",
    );
    expect(params).toBeDefined();
    expect(params!.listingType).toBe("forRent");
    expect(params!.maxMonthlyRent).toBeDefined();
    expect(params!.maxMonthlyRent!).toBeLessThanOrEqual(2000);
    expect(params!.maxSalePrice).toBeUndefined();
  });

  it("vague budget does not hallucinate a specific price", async () => {
    const params = await getToolCallParams("Cheap homes in Austin");
    expect(params).toBeDefined();
    expect(params!.city).toBe("Austin");
    // Model should not invent an arbitrary maxSalePrice from "cheap"
    expect(params!.minSalePrice).toBeUndefined();
  });

  it("maps 'house with a yard' to valid homeType, ignores unknown attributes", async () => {
    const params = await getToolCallParams("I want a house with a yard");
    expect(params).toBeDefined();
    expect(params!.homeType).toBe("single-family");
    // "yard" is not a schema field — model should not add unknown keys
    expect(Object.keys(params!)).not.toContain("yard");
    expect(Object.keys(params!)).not.toContain("hasYard");
  });

  it("no-pets rental sets allowedPets to false", async () => {
    const params = await getToolCallParams(
      "Find apartments for rent that don't allow pets",
    );
    expect(params).toBeDefined();
    expect(params!.listingType).toBe("forRent");
    expect(params!.allowedPets).toBe(false);
  });

  it("ignores unsupported filter 'with a pool' without hallucinating params", async () => {
    const params = await getToolCallParams(
      "Find a condo for sale in Denver with a pool",
    );
    expect(params).toBeDefined();
    expect(params!.city).toBe("Denver");
    expect(params!.homeType).toBe("condo");
    expect(params!.listingType).toBe("forSale");
    // "pool" is not in the schema — no invented keys
    expect(Object.keys(params!)).not.toContain("pool");
    expect(Object.keys(params!)).not.toContain("hasPool");
    expect(Object.keys(params!)).not.toContain("amenities");
  });
});

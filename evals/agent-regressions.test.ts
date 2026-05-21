import "dotenv/config";
import { describe, it, expect } from "vitest";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { listingFilterConditions } from "../db/filters";
import { searchHomesSchema } from "../workflows/chat/workflows";
import {
  buildPersonaInstructions,
  shouldDisableTools,
} from "../lib/agents/search-agent";

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

  it("cat filter uses inArray to include 'all' listings", () => {
    const conditions = listingFilterConditions({ allowedPetType: "cat" });
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

  it("status filter produces a condition for single value", () => {
    const conditions = listingFilterConditions({ status: "active" });
    expect(conditions).toHaveLength(1);
  });

  it("status filter produces a condition for array of values", () => {
    const conditions = listingFilterConditions({ status: ["active", "available"] });
    expect(conditions).toHaveLength(1);
  });

  it("zip filter produces a condition", () => {
    const conditions = listingFilterConditions({ zip: "78701" });
    expect(conditions).toHaveLength(1);
  });

  it("hoa true produces a condition", () => {
    const conditions = listingFilterConditions({ hoa: true });
    expect(conditions).toHaveLength(1);
  });

  it("hoa false produces a condition (not skipped as falsy)", () => {
    const conditions = listingFilterConditions({ hoa: false });
    expect(conditions).toHaveLength(1);
  });

  it("hoa undefined produces no condition", () => {
    const conditions = listingFilterConditions({});
    expect(conditions).toHaveLength(0);
  });

  it("allowedPets false produces a condition (not skipped as falsy)", () => {
    const conditions = listingFilterConditions({ allowedPets: false });
    expect(conditions).toHaveLength(1);
  });

  it("schoolDistrictRating filter produces a condition", () => {
    const conditions = listingFilterConditions({ schoolDistrictRating: "A" });
    expect(conditions).toHaveLength(1);
  });

  it("sqft range produces two conditions", () => {
    const conditions = listingFilterConditions({
      minSqft: 1000,
      maxSqft: 3000,
    });
    expect(conditions).toHaveLength(2);
  });

  it("yearBuilt range produces two conditions", () => {
    const conditions = listingFilterConditions({
      minYearBuilt: 2000,
      maxYearBuilt: 2024,
    });
    expect(conditions).toHaveLength(2);
  });

  it("walkability score filters each produce a condition", () => {
    const conditions = listingFilterConditions({
      minWalkScore: 70,
      minTransitScore: 50,
      minBikeScore: 60,
    });
    expect(conditions).toHaveLength(3);
  });

  it("maxHoaFee filter produces a condition", () => {
    const conditions = listingFilterConditions({ maxHoaFee: "500" });
    expect(conditions).toHaveLength(1);
  });

  it("minBathrooms accepts string value for numeric column", () => {
    const conditions = listingFilterConditions({ minBathrooms: "2.5" });
    expect(conditions).toHaveLength(1);
  });

  it("rent range filters produce two conditions", () => {
    const conditions = listingFilterConditions({
      minMonthlyRent: "1500",
      maxMonthlyRent: "3000",
    });
    expect(conditions).toHaveLength(2);
  });

  it("bedroom range produces two conditions", () => {
    const conditions = listingFilterConditions({
      minBedrooms: 2,
      maxBedrooms: 4,
    });
    expect(conditions).toHaveLength(2);
  });

  it("all filters together produce correct count", () => {
    const conditions = listingFilterConditions({
      status: "active",
      listingType: "forRent",
      homeType: "apartment",
      city: "Denver",
      state: "CO",
      zip: "80202",
      allowedPets: true,
      allowedPetType: "dog",
      hoa: false,
      schoolDistrictRating: "B",
      minMonthlyRent: "1000",
      maxMonthlyRent: "2000",
      minBedrooms: 1,
      maxBedrooms: 3,
      minBathrooms: "1",
      minSqft: 500,
      maxSqft: 1500,
      minYearBuilt: 1990,
      maxYearBuilt: 2025,
      minWalkScore: 60,
      minTransitScore: 40,
      minBikeScore: 50,
      maxHoaFee: "300",
    });
    // 23 filters = 23 conditions
    expect(conditions).toHaveLength(23);
  });
});

// ─── 2. ToolLoopAgent Callbacks (deterministic, no LLM) ─────────

describe("prepareCall — buildPersonaInstructions", () => {
  const basePersona = {
    uuid: "test-uuid",
    role: "buyer" as const,
    name: "Jane Doe",
    income: 120000,
    budget: 400000,
    hasKids: false,
    hasPets: false,
    petType: null,
    preferredCity: ["Austin"],
    preferredState: ["TX"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("includes persona name and buyer role", () => {
    const instructions = buildPersonaInstructions(basePersona);
    expect(instructions).toContain("Jane Doe");
    expect(instructions).toContain("buy");
  });

  it("uses 'rent' for renter personas", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      role: "renter",
    });
    expect(instructions).toContain("rent");
    expect(instructions).not.toContain("buy a home");
  });

  it("includes budget as purchase price for buyers", () => {
    const instructions = buildPersonaInstructions(basePersona);
    expect(instructions).toContain("$400,000");
    expect(instructions).toContain("purchase price");
  });

  it("includes budget as per month for renters", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      role: "renter",
      budget: 2500,
    });
    expect(instructions).toContain("$2,500");
    expect(instructions).toContain("per month");
  });

  it("includes preferred cities when present", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      preferredCity: ["Austin", "Denver"],
    });
    expect(instructions).toContain("Austin, Denver");
  });

  it("omits preferred cities line when array is empty", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      preferredCity: [],
    });
    expect(instructions).not.toContain("prefer these cities");
  });

  it("omits preferred cities line when null", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      preferredCity: null,
    });
    expect(instructions).not.toContain("prefer these cities");
  });

  it("includes preferred states when present", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      preferredState: ["TX", "CO"],
    });
    expect(instructions).toContain("TX, CO");
  });

  it("includes school district priority when persona has kids", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      hasKids: true,
    });
    expect(instructions).toContain("children");
    expect(instructions).toContain("school districts");
  });

  it("omits school district line when no kids", () => {
    const instructions = buildPersonaInstructions(basePersona);
    expect(instructions).not.toContain("children");
  });

  it("includes dog-specific pet instructions", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      hasPets: true,
      petType: "dog",
    });
    expect(instructions).toContain("a dog");
    expect(instructions).toContain("dogs");
  });

  it("includes cat-specific pet instructions", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      hasPets: true,
      petType: "cat",
    });
    expect(instructions).toContain("a cat");
    expect(instructions).toContain("cats");
  });

  it("includes all-pets instructions for petType 'all'", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      hasPets: true,
      petType: "all",
    });
    expect(instructions).toContain("dogs and cats");
    expect(instructions).toContain("all pets");
  });

  it("omits pet line when hasPets is false even if petType set", () => {
    const instructions = buildPersonaInstructions({
      ...basePersona,
      hasPets: false,
      petType: "dog",
    });
    expect(instructions).not.toContain("pet-friendly");
  });

  it("always includes the searchHomes tool instruction", () => {
    const instructions = buildPersonaInstructions(basePersona);
    expect(instructions).toContain("searchHomes");
  });
});

describe("prepareStep — shouldDisableTools", () => {
  it("returns false for 0 steps", () => {
    expect(shouldDisableTools(0)).toBe(false);
  });

  it("returns false for exactly 5 steps", () => {
    expect(shouldDisableTools(5)).toBe(false);
  });

  it("returns true for 6 steps", () => {
    expect(shouldDisableTools(6)).toBe(true);
  });

  it("returns true for 10 steps", () => {
    expect(shouldDisableTools(10)).toBe(true);
  });
});

// ─── 3. Agent Regressions (real model, uses AI SDK) ──────────────

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

  it("exact bed/bath maps to bedroom and bathroom filters", async () => {
    const params = await getToolCallParams(
      "Find me a place with exactly 2 bedrooms and 2 bathrooms",
    );
    expect(params).toBeDefined();
    // Model should constrain bedrooms to 2 (via min, max, or both)
    const bedroomConstrained =
      params!.minBedrooms === 2 || params!.maxBedrooms === 2;
    expect(bedroomConstrained).toBe(true);
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

  it("maps 'apartment' to homeType 'apartment'", async () => {
    const params = await getToolCallParams(
      "Find apartments for rent in Austin",
    );
    expect(params).toBeDefined();
    expect(params!.homeType).toBe("apartment");
    expect(params!.listingType).toBe("forRent");
  });

  it("maps 'townhouse' to homeType 'townhouse'", async () => {
    const params = await getToolCallParams(
      "I want to buy a townhouse in Denver",
    );
    expect(params).toBeDefined();
    expect(params!.homeType).toBe("townhouse");
  });

  it("'at least $1500/month' maps to minMonthlyRent", async () => {
    const params = await getToolCallParams(
      "Find rentals in Austin that are at least $1,500 per month",
    );
    expect(params).toBeDefined();
    expect(params!.minMonthlyRent).toBeDefined();
    expect(params!.minMonthlyRent!).toBeGreaterThanOrEqual(1500);
    expect(params!.listingType).toBe("forRent");
  });

  it("'starting at $300k' maps to minSalePrice for forSale", async () => {
    const params = await getToolCallParams(
      "Homes for sale starting at $300,000 in Colorado",
    );
    expect(params).toBeDefined();
    expect(params!.minSalePrice).toBeDefined();
    expect(params!.minSalePrice!).toBeGreaterThanOrEqual(300_000);
    expect(params!.listingType).toBe("forSale");
  });

  it("'dog and cat friendly' maps to allowedPetType 'all'", async () => {
    const params = await getToolCallParams(
      "Find rentals that allow both dogs and cats",
    );
    expect(params).toBeDefined();
    expect(params!.allowedPets).toBe(true);
    expect(params!.allowedPetType).toBe("all");
  });

  it("pet-friendly for-sale search omits pet filters", async () => {
    const params = await getToolCallParams(
      "Find a dog-friendly house for sale in Austin",
    );
    expect(params).toBeDefined();
    expect(params!.listingType).toBe("forSale");
    // Pet filters only apply to rentals per schema description
    expect(params!.allowedPets).toBeUndefined();
    expect(params!.allowedPetType).toBeUndefined();
  });

  it("multiple unmapped descriptors do not invent schema keys", async () => {
    const params = await getToolCallParams(
      "Find a recently renovated house with a garage and basement in Austin",
    );
    expect(params).toBeDefined();
    expect(params!.city).toBe("Austin");
    expect(params!.homeType).toBe("single-family");
    // None of these map to schema fields — no invented keys
    expect(Object.keys(params!)).not.toContain("garage");
    expect(Object.keys(params!)).not.toContain("basement");
    expect(Object.keys(params!)).not.toContain("renovated");
    expect(Object.keys(params!)).not.toContain("amenities");
  });
});

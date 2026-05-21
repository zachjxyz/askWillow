import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { listingsTable, personasTable } from "@/db/schema";
import { listingFilterConditions } from "@/db/filters";

export const searchAgent = new ToolLoopAgent({
  id: "search-agent",
  model: "anthropic/claude-sonnet-4.6",
  instructions: "You are a helpful real estate assistant.",
  stopWhen: stepCountIs(10),
  providerOptions: {
    gateway: {
      models: [
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-5.4-mini",
        "google/gemini-3.1-flash-lite",
      ],
      order: ["anthropic", "openai", "google"],
    },
  },
  callOptionsSchema: z.object({
    personaId: z.string().optional(),
  }),
  prepareCall: async ({ options, instructions, model, ...rest }) => {
    if (!options?.personaId) return { instructions, model, ...rest };

    const [persona] = await db
      .select()
      .from(personasTable)
      .where(eq(personasTable.uuid, options.personaId));

    if (!persona) return { instructions, model, ...rest };

    return {
      model,
      ...rest,
      instructions: [
        `You are a real estate assistant helping ${persona.name}, who is looking to ${persona.role === "buyer" ? "buy" : "rent"} a home.`,
        `Their budget is $${persona.budget.toLocaleString()} ${persona.role === "buyer" ? "purchase price" : "per month"} on an income of $${persona.income.toLocaleString()}/year.`,
        persona.preferredCity?.length ? `They prefer these cities: ${persona.preferredCity.join(", ")}.` : null,
        persona.preferredState?.length ? `They prefer these states: ${persona.preferredState.join(", ")}.` : null,
        persona.hasKids ? `They have children — prioritize listings in good school districts.` : null,
        persona.hasPets && persona.petType ? `They have ${persona.petType === "all" ? "dogs and cats" : `a ${persona.petType}`} — only show pet-friendly listings that allow ${persona.petType === "all" ? "all pets" : `${persona.petType}s`}.` : null,
        `Use the searchHomes tool to find listings. Filter results based on the persona's preferences automatically — do not ask the user to confirm details you already know.`,
      ]
        .filter(Boolean)
        .join("\n"),
    };
  },
  prepareStep: ({ steps }) => {
    if (steps.length > 5) {
      return { activeTools: [] };
    }
    return {};
  },
  onStepFinish: ({ toolResults }) => {
    for (const result of toolResults) {
      console.log(`[search-agent] tool=${result.toolName} id=${result.toolCallId}`);
    }
  },
  tools: {
    searchHomes: tool({
      description: "Search for homes matching the user's criteria",
      needsApproval: true,
      inputSchema: z.object({
        listingType: z
          .enum(["forSale", "forRent"])
          .optional()
          .describe("Whether the user wants to buy or rent"),
        city: z.string().optional().describe("City name"),
        state: z
          .string()
          .optional()
          .describe("State name: 2 letter state abbreviations only. By default, the only states you have available to search are TX and CO."),
        minBathrooms: z
          .number()
          .optional()
          .describe("Minimum number of bathrooms with the lowest being 0.5 aka 'half' bathrooms"),
        minBedrooms: z.number().int().optional().describe("Minimum number of bedrooms"),
        maxBedrooms: z.number().int().optional().describe("Maximum number of bedrooms"),
        minSalePrice: z.number().optional().describe("Minimum sale price in dollars over zero"),
        maxSalePrice: z.number().optional().describe("Maximum sale price in dollars"),
        minMonthlyRent: z.number().optional().describe("Minimum monthly rent in dollars over zero"),
        maxMonthlyRent: z.number().optional().describe("Maximum monthly rent in dollars"),
        allowedPets: z
          .boolean()
          .optional()
          .describe("Whether the listing allows pets. Only applicable for forRent listings. Do not include for forSale searches — purchased homes have no pet restrictions."),
        allowedPetType: z
          .enum(["dog", "cat", "all"])
          .optional()
          .describe("The type of pets allowed: dog, cat, or all. Only applicable for forRent listings. Do not include for forSale searches."),
        homeType: z
          .enum(["single-family", "multi-family", "townhouse", "condo", "apartment"])
          .optional()
          .describe("Type of home the user wants to live in"),
      }),
      execute: async (params) => {
        const results = await db
          .select()
          .from(listingsTable)
          .where(
            and(
              ...listingFilterConditions({
                status: "active",
                ...params,
                minBathrooms: params.minBathrooms?.toString(),
                minSalePrice: params.minSalePrice?.toString(),
                maxSalePrice: params.maxSalePrice?.toString(),
                minMonthlyRent: params.minMonthlyRent?.toString(),
                maxMonthlyRent: params.maxMonthlyRent?.toString(),
              }),
            ),
          )
          .limit(10);
        return results;
      },
    }),
    contactAgent: tool({
      description: "Request to contact a real estate agent about a specific listing.",
      needsApproval: true,
      inputSchema: z.object({
        address: z.string().describe("The street address of the listing"),
        price: z.string().describe("The listing price or monthly rent."),
        listingType: z
          .enum(["forSale", "forRent"])
          .describe("Whether this is a sale or rental."),
      }),
      execute: async (params) => {
        return `Contact request submitted for ${params.address}.`;
      },
    }),
  },
});

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { type ModelMessage, type UIMessageChunk, tool } from "ai";

import { db } from "@/db";
import { listingFilterConditions } from "@/db/filters";
import { listingsTable, personasTable } from "@/db/schema";
import { searchApprovalHook } from "@/workflows/hooks/search-approval";
import { contactAgentHook } from "@/workflows/hooks/contact-agent";

export async function chatWorkflow(
  messages: ModelMessage[],
  personaId?: string,
) {
  "use workflow";
  const writable = getWritable<UIMessageChunk>();

  let instructions = "You are a helpful real estate assistant.";
  if (personaId) {
    const persona = await (async () => {
      "use step";
      const [result] = await db
        .select()
        .from(personasTable)
        .where(eq(personasTable.uuid, personaId));
      return result;
    })();
    if (persona) {
      instructions = [
        `You are a real estate assistant helping ${persona.name}, who is looking to ${persona.role === "buyer" ? "buy" : "rent"} a home.`,
        `Their budget is $${persona.budget.toLocaleString()} ${persona.role === "buyer" ? "purchase price" : "per month"} on an income of $${persona.income.toLocaleString()}/year.`,
        persona.preferredCity?.length
          ? `They prefer these cities: ${persona.preferredCity.join(", ")}.`
          : null,
        persona.preferredState?.length
          ? `They prefer these states: ${persona.preferredState.join(", ")}.`
          : null,
        persona.hasKids
          ? `They have children — prioritize listings in good school districts.`
          : null,
        persona.hasPets && persona.petType
          ? `They have ${persona.petType === "all" ? "dogs and cats" : `a ${persona.petType}`} — only show pet-friendly listings that allow ${persona.petType === "all" ? "all pets" : `${persona.petType}s`}.`
          : null,
        `Always call searchApproval first to get human confirmation, then use searchHomes to find listings. Filter results based on the persona's preferences automatically — do not ask the user to confirm details you already know.`,
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const agent = new DurableAgent({
    model: "anthropic/claude-sonnet-4.6",
    instructions,
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
    tools: {
      searchApproval: {
        description:
          "Request human approval before searching homes. Call this before using searchHomes.",
        inputSchema: z.object({
          summary: z
            .string()
            .describe(
              "A brief description of what you're about to search for, e.g. '3-bedroom homes in Austin under $500k'",
            ),
        }),
        execute: async (
          _params: { summary: string },
          { toolCallId }: { toolCallId: string },
        ) => {
          const hook = searchApprovalHook.create({ token: toolCallId });
          const { approved, comment } = await hook;
          if (!approved)
            return `Search rejected: ${comment || "No reason provided"}`;
          return "Search approved — proceed with searchHomes.";
        },
      },
      searchHomes: tool({
        description: "Get a list of homes",
        inputSchema: z.object({
          listingType: z
            .enum(["forSale", "forRent"])
            .optional()
            .describe("Whether the user wants to buy or rent"),
          city: z.string().optional().describe("City name"),
          state: z
            .string()
            .optional()
            .describe(
              "State name: 2 letter state abbreviations only. By default, the only states you have available to search are TX and CO.",
            ),
          minBathrooms: z
            .number()
            .optional()
            .describe(
              "Minimum number of bedrooms with the lowest being 0.5 aka 'half' bathrooms",
            ),
          minBedrooms: z
            .number()
            .int()
            .optional()
            .describe("Minimum number of bedrooms"),
          maxBedrooms: z
            .number()
            .int()
            .optional()
            .describe("Maximum number of bedrooms"),
          minSalePrice: z
            .number()
            .optional()
            .describe("Minimum sale price in dollars over zero"),
          maxSalePrice: z
            .number()
            .optional()
            .describe("Maximum sale price in dollars"),
          minMonthlyRent: z
            .number()
            .optional()
            .describe("Minimum monthly rent in dollars over zero"),
          maxMonthlyRent: z
            .number()
            .optional()
            .describe("Maximum monthly rent in dollars"),
          allowedPets: z
            .boolean()
            .optional()
            .describe(
              "Whether the listing allows pets. Only applicable for forRent listings. Do not include for forSale searches — purchased homes have no pet restrictions.",
            ),
          allowedPetType: z
            .enum(["dog", "cat", "all"])
            .optional()
            .describe(
              "The type of pets allowed: dog, cat, or all. Only applicable for forRent listings. Do not include for forSale searches.",
            ),
          homeType: z
            .enum([
              "single-family",
              "multi-family",
              "townhouse",
              "condo",
              "apartment",
            ])
            .optional()
            .describe("Type of home the user wants to live in"),
        }),
        execute: async (params) => {
          "use step";
          const results = await db
            .select()
            .from(listingsTable)
            .where(
              and(
                ...listingFilterConditions({
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
      contactAgent: {
        description:
          "Request approval to contact a real estate agent about a specific listing.",
        inputSchema: z.object({
          address: z.string().describe("The street address of the listing"),
          price: z.string().describe("The listing price or monthly rent."),
          listingType: z
            .enum(["forSale", "forRent"])
            .describe("Whether this is a sale or rental."),
        }),
        execute: async (_params, { toolCallId }) => {
          const hook = contactAgentHook.create({ token: toolCallId });
          const { approved, message } = await hook;
          if (!approved) return "Contact request cancelled.";
          return `Contact request submitted for ${_params.address}.${message ? ` User note: ${message}` : ""}`;
        },
      },
    },
  });
  await agent.stream({
    messages,
    writable,
  });
}

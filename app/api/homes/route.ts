import { z } from "zod";
import { listingFilterConditions } from "@/db/filters";
import { db } from "@/db";
import {
  listingsTable,
  listingEnum,
  homeTypeEnum,
  petTypeEnum,
  schoolRatingEnum,
  statusEnum,
} from "@/db/schema";
import { and } from "drizzle-orm";

const searchParamsSchema = z.object({
  status: z.enum(statusEnum.enumValues).optional(),
  listingType: z.enum(listingEnum.enumValues).optional(),
  homeType: z.enum(homeTypeEnum.enumValues).optional(),
  allowedPetType: z.enum(petTypeEnum.enumValues).optional(),
  schoolDistrictRating: z.enum(schoolRatingEnum.enumValues).optional(),

  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),

  allowedPets: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  hoa: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),

  minSalePrice: z.string().optional(),
  maxSalePrice: z.string().optional(),
  minMonthlyRent: z.string().optional(),
  maxMonthlyRent: z.string().optional(),
  minBathrooms: z.string().optional(),
  maxHoaFee: z.string().optional(),

  minBedrooms: z.coerce.number().int().positive().optional(),
  maxBedrooms: z.coerce.number().int().positive().optional(),
  minSqft: z.coerce.number().int().positive().optional(),
  maxSqft: z.coerce.number().int().positive().optional(),
  minYearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  maxYearBuilt: z.coerce.number().int().min(1800).max(2100).optional(),
  minWalkScore: z.coerce.number().int().min(0).max(100).optional(),
  minTransitScore: z.coerce.number().int().min(0).max(100).optional(),
  minBikeScore: z.coerce.number().int().min(0).max(100).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = searchParamsSchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const params = parsed.data;
  try {
    const results = await db
      .select()
      .from(listingsTable)
      .where(and(...listingFilterConditions({ status: ["active", "available"], ...params })));

    return Response.json(results);
  } catch {
    return Response.json(
      { error: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}

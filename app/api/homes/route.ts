import { z } from "zod";
import { db } from "@/db";
import {
  listingsTable,
  listingEnum,
  homeTypeEnum,
  petTypeEnum,
  schoolRatingEnum,
} from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

const searchParamsSchema = z.object({
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
  const conditions = [];

  if (params.listingType) {
    conditions.push(eq(listingsTable.listingType, params.listingType));
  }
  if (params.homeType) {
    conditions.push(eq(listingsTable.homeType, params.homeType));
  }
  if (params.city) {
    conditions.push(eq(listingsTable.city, params.city));
  }
  if (params.state) {
    conditions.push(eq(listingsTable.state, params.state));
  }
  if (params.zip) {
    conditions.push(eq(listingsTable.zip, params.zip));
  }
  if (params.allowedPets !== undefined) {
    conditions.push(eq(listingsTable.allowedPets, params.allowedPets));
  }
  if (params.allowedPetType) {
    conditions.push(eq(listingsTable.allowedPetType, params.allowedPetType));
  }
  if (params.hoa !== undefined) {
    conditions.push(eq(listingsTable.hoa, params.hoa));
  }
  if (params.schoolDistrictRating) {
    conditions.push(
      eq(listingsTable.schoolDistrictRating, params.schoolDistrictRating),
    );
  }
  if (params.minSalePrice) {
    conditions.push(gte(listingsTable.salePrice, params.minSalePrice));
  }
  if (params.maxSalePrice) {
    conditions.push(lte(listingsTable.salePrice, params.maxSalePrice));
  }
  if (params.minMonthlyRent) {
    conditions.push(gte(listingsTable.monthlyRent, params.minMonthlyRent));
  }
  if (params.maxMonthlyRent) {
    conditions.push(lte(listingsTable.monthlyRent, params.maxMonthlyRent));
  }
  if (params.minBedrooms) {
    conditions.push(gte(listingsTable.bedrooms, params.minBedrooms));
  }
  if (params.maxBedrooms) {
    conditions.push(lte(listingsTable.bedrooms, params.maxBedrooms));
  }
  if (params.minBathrooms) {
    conditions.push(gte(listingsTable.bathrooms, params.minBathrooms));
  }
  if (params.minSqft) {
    conditions.push(gte(listingsTable.sqft, params.minSqft));
  }
  if (params.maxSqft) {
    conditions.push(lte(listingsTable.sqft, params.maxSqft));
  }
  if (params.minYearBuilt) {
    conditions.push(gte(listingsTable.yearBuilt, params.minYearBuilt));
  }
  if (params.maxYearBuilt) {
    conditions.push(lte(listingsTable.yearBuilt, params.maxYearBuilt));
  }
  if (params.minWalkScore) {
    conditions.push(gte(listingsTable.walkScore, params.minWalkScore));
  }
  if (params.minTransitScore) {
    conditions.push(gte(listingsTable.transitScore, params.minTransitScore));
  }
  if (params.minBikeScore) {
    conditions.push(gte(listingsTable.bikeScore, params.minBikeScore));
  }
  if (params.maxHoaFee) {
    conditions.push(lte(listingsTable.hoaFee, params.maxHoaFee));
  }

  try {
    const results = await db
      .select()
      .from(listingsTable)
      .where(and(...conditions));

    return Response.json(results);
  } catch {
    return Response.json(
      { error: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}

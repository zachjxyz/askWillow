import { db } from "@/db";
import {
  listingsTable,
  listingEnum,
  homeTypeEnum,
  petTypeEnum,
  schoolRatingEnum,
} from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingType = searchParams.get("listingType");
  const homeType = searchParams.get("homeType");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const zip = searchParams.get("zip");
  const allowedPets = searchParams.get("allowedPets");
  const allowedPetType = searchParams.get("allowedPetType");
  const hoa = searchParams.get("hoa");
  const schoolDistrictRating = searchParams.get("schoolDistrictRating");
  const minSalePrice = searchParams.get("minSalePrice");
  const maxSalePrice = searchParams.get("maxSalePrice");
  const minMonthlyRent = searchParams.get("minMonthlyRent");
  const maxMonthlyRent = searchParams.get("maxMonthlyRent");
  const minBedrooms = searchParams.get("minBedrooms");
  const maxBedrooms = searchParams.get("maxBedrooms");
  const minBathrooms = searchParams.get("minBathrooms");
  const minSqft = searchParams.get("minSqft");
  const maxSqft = searchParams.get("maxSqft");
  const minYearBuilt = searchParams.get("minYearBuilt");
  const maxYearBuilt = searchParams.get("maxYearBuilt");
  const minWalkScore = searchParams.get("minWalkScore");
  const minTransitScore = searchParams.get("minTransitScore");
  const minBikeScore = searchParams.get("minBikeScore");
  const maxHoaFee = searchParams.get("maxHoaFee");

  const conditions = [];

  if (listingType && listingEnum.enumValues.includes(listingType as any)) {
    conditions.push(
      eq(
        listingsTable.listingType,
        listingType as (typeof listingEnum.enumValues)[number],
      ),
    );
  }
  if (homeType && homeTypeEnum.enumValues.includes(homeType as any)) {
    conditions.push(
      eq(
        listingsTable.homeType,
        homeType as (typeof homeTypeEnum.enumValues)[number],
      ),
    );
  }
  if (city) {
    conditions.push(eq(listingsTable.city, city));
  }
  if (state) {
    conditions.push(eq(listingsTable.state, state));
  }
  if (zip) {
    conditions.push(eq(listingsTable.zip, zip));
  }
  if (allowedPets) {
    conditions.push(eq(listingsTable.allowedPets, allowedPets === "true"));
  }
  if (
    allowedPetType &&
    petTypeEnum.enumValues.includes(allowedPetType as any)
  ) {
    conditions.push(
      eq(
        listingsTable.allowedPetType,
        allowedPetType as (typeof petTypeEnum.enumValues)[number],
      ),
    );
  }
  if (hoa) {
    conditions.push(eq(listingsTable.hoa, hoa === "true"));
  }
  if (
    schoolDistrictRating &&
    schoolRatingEnum.enumValues.includes(schoolDistrictRating as any)
  ) {
    conditions.push(
      eq(
        listingsTable.schoolDistrictRating,
        schoolDistrictRating as (typeof schoolRatingEnum.enumValues)[number],
      ),
    );
  }
  if (minSalePrice) {
    conditions.push(gte(listingsTable.salePrice, minSalePrice));
  }
  if (maxSalePrice) {
    conditions.push(lte(listingsTable.salePrice, maxSalePrice));
  }
  if (minMonthlyRent) {
    conditions.push(gte(listingsTable.monthlyRent, minMonthlyRent));
  }
  if (maxMonthlyRent) {
    conditions.push(lte(listingsTable.monthlyRent, maxMonthlyRent));
  }
  if (minBedrooms) {
    conditions.push(gte(listingsTable.bedrooms, parseInt(minBedrooms)));
  }
  if (maxBedrooms) {
    conditions.push(lte(listingsTable.bedrooms, parseInt(maxBedrooms)));
  }
  if (minBathrooms) {
    conditions.push(gte(listingsTable.bathrooms, minBathrooms));
  }
  if (minSqft) {
    conditions.push(gte(listingsTable.sqft, parseInt(minSqft)));
  }
  if (maxSqft) {
    conditions.push(lte(listingsTable.sqft, parseInt(maxSqft)));
  }
  if (minYearBuilt) {
    conditions.push(gte(listingsTable.yearBuilt, parseInt(minYearBuilt)));
  }
  if (maxYearBuilt) {
    conditions.push(lte(listingsTable.yearBuilt, parseInt(maxYearBuilt)));
  }
  if (minWalkScore) {
    conditions.push(gte(listingsTable.walkScore, parseInt(minWalkScore)));
  }
  if (minTransitScore) {
    conditions.push(gte(listingsTable.transitScore, parseInt(minTransitScore)));
  }
  if (minBikeScore) {
    conditions.push(gte(listingsTable.bikeScore, parseInt(minBikeScore)));
  }
  if (maxHoaFee) {
    conditions.push(lte(listingsTable.hoaFee, maxHoaFee));
  }

  const results = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions));

  return Response.json(results);
}

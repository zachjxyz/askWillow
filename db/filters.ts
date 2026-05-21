import {
  listingsTable,
  listingEnum,
  homeTypeEnum,
  petTypeEnum,
  schoolRatingEnum,
  statusEnum,
} from "@/db/schema";
import { eq, gte, lte, inArray } from "drizzle-orm";

export type ListingFilters = {
  status?: (typeof statusEnum.enumValues)[number];
  listingType?: (typeof listingEnum.enumValues)[number];
  homeType?: (typeof homeTypeEnum.enumValues)[number];
  city?: string;
  state?: string;
  zip?: string;
  allowedPets?: boolean;
  allowedPetType?: (typeof petTypeEnum.enumValues)[number];
  hoa?: boolean;
  schoolDistrictRating?: (typeof schoolRatingEnum.enumValues)[number];
  minSalePrice?: string;
  maxSalePrice?: string;
  minMonthlyRent?: string;
  maxMonthlyRent?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: string;
  minSqft?: number;
  maxSqft?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minWalkScore?: number;
  minTransitScore?: number;
  minBikeScore?: number;
  maxHoaFee?: string;
};

export function listingFilterConditions(filter: ListingFilters) {
  const conditions = [];

  if (filter.status) {
    conditions.push(eq(listingsTable.status, filter.status));
  }
  if (filter.listingType) {
    conditions.push(eq(listingsTable.listingType, filter.listingType));
  }
  if (filter.homeType) {
    conditions.push(eq(listingsTable.homeType, filter.homeType));
  }
  if (filter.city) {
    conditions.push(eq(listingsTable.city, filter.city));
  }
  if (filter.state) {
    conditions.push(eq(listingsTable.state, filter.state));
  }
  if (filter.zip) {
    conditions.push(eq(listingsTable.zip, filter.zip));
  }
  if (filter.allowedPets !== undefined) {
    conditions.push(eq(listingsTable.allowedPets, filter.allowedPets));
  }
  if (filter.allowedPetType) {
    if (filter.allowedPetType === "all") {
      conditions.push(eq(listingsTable.allowedPetType, "all"));
    } else {
      conditions.push(
        inArray(listingsTable.allowedPetType, [filter.allowedPetType, "all"]),
      );
    }
  }
  if (filter.hoa !== undefined) {
    conditions.push(eq(listingsTable.hoa, filter.hoa));
  }
  if (filter.schoolDistrictRating) {
    conditions.push(
      eq(listingsTable.schoolDistrictRating, filter.schoolDistrictRating),
    );
  }
  if (filter.minSalePrice) {
    conditions.push(gte(listingsTable.salePrice, filter.minSalePrice));
  }
  if (filter.maxSalePrice) {
    conditions.push(lte(listingsTable.salePrice, filter.maxSalePrice));
  }
  if (filter.minMonthlyRent) {
    conditions.push(gte(listingsTable.monthlyRent, filter.minMonthlyRent));
  }
  if (filter.maxMonthlyRent) {
    conditions.push(lte(listingsTable.monthlyRent, filter.maxMonthlyRent));
  }
  if (filter.minBedrooms) {
    conditions.push(gte(listingsTable.bedrooms, filter.minBedrooms));
  }
  if (filter.maxBedrooms) {
    conditions.push(lte(listingsTable.bedrooms, filter.maxBedrooms));
  }
  if (filter.minBathrooms) {
    conditions.push(gte(listingsTable.bathrooms, filter.minBathrooms));
  }
  if (filter.minSqft) {
    conditions.push(gte(listingsTable.sqft, filter.minSqft));
  }
  if (filter.maxSqft) {
    conditions.push(lte(listingsTable.sqft, filter.maxSqft));
  }
  if (filter.minYearBuilt) {
    conditions.push(gte(listingsTable.yearBuilt, filter.minYearBuilt));
  }
  if (filter.maxYearBuilt) {
    conditions.push(lte(listingsTable.yearBuilt, filter.maxYearBuilt));
  }
  if (filter.minWalkScore) {
    conditions.push(gte(listingsTable.walkScore, filter.minWalkScore));
  }
  if (filter.minTransitScore) {
    conditions.push(gte(listingsTable.transitScore, filter.minTransitScore));
  }
  if (filter.minBikeScore) {
    conditions.push(gte(listingsTable.bikeScore, filter.minBikeScore));
  }
  if (filter.maxHoaFee) {
    conditions.push(lte(listingsTable.hoaFee, filter.maxHoaFee));
  }

  return conditions;
}

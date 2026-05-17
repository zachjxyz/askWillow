import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  varchar,
  boolean,
  check,
  char,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const listingEnum = pgEnum("listingType", ["forSale", "forRent"]);
export const statusEnum = pgEnum("status", [
  "active",
  "inactive",
  "under-contract",
  "closed",
  "available",
  "unavailable",
]);
export const homeTypeEnum = pgEnum("homeType", [
  "single-family",
  "multi-family",
  "townhouse",
  "condo",
  "apartment",
]);
export const schoolRatingEnum = pgEnum("schoolRating", ["A", "B", "C", "D"]);
export const roleTypeEnum = pgEnum("role", ["buyer", "renter"]);
export const petTypeEnum = pgEnum("petType", ["dog", "cat", "all"]);

export const listingsTable = pgTable(
  "listings",
  {
    uuid: uuid().primaryKey().defaultRandom(),
    listingType: listingEnum().notNull(),
    status: statusEnum().notNull(),
    homeType: homeTypeEnum().notNull(),
    salePrice: numeric({ precision: 12, scale: 2 }),
    monthlyRent: numeric({ precision: 12, scale: 2 }),
    streetAddress: varchar().notNull(),
    city: text().notNull(),
    state: char({ length: 2 }).notNull(),
    zip: varchar({ length: 5 }).notNull(),
    bedrooms: integer().notNull(),
    bathrooms: numeric({ precision: 3, scale: 1 }).notNull(),
    sqft: integer().notNull(),
    garageSize: integer(),
    allowedPets: boolean(),
    allowedPetType: petTypeEnum(),
    hasImages: boolean().notNull(),
    images: text().array(),
    yearBuilt: integer().notNull(),
    schoolDistrictName: text(),
    schoolDistrictRating: schoolRatingEnum(),
    walkScore: integer(),
    transitScore: integer(),
    bikeScore: integer(),
    hoa: boolean().notNull().default(false),
    hoaFee: numeric({ precision: 12, scale: 2 }),
    amenities: text().array(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      "sale_price_check",
      sql`(${table.listingType} = 'forSale' AND ${table.salePrice} IS NOT NULL AND ${table.salePrice} > 0) OR (${table.listingType} = 'forRent' AND ${table.salePrice} IS NULL)`,
    ),
    check(
      "monthly_rent_check",
      sql`(${table.listingType} = 'forSale' AND ${table.monthlyRent} IS NULL) OR (${table.listingType} = 'forRent' AND ${table.monthlyRent} IS NOT NULL AND ${table.monthlyRent} > 0)`,
    ),
    check(
      "allowed_pets_check",
      sql`(${table.listingType} = 'forSale') OR (${table.listingType} = 'forRent' AND ${table.allowedPets} IS NOT NULL)`,
    ),
    check(
      "allowed_pet_type_check",
      sql`(${table.allowedPets} = TRUE AND ${table.allowedPetType} IS NOT NULL) OR (${table.allowedPets} IS NOT TRUE AND ${table.allowedPetType} IS NULL)`,
    ),
    check(
      "hoa_fee_check",
      sql`(${table.hoa} = TRUE AND ${table.hoaFee} IS NOT NULL) OR (${table.hoa} = FALSE AND ${table.hoaFee} IS NULL)`,
    ),
    check(
      "images_check",
      sql`(${table.hasImages} = TRUE and ${table.images} IS NOT NULL) OR (${table.hasImages} = FALSE and ${table.images} IS NULL)`,
    ),
    check("walk_score_check", sql`${table.walkScore} BETWEEN 0 AND 100`),
    check("transit_score_check", sql`${table.transitScore} BETWEEN 0 AND 100`),
    check("bike_score_check", sql`${table.bikeScore} BETWEEN 0 AND 100`),
    check("bedrooms_check", sql`${table.bedrooms} BETWEEN 1 AND 99`),
    check("bathrooms_check", sql`${table.bathrooms} BETWEEN 0.5 AND 99`),
    check("year_built_check", sql`${table.yearBuilt} BETWEEN 1800 AND 2100`),
    check(
      "street_address_check",
      sql`length(trim(${table.streetAddress})) > 0`,
    ),
    index("listings_city_idx").on(table.city),
    index("listings_state_idx").on(table.state),
    index("listings_zip_idx").on(table.zip),
    index("listings_home_type_idx").on(table.homeType),
    index("listings_listing_type_idx").on(table.listingType),
    index("listings_bedrooms_idx").on(table.bedrooms),
    index("listings_sale_price_idx").on(table.salePrice),
    index("listings_monthly_rent_idx").on(table.monthlyRent),
  ],
);

export const personasTable = pgTable(
  "personas",
  {
    uuid: uuid().primaryKey().defaultRandom(),
    role: roleTypeEnum().notNull(),
    name: varchar({ length: 256 }).notNull(),
    income: integer().notNull(),
    budget: integer().notNull(),
    hasKids: boolean(),
    hasPets: boolean(),
    petType: petTypeEnum(),
    preferredCity: text().array(),
    preferredState: text().array(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check("income_check", sql`${table.income} > 0`),
    check("budget_check", sql`${table.budget} > 0`),
    check(
      "pet_type_check",
      sql`(${table.hasPets} = TRUE AND ${table.petType} IS NOT NULL) OR (${table.hasPets} = FALSE AND ${table.petType} IS NULL)`,
    ),
    check(
      "preferred_city_or_state",
      sql`${table.preferredCity} IS NOT NULL OR ${table.preferredState} IS NOT NULL`,
    ),
  ],
);

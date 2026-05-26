import type { CreateListingInput } from "@hustl/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { notifyUrgentListingNearby } from "./push.service.js";

type ListingSearchInput = {
  lat: number;
  lng: number;
  radius: number;
  skills?: string[];
  isUrgent?: boolean;
  viewerId?: string;
};

export async function createListing(businessId: string, input: CreateListingInput) {
  const totalHours = (input.endTime.getTime() - input.startTime.getTime()) / 3_600_000;
  const listing = await prisma.listing.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      skills: input.skills,
      hourlyRate: new Prisma.Decimal(input.hourlyRate),
      startTime: input.startTime,
      endTime: input.endTime,
      totalHours,
      isUrgent: input.isUrgent,
      verifiedBadgeOnly: input.verifiedBadgeOnly
    }
  });

  await prisma.$executeRaw`
    UPDATE "Listing"
    SET coords = ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography
    WHERE id = ${listing.id}
  `;

  if (input.isUrgent) {
    const business = await prisma.businessProfile.findUnique({
      where: { userId: businessId },
      select: { businessName: true }
    });
    await notifyUrgentListingNearby({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      businessId: listing.businessId,
      businessName: business?.businessName ?? "Hustl Business",
      hourlyRate: listing.hourlyRate,
      startTime: listing.startTime,
      endTime: listing.endTime,
      skills: listing.skills
    });
  }

  return listing;
}

export async function findNearbyListings(input: ListingSearchInput) {
  const skills = input.skills?.length ? input.skills : undefined;
  const urgentFilter = input.isUrgent === undefined ? Prisma.empty : Prisma.sql`AND l."isUrgent" = ${input.isUrgent}`;
  const skillFilter = skills ? Prisma.sql`AND l.skills && ${skills}` : Prisma.empty;
  const urgentReputationFilter = input.isUrgent
    ? Prisma.sql`AND NOT EXISTS (
        SELECT 1 FROM "User" u WHERE u.id = ${input.viewerId ?? ""} AND u."reputationScore" < 3.5
      )`
    : Prisma.empty;

  return prisma.$queryRaw`
    SELECT
      l.id,
      l.title,
      l.description,
      l.skills,
      l."hourlyRate",
      l."startTime",
      l."endTime",
      l."totalHours",
      l."isUrgent",
      l."verifiedBadgeOnly",
      l.status,
      l."createdAt",
      bp."businessName",
      bp."isVerified" AS "businessVerified",
      u."avatarUrl" AS "businessLogo",
      u."reputationScore" AS "businessReputation",
      ST_Distance(l.coords, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography) AS distance
    FROM "Listing" l
    JOIN "BusinessProfile" bp ON bp."userId" = l."businessId"
    JOIN "User" u ON u.id = bp."userId"
    WHERE l.status = 'OPEN'
      AND l.coords IS NOT NULL
      AND ST_DWithin(l.coords, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography, ${input.radius})
      ${urgentFilter}
      ${skillFilter}
      ${urgentReputationFilter}
    ORDER BY
      CASE WHEN u."reputationScore" < 3.8 THEN 1 ELSE 0 END ASC,
      l."isUrgent" DESC,
      distance ASC,
      l."createdAt" DESC
  `;
}

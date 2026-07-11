import { prisma } from "../config/prisma.js";

/**
 * Geo Verification Service
 * Verifies if the student is within 200m of the listing coords.
 */
export async function verifyStudentLocation(
  studentCoords: { lat: number; lng: number },
  listingId: string
): Promise<boolean> {
  const result = await prisma.$queryRaw<{ isWithin: boolean }[]>`
    SELECT ST_DWithin(
      coords,
      ST_SetSRID(ST_MakePoint(${studentCoords.lng}, ${studentCoords.lat}), 4326)::geography,
      200
    ) as "isWithin"
    FROM "Listing"
    WHERE id = ${listingId}
  `;

  return result[0]?.isWithin ?? false;
}

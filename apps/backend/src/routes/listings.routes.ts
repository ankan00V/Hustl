import { Router } from "express";
import { createListingSchema, listingQuerySchema, routeParams, updateListingSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { checkListingQuota } from "../middleware/listing-quota.js";
import { validate } from "../middleware/validate.js";
import { createListing, findNearbyListings } from "../services/listing.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const listingsRouter = Router();

listingsRouter.get(
  "/",
  requireAuth,
  validate(listingQuerySchema, "query"),
  asyncHandler(async (request, response) => {
    response.json({
      listings: await findNearbyListings({ ...listingQuerySchema.parse(request.query), viewerId: request.user?.id })
    });
  })
);

listingsRouter.post(
  "/",
  requireAuth,
  requireRole("BUSINESS"),
  validate(createListingSchema),
  checkListingQuota,
  asyncHandler(async (request, response) => {
    const listing = await createListing(request.user!.id, createListingSchema.parse(request.body));
    response.status(201).json({ listing });
  })
);

listingsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("BUSINESS"),
  validate(routeParams.id, "params"),
  validate(updateListingSchema),
  asyncHandler(async (request, response) => {
    const { id } = routeParams.id.parse(request.params);
    const existing = await prisma.listing.findUnique({ where: { id }, select: { businessId: true } });
    if (!existing || existing.businessId !== request.user!.id) {
      throw new AppError(404, "Listing not found", "LISTING_NOT_FOUND");
    }

    const input = updateListingSchema.parse(request.body);
    const totalHours = input.startTime && input.endTime ? (input.endTime.getTime() - input.startTime.getTime()) / 3_600_000 : undefined;
    const listing = await prisma.listing.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        skills: input.skills,
        hourlyRate: input.hourlyRate,
        startTime: input.startTime,
        endTime: input.endTime,
        totalHours,
        isUrgent: input.isUrgent,
        verifiedBadgeOnly: input.verifiedBadgeOnly,
        status: input.status
      }
    });

    if (input.lat !== undefined && input.lng !== undefined) {
      await prisma.$executeRaw`
        UPDATE "Listing"
        SET coords = ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography
        WHERE id = ${id}
      `;
    }

    response.json({ listing });
  })
);

listingsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("BUSINESS"),
  validate(routeParams.id, "params"),
  asyncHandler(async (request, response) => {
    const { id } = routeParams.id.parse(request.params);
    const listing = await prisma.listing.findUnique({ where: { id }, select: { businessId: true } });
    if (!listing || listing.businessId !== request.user!.id) {
      throw new AppError(404, "Listing not found", "LISTING_NOT_FOUND");
    }

    await prisma.listing.update({ where: { id }, data: { status: "CLOSED" } });
    response.status(204).send();
  })
);

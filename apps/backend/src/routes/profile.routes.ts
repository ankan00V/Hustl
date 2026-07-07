import { Router, Request } from "express";
import { businessProfileSchema, routeParams, studentProfileSchema } from "@hustl/shared";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadAvatar, uploadPortfolio } from "../middleware/upload.js";
import { uploadImage, uploadVideo, deleteAsset } from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";
import { validateFCMToken } from "../lib/fcm.js";

// Extend Express Request type to include multer file properties
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Validation schemas
const fcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required")
});

export const profileRouter = Router();

profileRouter.get(
  "/:userId",
  requireAuth,
  validate(routeParams.userId, "params"),
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: routeParams.userId.parse(request.params).userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        college: true,
        isVerified: true,
        reputationScore: true,
        createdAt: true,
        studentProfile: true,
        businessProfile: true,
        badges: true
      }
    });
    response.json({ user });
  })
);

/**
 * GET /profile/:userId/public
 * Public profile view - used by business when viewing student on swipe card
 * Returns: name, avatar, skills, badges, reputation, completed shifts, portfolio preview
 */
profileRouter.get(
  "/:userId/public",
  requireAuth,
  validate(routeParams.userId, "params"),
  asyncHandler(async (request, response) => {
    const { userId } = routeParams.userId.parse(request.params);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        college: true,
        reputationScore: true,
        role: true,
        studentProfile: {
          select: {
            skills: true,
            portfolioUrls: true,
            collegeName: true,
            completedShifts: true,
            badges: true
          }
        },
        badges: {
          select: {
            id: true,
            name: true,
            category: true,
            earnedAt: true
          },
          orderBy: {
            earnedAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!user) {
      throw AppError.notFound("User not found", "USER_NOT_FOUND");
    }

    // Format response for public consumption
    response.json({
      profile: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        college: user.college,
        reputationScore: user.reputationScore,
        role: user.role,
        skills: user.studentProfile?.skills ?? [],
        portfolioUrls: user.studentProfile?.portfolioUrls?.slice(0, 5) ?? [], // Max 5 for preview
        collegeName: user.studentProfile?.collegeName,
        completedShifts: user.studentProfile?.completedShifts ?? 0,
        badges: user.badges,
        badgeCount: user.badges.length
      }
    });
  })
);

profileRouter.patch(
  "/student",
  requireAuth,
  requireRole("STUDENT"),
  validate(studentProfileSchema.partial()),
  asyncHandler(async (request, response) => {
    const input = studentProfileSchema.partial().parse(request.body);
    const profile = await prisma.studentProfile.upsert({
      where: { userId: request.user!.id },
      create: {
        userId: request.user!.id,
        skills: input.skills ?? [],
        portfolioUrls: input.portfolioUrls ?? [],
        collegeName: input.collegeName ?? "",
        availabilitySlots: input.availabilitySlots ?? []
      },
      update: input
    });
    response.json({ profile });
  })
);

profileRouter.patch(
  "/business",
  requireAuth,
  requireRole("BUSINESS"),
  validate(businessProfileSchema.partial()),
  asyncHandler(async (request, response) => {
    const input = businessProfileSchema.partial().parse(request.body);
    const { lat, lng, ...rest } = input;
    const profile = await prisma.businessProfile.upsert({
      where: { userId: request.user!.id },
      create: {
        userId: request.user!.id,
        businessName: rest.businessName ?? "",
        category: rest.category ?? "Uncategorized",
        address: rest.address ?? "",
        ...(lat && lng ? { coords: `POINT(${lng} ${lat})` } : {})
      },
      update: {
        ...rest,
        ...(lat && lng ? { coords: `POINT(${lng} ${lat})` } : {})
      }
    });

    // Referral logic: Business onboarding complete
    const referral = await prisma.referral.findFirst({
      where: { refereeId: request.user!.id, status: "SIGNED_UP" }
    });

    if (referral && rest.businessName && rest.address) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const referrerBusiness = await prisma.businessProfile.findUnique({
        where: { userId: referral.referrerId }
      });

      if (referrerBusiness) {
        await prisma.$transaction([
          prisma.membership.create({
            data: {
              businessId: referral.referrerId,
              tier: "PRO",
              expiresAt,
              listingQuota: 10
            }
          }),
          prisma.referral.update({
            where: { id: referral.id },
            data: { status: "REWARDED", redeemedAt: now, rewardType: "1M_PRO" }
          })
        ]);
      }
    }

    response.json({ profile });
  })
);

profileRouter.post(
  "/student/avatar",
  requireAuth,
  requireRole("STUDENT"),
  uploadAvatar,
  asyncHandler(async (request: MulterRequest, response) => {
    if (!request.file) {
      throw AppError.badRequest("No file uploaded", "NO_FILE");
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { avatarUrl: true }
    });

    const result = await uploadImage(request.file.buffer, "avatars");

    if (user?.avatarUrl) {
      await deleteAsset(user.avatarUrl);
    }

    await prisma.user.update({
      where: { id: request.user!.id },
      data: { avatarUrl: result.url }
    });

    response.json({ avatarUrl: result.url });
  })
);

profileRouter.post(
  "/business/avatar",
  requireAuth,
  requireRole("BUSINESS"),
  uploadAvatar,
  asyncHandler(async (request: MulterRequest, response) => {
    if (!request.file) {
      throw AppError.badRequest("No file uploaded", "NO_FILE");
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { avatarUrl: true }
    });

    const result = await uploadImage(request.file.buffer, "avatars");

    if (user?.avatarUrl) {
      await deleteAsset(user.avatarUrl);
    }

    await prisma.user.update({
      where: { id: request.user!.id },
      data: { avatarUrl: result.url }
    });

    response.json({ avatarUrl: result.url });
  })
);

profileRouter.post(
  "/student/portfolio",
  requireAuth,
  requireRole("STUDENT"),
  uploadPortfolio,
  asyncHandler(async (request: MulterRequest, response) => {
    if (!request.files || !Array.isArray(request.files) || request.files.length === 0) {
      throw AppError.badRequest("No files uploaded", "NO_FILES");
    }

    const uploadPromises = request.files.map(async (file) => {
      const isVideo = file.mimetype.startsWith("video/");
      if (isVideo) {
        return uploadVideo(file.buffer, "portfolio");
      }
      return uploadImage(file.buffer, "portfolio");
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: request.user!.id },
      select: { portfolioUrls: true }
    });

    const updatedUrls = [...(profile?.portfolioUrls ?? []), ...urls];

    await prisma.studentProfile.update({
      where: { userId: request.user!.id },
      data: { portfolioUrls: updatedUrls }
    });

    response.json({ portfolioUrls: updatedUrls });
  })
);

profileRouter.delete(
  "/student/portfolio",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const { url } = request.body;
    if (!url) {
      throw AppError.badRequest("URL is required", "MISSING_URL");
    }

    await deleteAsset(url);

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: request.user!.id },
      select: { portfolioUrls: true }
    });

    const updatedUrls = (profile?.portfolioUrls ?? []).filter((u) => u !== url);

    await prisma.studentProfile.update({
      where: { userId: request.user!.id },
      data: { portfolioUrls: updatedUrls }
    });

    response.json({ portfolioUrls: updatedUrls });
  })
);

// Availability endpoints
profileRouter.get(
  "/student/availability",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const { availabilityService } = await import("../services/availability.service.js");
    const slots = await availabilityService.getAvailability(request.user!.id);
    const formatted = await availabilityService.getFormattedAvailability(request.user!.id);
    
    response.json({ 
      slots,
      formatted
    });
  })
);

profileRouter.put(
  "/student/availability",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const { availabilityService } = await import("../services/availability.service.js");
    const slotsSchema = z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23)
    }));
    
    const slots = slotsSchema.parse(request.body.slots);
    await availabilityService.updateAvailability(request.user!.id, slots);
    
    response.json({ 
      success: true,
      message: "Availability updated successfully"
    });
  })
);

profileRouter.put(
  "/student/urgent-opt-in",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const { availabilityService } = await import("../services/availability.service.js");
    const schema = z.object({
      optIn: z.boolean()
    });
    
    const { optIn } = schema.parse(request.body);
    await availabilityService.updateUrgentOptIn(request.user!.id, optIn);
    
    response.json({ 
      success: true,
      urgentOptIn: optIn
    });
  })
);

profileRouter.post(
  "/fcm-token",
  requireAuth,
  validate(fcmTokenSchema),
  asyncHandler(async (request, response) => {
    const { fcmToken } = fcmTokenSchema.parse(request.body);
    
    // Validate token with FCM
    const isValid = await validateFCMToken(fcmToken);
    if (!isValid) {
      throw AppError.badRequest("Invalid FCM token", "INVALID_FCM_TOKEN");
    }

    await prisma.user.update({
      where: { id: request.user!.id },
      data: { fcmToken }
    });

    response.json({ success: true });
  })
);

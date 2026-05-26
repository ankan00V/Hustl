import { Router, Request } from "express";
import { businessProfileSchema, routeParams, studentProfileSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadAvatar, uploadPortfolio } from "../middleware/upload.js";
import { uploadImage, uploadVideo, deleteAsset } from "../config/cloudinary.js";
import { AppError } from "../utils/app-error.js";

// Extend Express Request type to include multer file properties
interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

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

profileRouter.patch(
  "/student",
  requireAuth,
  requireRole("STUDENT"),
  validate(studentProfileSchema),
  asyncHandler(async (request, response) => {
    const input = studentProfileSchema.parse(request.body);
    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: request.user!.id },
        data: { bio: input.bio, avatarUrl: input.avatarUrl, college: input.collegeName }
      }),
      prisma.studentProfile.upsert({
        where: { userId: request.user!.id },
        create: {
          userId: request.user!.id,
          skills: input.skills ?? [],
          portfolioUrls: input.portfolioUrls ?? [],
          collegeName: input.collegeName ?? "",
          badges: [],
          availabilitySlots: input.availabilitySlots ?? []
        },
        update: {
          skills: input.skills,
          portfolioUrls: input.portfolioUrls,
          collegeName: input.collegeName,
          availabilitySlots: input.availabilitySlots
        }
      })
    ]);
    response.json({ user, profile });
  })
);

profileRouter.patch(
  "/business",
  requireAuth,
  requireRole("BUSINESS"),
  validate(businessProfileSchema),
  asyncHandler(async (request, response) => {
    const input = businessProfileSchema.parse(request.body);
    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: request.user!.id },
        data: { bio: input.bio, avatarUrl: input.avatarUrl }
      }),
      prisma.businessProfile.upsert({
        where: { userId: request.user!.id },
        create: {
          userId: request.user!.id,
          businessName: input.businessName ?? "HUSTL Business",
          category: input.category ?? "Local Business",
          address: input.address ?? "Pending"
        },
        update: {
          businessName: input.businessName,
          category: input.category,
          address: input.address
        }
      })
    ]);

    if (input.lat !== undefined && input.lng !== undefined) {
      await prisma.$executeRaw`
        UPDATE "BusinessProfile"
        SET coords = ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography
        WHERE "userId" = ${request.user!.id}
      `;
    }

    response.json({ user, profile });
  })
);

// Upload student avatar
profileRouter.post(
  "/student/avatar",
  requireAuth,
  requireRole("STUDENT"),
  uploadAvatar,
  asyncHandler(async (req, response) => {
    const request = req as MulterRequest;
    if (!request.file) {
      throw AppError.badRequest("No file uploaded");
    }

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { avatarUrl: true }
    });

    if (user?.avatarUrl) {
      // Extract public_id from Cloudinary URL
      const urlParts = user.avatarUrl.split("/");
      const publicIdWithExt = urlParts[urlParts.length - 1];
      if (publicIdWithExt) {
        const publicId = `avatars/${publicIdWithExt.split(".")[0]}`;
        await deleteAsset(publicId, "image").catch(() => {
          // Ignore deletion errors for old assets
        });
      }
    }

    // Upload new avatar
    const result = await uploadImage(
      request.file.buffer,
      "avatars",
      `avatar_${request.user!.id}`
    );

    // Update user avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: request.user!.id },
      data: { avatarUrl: result.url }
    });

    response.json({
      avatarUrl: updatedUser.avatarUrl,
      message: "Avatar uploaded successfully"
    });
  })
);

// Upload student portfolio assets
profileRouter.post(
  "/student/portfolio",
  requireAuth,
  requireRole("STUDENT"),
  uploadPortfolio,
  asyncHandler(async (req, response) => {
    const request = req as MulterRequest;
    if (!request.files || !Array.isArray(request.files) || request.files.length === 0) {
      throw AppError.badRequest("No files uploaded");
    }

    const uploadedUrls: string[] = [];

    // Upload each file to Cloudinary
    for (const file of request.files) {
      const isVideo = file.mimetype.startsWith("video/");
      const folder = isVideo ? "portfolio/videos" : "portfolio/images";
      const publicId = `${request.user!.id}_${Date.now()}`;

      const result = isVideo
        ? await uploadVideo(file.buffer, folder, publicId)
        : await uploadImage(file.buffer, folder, publicId);

      uploadedUrls.push(result.url);
    }

    // Get current portfolio URLs
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: request.user!.id },
      select: { portfolioUrls: true }
    });

    const currentUrls = profile?.portfolioUrls ?? [];
    const updatedUrls = [...currentUrls, ...uploadedUrls];

    // Update student profile with new portfolio URLs
    const updatedProfile = await prisma.studentProfile.update({
      where: { userId: request.user!.id },
      data: { portfolioUrls: updatedUrls }
    });

    response.json({
      portfolioUrls: updatedProfile.portfolioUrls,
      message: `${uploadedUrls.length} file(s) uploaded successfully`
    });
  })
);

// Delete portfolio asset
profileRouter.delete(
  "/student/portfolio",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(async (request, response) => {
    const { url } = request.body as { url: string };

    if (!url) {
      throw AppError.badRequest("URL is required");
    }

    // Get current portfolio URLs
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: request.user!.id },
      select: { portfolioUrls: true }
    });

    if (!profile?.portfolioUrls.includes(url)) {
      throw AppError.notFound("Portfolio asset not found");
    }

    // Extract public_id from Cloudinary URL
    const urlParts = url.split("/");
    const publicIdWithExt = urlParts.slice(-2).join("/"); // folder/filename.ext
    if (!publicIdWithExt) {
      throw AppError.badRequest("Invalid URL format");
    }
    const publicId = publicIdWithExt.split(".")[0]; // Remove extension
    if (!publicId) {
      throw AppError.badRequest("Invalid URL format");
    }
    const resourceType = url.includes("/videos/") ? "video" : "image";

    // Delete from Cloudinary
    await deleteAsset(publicId, resourceType);

    // Remove URL from database
    const updatedUrls = profile.portfolioUrls.filter((u) => u !== url);
    await prisma.studentProfile.update({
      where: { userId: request.user!.id },
      data: { portfolioUrls: updatedUrls }
    });

    response.json({ message: "Portfolio asset deleted successfully" });
  })
);

// Upload business avatar
profileRouter.post(
  "/business/avatar",
  requireAuth,
  requireRole("BUSINESS"),
  uploadAvatar,
  asyncHandler(async (req, response) => {
    const request = req as MulterRequest;
    if (!request.file) {
      throw AppError.badRequest("No file uploaded");
    }

    // Delete old avatar if exists
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: { avatarUrl: true }
    });

    if (user?.avatarUrl) {
      // Extract public_id from Cloudinary URL
      const urlParts = user.avatarUrl.split("/");
      const publicIdWithExt = urlParts[urlParts.length - 1];
      if (publicIdWithExt) {
        const publicId = `avatars/${publicIdWithExt.split(".")[0]}`;
        await deleteAsset(publicId, "image").catch(() => {
          // Ignore deletion errors for old assets
        });
      }
    }

    // Upload new avatar
    const result = await uploadImage(
      request.file.buffer,
      "avatars",
      `avatar_${request.user!.id}`
    );

    // Update user avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: request.user!.id },
      data: { avatarUrl: result.url }
    });

    response.json({
      avatarUrl: updatedUser.avatarUrl,
      message: "Avatar uploaded successfully"
    });
  })
);

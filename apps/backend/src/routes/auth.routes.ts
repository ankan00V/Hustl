import { Router } from "express";
import { randomBytes } from "node:crypto";
import { sendOtpSchema, verifyOtpSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";

export const authRouter = Router();

authRouter.post(
  "/send-otp",
  authRateLimiter,
  validate(sendOtpSchema),
  asyncHandler(async (request, response) => {
    const { phone } = sendOtpSchema.parse(request.body);
    const success = await sendOtp(phone);
    if (!success) {
      throw new AppError(500, "Failed to send OTP", "OTP_SEND_FAILED");
    }
    response.json({ success: true, message: "OTP sent successfully" });
  })
);

authRouter.post(
  "/verify-otp",
  authRateLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (request, response) => {
    const input = verifyOtpSchema.parse(request.body);
    const valid = await verifyOtp(input.phone, input.otp);
    if (!valid) {
      throw new AppError(401, "Invalid OTP", "INVALID_OTP");
    }

    let user = await prisma.user.findUnique({
      where: { phone: input.phone },
      select: { id: true, name: true, email: true, phone: true, role: true, reputationScore: true, referralCode: true }
    });

    if (user) {
      response.json({
        exists: true,
        user,
        token: signToken(user)
      });
      return;
    }

    // If user does not exist, check if name and role are provided for registration
    if (!input.name || !input.role) {
      response.json({
        exists: false,
        message: "User does not exist. Please select a role and enter your name to register."
      });
      return;
    }

    // Create a unique referral code
    const referralCode = `HSTL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Register user
    user = await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        role: input.role,
        referralCode,
        studentProfile:
          input.role === "STUDENT"
            ? { create: { skills: [], portfolioUrls: [], collegeName: "", badges: [], availabilitySlots: [] } }
            : undefined,
        businessProfile:
          input.role === "BUSINESS"
            ? { create: { businessName: input.name, category: "Local Business", address: "Pending" } }
            : undefined
      },
      select: { id: true, name: true, email: true, phone: true, role: true, reputationScore: true, referralCode: true }
    });

    // Check if referred by another user
    if (input.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: input.referredBy }
      });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            refereeId: user.id,
            code: input.referredBy,
            status: "SIGNED_UP"
          }
        });
      }
    }

    response.status(201).json({
      exists: true,
      user,
      token: signToken(user)
    });
  })
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Rotates refresh token for security
 */
authRouter.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const { refreshToken } = request.body;
    
    if (!refreshToken) {
      throw AppError.badRequest("Refresh token is required", "MISSING_REFRESH_TOKEN");
    }
    
    // Validate refresh token from Redis
    const refreshKey = `hustl:session:${refreshToken}`;
    const sessionData = await redis.get(refreshKey);
    
    if (!sessionData) {
      throw AppError.unauthorized("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }
    
    const session = JSON.parse(sessionData) as { userId: string; role: string };
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true }
    });
    
    if (!user) {
      throw AppError.unauthorized("User not found", "USER_NOT_FOUND");
    }
    
    // Delete old refresh token
    await redis.del(refreshKey);
    
    // Generate new tokens (token rotation)
    const newAccessToken = signToken(user);
    const newRefreshToken = randomBytes(32).toString("hex");
    
    // Store new refresh token
    const newRefreshKey = `hustl:session:${newRefreshToken}`;
    await redis.setex(
      newRefreshKey,
      30 * 24 * 60 * 60,
      JSON.stringify({ userId: user.id, role: user.role })
    );
    
    response.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: env.JWT_EXPIRES_IN
    });
  })
);

/**
 * POST /auth/logout
 * Logout user by deleting refresh token
 */
authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (request, response) => {
    const { refreshToken } = request.body;
    
    if (refreshToken) {
      const refreshKey = `hustl:session:${refreshToken}`;
      await redis.del(refreshKey);
    }
    
    response.json({ message: "Logged out successfully" });
  })
);

/**
 * GET /auth/me
 * Get current authenticated user
 */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: {
        studentProfile: true,
        businessProfile: true,
        badges: true
      }
    });
    
    if (!user) {
      throw AppError.notFound("User not found");
    }
    
    response.json({ user });
  })
);

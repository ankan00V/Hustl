import { Router } from "express";
import { randomBytes } from "node:crypto";
import { sendOtpSchema, verifyOtpSchema } from "@hustl/shared";
import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { twilioClient } from "../config/twilio.js";
import { env } from "../config/env.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";

export const authRouter = Router();

/**
 * POST /auth/otp/send
 * Send OTP to phone number via Twilio Verify
 * Rate limited: 3 requests per hour per phone
 */
authRouter.post(
  "/otp/send",
  otpRateLimiter,
  validate(sendOtpSchema),
  asyncHandler(async (request, response) => {
    const { phone } = sendOtpSchema.parse(request.body);
    
    // Check rate limit in Redis (3 sends per hour per phone)
    const rateLimitKey = `hustl:otp:ratelimit:${phone}`;
    const attempts = await redis.incr(rateLimitKey);
    
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 3600); // 1 hour TTL
    }
    
    if (attempts > 3) {
      throw AppError.tooManyRequests("Too many OTP requests. Try again in an hour.", "OTP_RATE_LIMIT");
    }
    
    // Send OTP via Twilio
    await twilioClient.sendOTP(phone);
    
    response.json({
      message: "OTP sent successfully",
      expiresIn: 600 // 10 minutes
    });
  })
);

/**
 * POST /auth/otp/verify
 * Verify OTP and create/login user
 * Returns JWT access token + refresh token
 */
authRouter.post(
  "/otp/verify",
  authRateLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (request, response) => {
    const input = verifyOtpSchema.parse(request.body);
    
    // Check OTP attempt count (max 3 attempts before 1hr lockout)
    const attemptKey = `hustl:otp:attempts:${input.phone}`;
    const attempts = await redis.incr(attemptKey);
    
    if (attempts === 1) {
      await redis.expire(attemptKey, 3600); // 1 hour TTL
    }
    
    if (attempts > 3) {
      throw AppError.tooManyRequests("Too many failed attempts. Try again in an hour.", "OTP_ATTEMPTS_EXCEEDED");
    }
    
    // Verify OTP with Twilio
    const isValid = await twilioClient.verifyOTP(input.phone, input.otp);
    
    if (!isValid) {
      throw AppError.unauthorized("Invalid or expired OTP", "INVALID_OTP");
    }
    
    // Clear attempt counter on successful verification
    await redis.del(attemptKey);
    
    // Find or create user
    let user = await prisma.user.findFirst({
      where: { phone: input.phone },
      include: {
        studentProfile: true,
        businessProfile: true
      }
    });

    if (!user) {
      // New user registration
      if (!input.role) {
        throw AppError.badRequest("Role is required for new user registration", "MISSING_ROLE");
      }
      
      if (!input.name) {
        throw AppError.badRequest("Name is required for new user registration", "MISSING_NAME");
      }
      
      user = await prisma.user.create({
        data: {
          phone: input.phone,
          name: input.name,
          role: input.role,
          studentProfile:
            input.role === "STUDENT"
              ? {
                  create: {
                    skills: [],
                    portfolioUrls: [],
                    collegeName: "",
                    badges: [],
                    availabilitySlots: []
                  }
                }
              : undefined,
          businessProfile:
            input.role === "BUSINESS"
              ? {
                  create: {
                    businessName: input.name,
                    category: "Uncategorized",
                    address: "Pending"
                  }
                }
              : undefined
        },
        include: {
          studentProfile: true,
          businessProfile: true
        }
      });
    }
    
    // Generate tokens
    const accessToken = signToken(user);
    const refreshToken = randomBytes(32).toString("hex");
    
    // Store refresh token in Redis (30 days TTL)
    const refreshKey = `hustl:session:${refreshToken}`;
    await redis.setex(
      refreshKey,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify({ userId: user.id, role: user.role })
    );

    response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        reputationScore: user.reputationScore,
        isVerified: user.isVerified,
        hasProfile: user.role === "STUDENT" ? Boolean(user.studentProfile) : Boolean(user.businessProfile)
      },
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN
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

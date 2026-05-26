import rateLimit from "express-rate-limit";

/**
 * General auth rate limiter
 * 20 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many auth attempts. Try again shortly."
    }
  }
});

/**
 * OTP send rate limiter
 * 5 requests per 15 minutes per IP
 * Additional per-phone rate limiting is handled in Redis
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "OTP_RATE_LIMITED",
      message: "Too many OTP requests. Try again shortly."
    }
  }
});

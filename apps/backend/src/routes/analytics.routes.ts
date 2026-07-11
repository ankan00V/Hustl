import { Router } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { prisma } from '../config/prisma.js';

const router = Router();

/**
 * Middleware to check PRO+ membership
 */
const checkProPlusMembership = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new AppError(401, 'Unauthorized');
  }

  // Get business profile
  const business = await prisma.businessProfile.findUnique({
    where: { userId },
    select: { currentTier: true },
  });

  if (!business) {
    throw new AppError(404, 'Business profile not found');
  }

  // Check if tier is PRO, ELITE, or PRO_PLUS
  if (!['PRO', 'ELITE', 'PRO_PLUS'].includes(business.currentTier)) {
    throw new AppError(403, 'Analytics feature requires PRO+ membership');
  }

  next();
});

/**
 * GET /analytics/swipe-rate
 * Get swipe rate per listing (right swipes / total impressions)
 * PRO+ only
 */
router.get(
  '/swipe-rate',
  requireAuth,
  requireRole('BUSINESS'),
  checkProPlusMembership,
  asyncHandler(async (req, res) => {
    const businessId = req.user?.id;

    if (!businessId) {
      throw new AppError(401, 'Unauthorized');
    }

    const swipeRate = await analyticsService.getSwipeRate(businessId);

    res.json({
      success: true,
      data: swipeRate,
    });
  })
);

/**
 * GET /analytics/applicant-score
 * Get average reputation score of applicants per listing
 * PRO+ only
 */
router.get(
  '/applicant-score',
  requireAuth,
  requireRole('BUSINESS'),
  checkProPlusMembership,
  asyncHandler(async (req, res) => {
    const businessId = req.user?.id;

    if (!businessId) {
      throw new AppError(401, 'Unauthorized');
    }

    const applicantScore = await analyticsService.getApplicantScore(businessId);

    res.json({
      success: true,
      data: applicantScore,
    });
  })
);

/**
 * GET /analytics/best-post-time
 * Get histogram of match acceptance times by hour of day
 * PRO+ only
 */
router.get(
  '/best-post-time',
  requireAuth,
  requireRole('BUSINESS'),
  checkProPlusMembership,
  asyncHandler(async (req, res) => {
    const businessId = req.user?.id;

    if (!businessId) {
      throw new AppError(401, 'Unauthorized');
    }

    const bestPostTime = await analyticsService.getBestPostTime(businessId);

    res.json({
      success: true,
      data: bestPostTime,
    });
  })
);

/**
 * GET /analytics/skill-demand
 * Get most in-demand skills in city over last 30 days
 * PRO+ only
 */
router.get(
  '/skill-demand',
  requireAuth,
  requireRole('BUSINESS'),
  checkProPlusMembership,
  asyncHandler(async (req, res) => {
    const businessId = req.user?.id;

    if (!businessId) {
      throw new AppError(401, 'Unauthorized');
    }

    const skillDemand = await analyticsService.getSkillDemand(businessId);

    res.json({
      success: true,
      data: skillDemand,
    });
  })
);

/**
 * GET /analytics/dashboard
 * Get comprehensive analytics dashboard data
 * PRO+ only
 */
router.get(
  '/dashboard',
  requireAuth,
  requireRole('BUSINESS'),
  checkProPlusMembership,
  asyncHandler(async (req, res) => {
    const businessId = req.user?.id;

    if (!businessId) {
      throw new AppError(401, 'Unauthorized');
    }

    const dashboard = await analyticsService.getDashboardAnalytics(businessId);

    res.json({
      success: true,
      data: dashboard,
    });
  })
);

export default router;

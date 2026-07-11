// @ts-nocheck
import { Router } from 'express';
import { auth } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/app-error.js';

const router = Router();

/**
 * Admin Dashboard Routes
 * Real-time monitoring and analytics for platform administrators
 */

// Middleware to check admin role
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
  next();
});

/**
 * GET /api/admin/dashboard/overview
 * Get real-time platform overview
 */
router.get(
  '/overview',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const cacheKey = 'admin:dashboard:overview';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get counts
    const [
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalMatches,
      completedShifts,
      totalRevenue,
      pendingDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      }),
      prisma.listing.count(),
      prisma.listing.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.match.count(),
      prisma.match.count({
        where: { status: 'COMPLETED' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'PAYMENT' },
      }),
      prisma.dispute.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // Get growth metrics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsers, newListings, newMatches] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.listing.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.match.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const overview = {
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        new: newListings,
        fillRate: totalListings > 0 ? (completedShifts / totalListings) * 100 : 0,
      },
      matches: {
        total: totalMatches,
        completed: completedShifts,
        new: newMatches,
        completionRate: totalMatches > 0 ? (completedShifts / totalMatches) * 100 : 0,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        currency: 'INR',
      },
      disputes: {
        pending: pendingDisputes,
      },
      timestamp: new Date().toISOString(),
    };

    // Cache for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(overview));

    res.json(overview);
  })
);

/**
 * GET /api/admin/dashboard/real-time
 * Get real-time activity feed
 */
router.get(
  '/real-time',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get recent activities
    const [recentUsers, recentListings, recentMatches, recentTransactions] = await Promise.all([
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.listing.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          business: {
            select: { name: true },
          },
        },
      }),
      prisma.match.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          listing: {
            select: { title: true },
          },
          student: {
            select: { name: true },
          },
        },
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Combine and sort by timestamp
    const activities = [
      ...recentUsers.map((u) => ({
        type: 'USER_SIGNUP',
        data: u,
        timestamp: u.createdAt,
      })),
      ...recentListings.map((l) => ({
        type: 'LISTING_CREATED',
        data: l,
        timestamp: l.createdAt,
      })),
      ...recentMatches.map((m) => ({
        type: 'MATCH_CREATED',
        data: m,
        timestamp: m.createdAt,
      })),
      ...recentTransactions.map((t) => ({
        type: 'TRANSACTION',
        data: t,
        timestamp: t.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json({ activities });
  })
);

/**
 * GET /api/admin/dashboard/metrics
 * Get detailed platform metrics
 */
router.get(
  '/metrics',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || '7d'; // 7d, 30d, 90d
    
    let daysAgo = 7;
    if (period === '30d') daysAgo = 30;
    if (period === '90d') daysAgo = 90;

    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get time-series data
    const dailyMetrics = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'users' as type
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'listings' as type
      FROM listings
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      
      UNION ALL
      
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'matches' as type
      FROM matches
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      
      ORDER BY date DESC
    `;

    // Group by type
    const metrics = {
      users: [] as any[],
      listings: [] as any[],
      matches: [] as any[],
    };

    dailyMetrics.forEach((row) => {
      if (row.type === 'users') metrics.users.push(row);
      if (row.type === 'listings') metrics.listings.push(row);
      if (row.type === 'matches') metrics.matches.push(row);
    });

    res.json({ metrics, period });
  })
);

/**
 * GET /api/admin/dashboard/users
 * Get user analytics
 */
router.get(
  '/users',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [
      byRole,
      byStatus,
      topStudents,
      topBusinesses,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        take: 10,
        orderBy: { reputation: 'desc' },
        select: {
          id: true,
          name: true,
          reputation: true,
          _count: {
            select: {
              matchesAsStudent: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: 'BUSINESS' },
        take: 10,
        orderBy: { reputation: 'desc' },
        select: {
          id: true,
          name: true,
          reputation: true,
          _count: {
            select: {
              listings: true,
            },
          },
        },
      }),
    ]);

    res.json({
      distribution: {
        byRole,
        byStatus,
      },
      topPerformers: {
        students: topStudents,
        businesses: topBusinesses,
      },
    });
  })
);

/**
 * GET /api/admin/dashboard/revenue
 * Get revenue analytics
 */
router.get(
  '/revenue',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const period = (req.query.period as string) || '30d';
    
    let daysAgo = 30;
    if (period === '7d') daysAgo = 7;
    if (period === '90d') daysAgo = 90;

    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const [totalRevenue, revenueByType, dailyRevenue] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        _count: true,
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
      prisma.$queryRaw<any[]>`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM transactions
        WHERE created_at >= ${startDate}
          AND status = 'COMPLETED'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
    ]);

    res.json({
      total: {
        amount: totalRevenue._sum.amount || 0,
        transactions: totalRevenue._count,
      },
      byType: revenueByType,
      daily: dailyRevenue,
      period,
    });
  })
);

/**
 * GET /api/admin/dashboard/health
 * Get system health metrics
 */
router.get(
  '/health',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Check database
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Check Redis
    const redisStart = Date.now();
    await redis.ping();
    const redisLatency = Date.now() - redisStart;

    // Get queue stats (if BullMQ is available)
    let queueStats = null;
    try {
      const { Queue } = await import('bullmq');
      const notificationQueue = new Queue('notifications', {
        connection: redis,
      });
      queueStats = {
        waiting: await notificationQueue.getWaitingCount(),
        active: await notificationQueue.getActiveCount(),
        completed: await notificationQueue.getCompletedCount(),
        failed: await notificationQueue.getFailedCount(),
      };
    } catch (error) {
      // Queue not available
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbLatency < 100 ? 'healthy' : 'degraded',
          latency: dbLatency,
        },
        redis: {
          status: redisLatency < 50 ? 'healthy' : 'degraded',
          latency: redisLatency,
        },
        queue: queueStats,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  })
);

/**
 * POST /api/admin/dashboard/broadcast
 * Send broadcast notification to all users
 */
router.post(
  '/broadcast',
  auth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { title, message, targetRole } = req.body;

    if (!title || !message) {
      throw new AppError('Title and message are required', 400);
    }

    // Get target users
    const where: any = {};
    if (targetRole) {
      where.role = targetRole;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, fcmToken: true },
    });

    // Queue notifications
    const { Queue } = await import('bullmq');
    const notificationQueue = new Queue('notifications', {
      connection: redis,
    });

    const jobs = users
      .filter((u) => u.fcmToken)
      .map((u) =>
        notificationQueue.add('send-notification', {
          userId: u.id,
          title,
          message,
          type: 'BROADCAST',
        })
      );

    await Promise.all(jobs);

    res.json({
      success: true,
      sent: jobs.length,
      total: users.length,
    });
  })
);

export default router;

// Made with Bob

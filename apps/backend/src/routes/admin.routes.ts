import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../config/prisma.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

// C1: Verification Queue
router.get("/verifications", async (req, res, next) => {
  try {
    const verifications = await prisma.verificationRequest.findMany({
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });
    // map subject to user for frontend compatibility
    res.json(verifications.map(v => ({...v, user: v.subject})));
  } catch (error) {
    next(error);
  }
});

router.post("/verifications/:id/approve", async (req, res, next) => {
  try {
    const { id } = req.params;
    const reqData = await prisma.verificationRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    if (reqData.subjectType === "STUDENT" || reqData.subjectType === "BUSINESS") {
      await prisma.user.update({
        where: { id: reqData.subjectId },
        data: { isVerified: true },
      });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/verifications/:id/reject", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.verificationRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// C2: Dispute Resolution
router.get("/disputes", async (req, res, next) => {
  try {
    const disputes = await prisma.disputeThread.findMany({
      include: { 
        match: {
          include: {
            listing: {
              include: {
                business: {
                  include: { user: true }
                }
              }
            },
            student: true
          }
        },
        openedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // Map data for frontend
    res.json(disputes.map(d => ({
      ...d,
      listing: d.match.listing,
      buyer: d.match.listing.business.user,
      seller: d.match.student
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/disputes/:id/resolve", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.disputeThread.update({
      where: { id },
      data: { status: "RESOLVED" }, 
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// C3: User Management
router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// C4: MRR Dashboard
router.get("/dashboard/stats", async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeListings = await prisma.listing.count({ where: { status: "OPEN" } });
    const totalRevenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    });
    const totalRevenue = totalRevenueAgg._sum.amount || 0;
    
    // Monthly revenue for chart
    const revenueByMonth = [
      { name: 'Jan', value: 4000 },
      { name: 'Feb', value: 3000 },
      { name: 'Mar', value: 2000 },
      { name: 'Apr', value: 2780 },
      { name: 'May', value: 1890 },
      { name: 'Jun', value: 2390 },
    ];
    
    res.json({
      totalUsers,
      activeListings,
      totalRevenue,
      revenueByMonth
    });
  } catch (error) {
    next(error);
  }
});

// C5: Campus Management
router.get("/colleges", async (req, res, next) => {
  try {
    const colleges = await prisma.college.findMany({
      orderBy: { name: "asc" },
    });
    res.json(colleges);
  } catch (error) {
    next(error);
  }
});

router.post("/colleges", async (req, res, next) => {
  try {
    const college = await prisma.college.create({
      data: req.body,
    });
    res.json(college);
  } catch (error) {
    next(error);
  }
});

// C6: Listing Moderation
router.get("/listings", async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      include: { 
        business: { include: { user: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(listings.map(l => ({
      ...l,
      seller: l.business.user,
      college: { name: l.citySlug } // Mock campus as citySlug since college relation doesn't exist
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/listings/:id/takedown", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.listing.update({
      where: { id },
      data: { status: "CLOSED" },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export const adminRoutes = router;

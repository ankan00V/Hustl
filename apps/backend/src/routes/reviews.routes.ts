import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { ReputationService } from "../services/reputation.service.js";
import { emitToUser } from "../realtime/socket.js";

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  matchId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

// Create a review
reviewsRouter.post(
  "/",
  requireAuth,
  validate(createReviewSchema),
  asyncHandler(async (request, response) => {
    const { matchId, revieweeId, rating, comment } = createReviewSchema.parse(request.body);
    const reviewerId = request.user!.id;

    // Verify match exists and is completed
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    if (match.status !== "COMPLETED") {
      throw AppError.badRequest(
        "Can only review completed matches",
        "MATCH_NOT_COMPLETED"
      );
    }

    // Verify reviewer is part of this match
    const isStudent = match.studentId === reviewerId;
    const isBusiness = match.listing.businessId === reviewerId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    // Verify reviewee is the other party
    const expectedRevieweeId = isStudent ? match.listing.businessId : match.studentId;
    if (revieweeId !== expectedRevieweeId) {
      throw AppError.badRequest(
        "Invalid reviewee for this match",
        "INVALID_REVIEWEE"
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        matchId_reviewerId_revieweeId: {
          matchId,
          reviewerId,
          revieweeId
        }
      }
    });

    if (existingReview) {
      throw AppError.conflict("You have already reviewed this match");
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        matchId,
        reviewerId,
        revieweeId,
        rating,
        comment
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    // Update reputation score
    const newScore = await ReputationService.updateAfterReview(revieweeId, matchId);

    // Emit notification to reviewee
    emitToUser(revieweeId, "hustl:review:received", {
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reviewer: review.reviewer
      },
      newReputationScore: newScore
    });

    response.status(201).json({
      review,
      newReputationScore: newScore
    });
  })
);

// Get reviews for a user
reviewsRouter.get(
  "/user/:userId",
  asyncHandler(async (request, response) => {
    const userId = request.params.userId as string;
    const page = parseInt(request.query.page as string) || 1;
    const limit = Math.min(parseInt(request.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Get reviews received by this user
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true
            }
          },
          match: {
            select: {
              id: true,
              listing: {
                select: {
                  title: true,
                  skills: true
                }
              }
            }
          }
        }
      }),
      prisma.review.count({
        where: { revieweeId: userId }
      })
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { revieweeId: userId },
      _count: {
        rating: true
      }
    });

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: {
        rating: true
      }
    });

    response.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        averageRating: avgRating._avg.rating || 0,
        totalReviews: total,
        ratingDistribution: ratingDistribution.reduce(
          (acc, curr) => {
            acc[curr.rating] = curr._count.rating;
            return acc;
          },
          {} as Record<number, number>
        )
      }
    });
  })
);

// Get reviews for a match
reviewsRouter.get(
  "/match/:matchId",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const userId = request.user!.id;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        listing: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    const isStudent = match.studentId === userId;
    const isBusiness = match.listing.businessId === userId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    // Get all reviews for this match
    const reviews = await prisma.review.findMany({
      where: { matchId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        },
        reviewee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    response.json({ reviews });
  })
);

// Get pending reviews for current user
reviewsRouter.get(
  "/pending",
  requireAuth,
  asyncHandler(async (request, response) => {
    const userId = request.user!.id;
    const userRole = request.user!.role;

    // Find completed matches where user hasn't left a review yet
    const completedMatches = await prisma.match.findMany({
      where: {
        status: "COMPLETED",
        ...(userRole === "STUDENT"
          ? { studentId: userId }
          : {
              listing: {
                businessId: userId
              }
            })
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            businessId: true,
            business: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        reviews: {
          where: {
            reviewerId: userId
          }
        }
      }
    });

    // Filter matches where user hasn't reviewed yet
    const pendingReviews = completedMatches
      .filter((match) => match.reviews.length === 0)
      .map((match) => ({
        matchId: match.id,
        reviewee:
          userRole === "STUDENT"
            ? {
                id: match.listing.businessId,
                name: match.listing.business.user.name,
                avatarUrl: match.listing.business.user.avatarUrl
              }
            : {
                id: match.student.id,
                name: match.student.name,
                avatarUrl: match.student.avatarUrl
              },
        listing: {
          id: match.listing.id,
          title: match.listing.title
        },
        completedAt: match.completedAt
      }));

    response.json({ pendingReviews });
  })
);

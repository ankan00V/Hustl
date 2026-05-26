import { z } from "zod";
import {
  ADMIN_ROLES,
  BOOST_SOURCES,
  BOOST_TARGET_TYPES,
  CHECK_IN_STATUSES,
  DISPUTE_STATUSES,
  LISTING_STATUSES,
  MATCH_STATUSES,
  MEMBERSHIP_TIERS,
  PORTFOLIO_ASSET_TYPES,
  REPORT_STATUSES,
  SWIPE_DIRECTIONS,
  USER_ROLES,
  VERIFICATION_STATUSES,
  VERIFICATION_SUBJECT_TYPES
} from "./types.js";

const id = z.string().uuid();
const optionalId = id.optional();
const csv = z
  .string()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

export const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15)
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  name: z.string().min(2).max(80).optional(),
  role: z.enum(USER_ROLES).optional()
});

export const listingQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().max(50000).default(5000),
  skills: csv.optional(),
  isUrgent: z.coerce.boolean().optional()
});

const listingFieldsSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(20).max(2000),
  skills: z.array(z.string().min(1).max(40)).min(1).max(12),
  hourlyRate: z.coerce.number().positive().max(10000),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isUrgent: z.boolean().default(false),
  verifiedBadgeOnly: z.boolean().default(false),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const createListingSchema = listingFieldsSchema.refine((data) => data.endTime > data.startTime, {
  message: "endTime must be after startTime",
  path: ["endTime"]
});

export const updateListingSchema = listingFieldsSchema.partial().extend({
  status: z.enum(LISTING_STATUSES).optional()
});

export const swipeSchema = z.object({
  listingId: id,
  direction: z.enum(SWIPE_DIRECTIONS)
});

export const matchStatusSchema = z.object({
  status: z.enum(MATCH_STATUSES)
});

export const adminInviteSchema = z.object({
  userId: id,
  role: z.enum(ADMIN_ROLES)
});

export const verificationDecisionSchema = z.object({
  subjectId: id,
  subjectType: z.enum(VERIFICATION_SUBJECT_TYPES),
  status: z.enum(VERIFICATION_STATUSES).exclude(["PENDING"]),
  notes: z.string().max(1000).optional()
});

export const reportMatchSchema = z.object({
  matchId: id,
  reason: z.string().min(5).max(1000)
});

export const updateReportStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  assignedToId: id.optional()
});

export const createDisputeMessageSchema = z.object({
  body: z.string().min(1).max(3000)
});

export const updateDisputeStatusSchema = z.object({
  status: z.enum(DISPUTE_STATUSES),
  assignedToId: id.optional()
});

export const matchCancellationSchema = z.object({
  reason: z.string().max(1000).optional()
});

export const markNoShowSchema = z.object({
  matchId: id,
  reason: z.string().max(1000).optional()
});

export const checkInSchema = z.object({
  matchId: id,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const confirmCheckInSchema = z.object({
  status: z.enum(CHECK_IN_STATUSES).extract(["BUSINESS_CONFIRMED", "CHECKED_OUT", "DISPUTED"]),
  confirmedMinutes: z.number().int().positive().max(24 * 60).optional()
});

export const reviewSchema = z.object({
  matchId: id,
  revieweeId: id,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export const studentProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  skills: z.array(z.string().min(1).max(40)).max(30).optional(),
  portfolioUrls: z.array(z.string().url()).max(12).optional(),
  collegeName: z.string().max(120).optional(),
  availabilitySlots: z.array(z.string().max(80)).max(20).optional()
});

export const portfolioAssetSchema = z.object({
  type: z.enum(PORTFOLIO_ASSET_TYPES),
  cloudinaryId: z.string().min(1).max(200),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).max(100).default(0)
});

export const businessProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  businessName: z.string().min(2).max(120).optional(),
  category: z.string().min(2).max(80).optional(),
  address: z.string().min(5).max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional()
});

export const membershipUpgradeSchema = z.object({
  tier: z.enum(MEMBERSHIP_TIERS).exclude(["FREE"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

export const boostPurchaseSchema = z.object({
  targetType: z.enum(BOOST_TARGET_TYPES),
  source: z.enum(BOOST_SOURCES).default("PAID"),
  listingId: id.optional(),
  category: z.string().min(1).max(80).optional()
}).refine((data) => data.targetType === "BUSINESS_LISTING" ? Boolean(data.listingId) : true, {
  message: "listingId is required for business listing boosts",
  path: ["listingId"]
});

export const payoutRequestSchema = z.object({
  amount: z.coerce.number().min(500).max(100000),
  upiId: z.string().min(3).max(120)
});

export const referralCreateSchema = z.object({
  code: z.string().min(4).max(40)
});

export const collegeSchema = z.object({
  name: z.string().min(2).max(160),
  city: z.string().max(120).optional(),
  emailDomains: z.array(z.string().min(3).max(120)).min(1).max(50)
});

export const routeParams = {
  id: z.object({ id }),
  userId: z.object({ userId: optionalId.or(id) })
};

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type BoostPurchaseInput = z.infer<typeof boostPurchaseSchema>;

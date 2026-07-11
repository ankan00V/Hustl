export const USER_ROLES = ["STUDENT", "BUSINESS", "ADMIN"] as const;
export const LISTING_STATUSES = ["OPEN", "POOLING", "MATCHED", "FILLED", "CLOSED", "CANCELLED", "COMPLETED"] as const;
export const SWIPE_DIRECTIONS = ["LEFT", "RIGHT"] as const;
export const MATCH_STATUSES = ["APPLIED", "PENDING", "ACCEPTED", "CHECKED_IN", "COMPLETED", "CANCELLED", "CANCELLED_LATE", "NO_SHOW", "DISPUTED", "AUTO_CHECKED_OUT"] as const;
export const MEMBERSHIP_TIERS = ["FREE", "PRO", "ELITE", "PRO_PLUS"] as const;
export const ADMIN_ROLES = ["SUPER_ADMIN", "OPS", "SUPPORT"] as const;
export const VERIFICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const VERIFICATION_SUBJECT_TYPES = ["STUDENT", "BUSINESS"] as const;
export const REPORT_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"] as const;
export const DISPUTE_STATUSES = ["OPEN", "WAITING_ON_STUDENT", "WAITING_ON_BUSINESS", "RESOLVED"] as const;
export const CHECK_IN_STATUSES = ["PENDING_STUDENT", "GEO_VERIFIED", "BUSINESS_CONFIRMED", "CHECKED_OUT", "DISPUTED"] as const;
export const BOOST_TARGET_TYPES = ["STUDENT_PROFILE", "BUSINESS_LISTING"] as const;
export const BOOST_SOURCES = ["PAID", "REFERRAL_REWARD", "ADMIN_GRANT"] as const;
export const BOOST_STATUSES = ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"] as const;
export const PORTFOLIO_ASSET_TYPES = ["IMAGE", "VIDEO"] as const;
export const WALLET_TRANSACTION_TYPES = ["ESCROW_RELEASE", "PAYOUT", "CANCELLATION_PENALTY", "WITHDRAWAL", "SHIFT_EARNING", "PLATFORM_FEE", "BOOST_PURCHASE", "MEMBERSHIP_PURCHASE", "REFERRAL_REWARD"] as const;
export const PAYMENT_STATUSES = ["ESCROW", "CAPTURED", "REFUNDED_FULL", "REFUNDED_PARTIAL"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type SwipeDirection = (typeof SWIPE_DIRECTIONS)[number];
export type MatchStatus = (typeof MATCH_STATUSES)[number];
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type VerificationSubjectType = (typeof VERIFICATION_SUBJECT_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type CheckInStatus = (typeof CHECK_IN_STATUSES)[number];
export type BoostTargetType = (typeof BOOST_TARGET_TYPES)[number];
export type BoostSource = (typeof BOOST_SOURCES)[number];
export type BoostStatus = (typeof BOOST_STATUSES)[number];
export type PortfolioAssetType = (typeof PORTFOLIO_ASSET_TYPES)[number];
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const MEMBERSHIP_LIMITS: Record<MembershipTier, { listingQuota: number; urgentEnabled: boolean }> = {
  FREE: { listingQuota: 2, urgentEnabled: false },
  PRO: { listingQuota: Number.MAX_SAFE_INTEGER, urgentEnabled: true },
  ELITE: { listingQuota: Number.MAX_SAFE_INTEGER, urgentEnabled: true },
  PRO_PLUS: { listingQuota: Number.MAX_SAFE_INTEGER, urgentEnabled: true }
};

export const HUSTL_BRAND = {
  colors: {
    base: "#050505",
    surface: "#111111",
    accent: "#F5A623",
    successFlash: "#22C55E"
  },
  checkInRadiusMeters: 200,
  lateCancellationWindowMinutes: 60,
  autoCheckoutThresholdHours: 2,
  lateCancellationReputationDelta: -0.3,
  noShowReputationDelta: -0.8,
  urgentNoShowSuspensionHours: 24,
  platformFeeRate: 0.08,
  tdsRate: 0.01,
  tdsQuarterlyThresholdInr: 2500,
  minimumWalletWithdrawalInr: 500,
  studentBoostPriceInr: 29,
  businessBoostPriceInr: 49,
  boostDurationHours: 24,
  referralStudentReward: "FREE_BOOST",
  referralBusinessReward: "FREE_PRO_MONTH"
} as const;

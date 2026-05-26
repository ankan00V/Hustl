import Razorpay from "razorpay";
import crypto from "node:crypto";
import { MEMBERSHIP_LIMITS, type MembershipTier } from "@hustl/shared";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

const prices: Record<Exclude<MembershipTier, "FREE">, number> = {
  PRO: 99900,
  ELITE: 249900,
  PRO_PLUS: 99900
};

type RazorpayOrderResult = {
  id: string;
  amount: string | number;
  currency: string;
};

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError(503, "Razorpay is not configured", "PAYMENTS_NOT_CONFIGURED");
  }

  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
}

export async function createMembershipCheckout(businessId: string, tier: Exclude<MembershipTier, "FREE">) {
  const order = await getRazorpay().orders.create({
    amount: prices[tier],
    currency: "INR",
    receipt: `hustl_${businessId}_${Date.now()}`,
    notes: { businessId, tier }
  }) as RazorpayOrderResult;

  return {
    provider: "razorpay",
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    tier
  };
}

export async function processRazorpayWebhook(signature: string | undefined, rawBody: Buffer) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) {
    throw new AppError(400, "Missing Razorpay webhook signature", "WEBHOOK_SIGNATURE_REQUIRED");
  }

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new AppError(401, "Invalid Razorpay webhook signature", "WEBHOOK_SIGNATURE_INVALID");
  }

  const event = JSON.parse(rawBody.toString("utf8")) as {
    event: string;
    payload?: { payment?: { entity?: { notes?: { businessId?: string; tier?: MembershipTier }; order_id?: string } } };
  };

  if (event.event !== "payment.captured") {
    return { ignored: true };
  }

  const payment = event.payload?.payment?.entity;
  const businessId = payment?.notes?.businessId;
  const tier = payment?.notes?.tier;
  if (!businessId || tier === "FREE" || !tier) {
    throw new AppError(400, "Webhook missing membership metadata", "WEBHOOK_METADATA_INVALID");
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);
  const limits = MEMBERSHIP_LIMITS[tier];

  await prisma.$transaction([
    prisma.membership.create({
      data: {
        businessId,
        tier,
        expiresAt,
        listingQuota: limits.listingQuota,
        razorpayOrderId: payment?.order_id
      }
    }),
    prisma.businessProfile.update({
      where: { userId: businessId },
      data: { currentTier: tier, isVerified: tier === "ELITE" ? true : undefined, badgeLevel: tier === "ELITE" ? "Verified" : undefined }
    })
  ]);

  return { ok: true };
}

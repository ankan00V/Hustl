import Razorpay from "razorpay";
import { env } from "../config/env.js";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Types
// Use Razorpay's native types
export type RazorpayOrder = any;
export type RazorpayPayment = any;
export type RazorpaySubscription = any;
export type RazorpayPayout = any;

// Helper functions
export async function createOrder(params: {
  amount: number; // in paise
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return razorpay.orders.create({
    amount: params.amount,
    currency: params.currency || "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

export async function fetchOrder(orderId: string): Promise<RazorpayOrder> {
  return razorpay.orders.fetch(orderId);
}

export async function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpay.payments.fetch(paymentId);
}

export async function capturePayment(
  paymentId: string,
  amount: number,
  currency = "INR"
): Promise<RazorpayPayment> {
  return razorpay.payments.capture(paymentId, amount, currency);
}

export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> {
  return razorpay.payments.refund(paymentId, {
    amount,
    notes,
  });
}

export async function createSubscription(params: {
  plan_id: string;
  customer_id: string;
  total_count: number;
  quantity?: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return razorpay.subscriptions.create(params);
}

export async function fetchSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
  return razorpay.subscriptions.fetch(subscriptionId);
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtCycleEnd = false
): Promise<RazorpaySubscription> {
  return razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

export async function createPayout(params: {
  account_number: string;
  fund_account_id: string;
  amount: number; // in paise
  currency?: string;
  mode: "UPI" | "IMPS" | "NEFT" | "RTGS";
  purpose: string;
  queue_if_low_balance?: boolean;
  reference_id: string;
  narration: string;
  notes?: Record<string, string>;
}): Promise<RazorpayPayout> {
  // Note: Payouts require Razorpay X account
  // This is a placeholder - actual implementation depends on Razorpay X setup
  throw new Error("Payout functionality requires Razorpay X account setup");
}

export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookBody)
      .digest("hex");
    return expectedSignature === webhookSignature;
  } catch (error) {
    return false;
  }
}

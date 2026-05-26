import { Router } from "express";
import { membershipUpgradeSchema } from "@hustl/shared";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createMembershipCheckout } from "../payments/razorpay.js";
import { asyncHandler } from "../utils/async-handler.js";

export const membershipsRouter = Router();

membershipsRouter.post(
  "/upgrade",
  requireAuth,
  requireRole("BUSINESS"),
  validate(membershipUpgradeSchema),
  asyncHandler(async (request, response) => {
    const { tier } = membershipUpgradeSchema.parse(request.body);
    response.status(201).json({ checkout: await createMembershipCheckout(request.user!.id, tier) });
  })
);

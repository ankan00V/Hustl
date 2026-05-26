import { Router } from "express";
import { processRazorpayWebhook } from "../payments/razorpay.js";
import { asyncHandler } from "../utils/async-handler.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/razorpay",
  asyncHandler(async (request, response) => {
    const result = await processRazorpayWebhook(
      request.header("x-razorpay-signature"),
      Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body))
    );
    response.json(result);
  })
);

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import analyticsRouter from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { badgesRouter } from "./routes/badges.routes.js";
import { boostsRouter } from "./routes/boosts.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { checkInRouter } from "./routes/checkin.routes.js";
import { listingsRouter } from "./routes/listings.routes.js";
import { matchesRouter } from "./routes/matches.routes.js";
import { membershipsRouter } from "./routes/memberships.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { referralsRouter } from "./routes/referrals.routes.js";
import { reviewsRouter } from "./routes/reviews.routes.js";
import { swipesRouter } from "./routes/swipes.routes.js";
import { walletRouter } from "./routes/wallet.routes.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { companionRouter } from "./routes/companion.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/webhooks", express.raw({ type: "application/json" }), webhooksRouter);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "hustl-api" });
  });

  app.use("/auth", authRouter);
  app.use("/listings", listingsRouter);
  app.use("/swipes", swipesRouter);
  app.use("/matches", matchesRouter);
  app.use("/reviews", reviewsRouter);
  app.use("/profile", profileRouter);
  app.use("/memberships", membershipsRouter);
  app.use("/badges", badgesRouter);
  app.use("/checkin", checkInRouter);
  app.use("/wallet", walletRouter);
  app.use("/boosts", boostsRouter);
  app.use("/referrals", referralsRouter);
  app.use("/chat", chatRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/admin", adminRoutes);
  app.use("/companion", companionRouter);
  app.use("/web", companionRouter);

  app.use(errorHandler);
  return app;
}

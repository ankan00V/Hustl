import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: false
});

redis.on("error", (error: Error) => {
  console.warn("Redis connection issue:", error.message);
});

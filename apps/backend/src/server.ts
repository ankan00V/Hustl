import http from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initSocket } from "./realtime/socket.js";
import "./services/auto-checkout.worker.js";
import "./jobs/notification.job.js";
import { initializeFirebase } from "./lib/fcm.js";

const app = createApp();
const server = http.createServer(app);

initSocket(server);

// Initialize Firebase for push notifications (optional, will warn if not configured)
try {
  initializeFirebase();
} catch (error) {
  console.warn("Firebase initialization skipped:", (error as Error).message);
}

server.listen(env.PORT, () => {
  console.log(`HUSTL API listening on :${env.PORT}`);
});

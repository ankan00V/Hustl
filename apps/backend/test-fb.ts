import dotenv from "dotenv";
import { resolve } from "path";
import admin from "firebase-admin";

dotenv.config({ path: resolve("../../.env") });

const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
let processedKey = rawKey.replace(/\\n/g, "\n").trim();
console.log("PROCESSED KEY LENGTH:", processedKey.length);
console.log("PROCESSED KEY STARTS WITH:", processedKey.substring(0, 30));
console.log("PROCESSED KEY ENDS WITH:", processedKey.substring(processedKey.length - 30));

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: processedKey
    })
  });
  console.log("SUCCESS");
} catch (err) {
  console.error("FAIL:", err.message);
}

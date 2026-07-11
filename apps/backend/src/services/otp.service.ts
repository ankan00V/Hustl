import twilio from "twilio";
import { env } from "../config/env.js";

let twilioClient: any = null;

if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
  twilioClient = (twilio as any)(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

export async function sendOtp(phone: string): Promise<boolean> {
  if (env.NODE_ENV === "development" || !twilioClient || !env.TWILIO_VERIFY_SERVICE_SID) {
    console.log(`[MOCK OTP] Sent OTP to ${phone}. Code is: 123456`);
    return true;
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    return verification.status === "pending";
  } catch (error) {
    console.error(`Failed to send OTP to ${phone}:`, error);
    if (env.NODE_ENV !== "production") {
      console.log(`[MOCK OTP FALLBACK] Sent OTP to ${phone}. Code is: 123456`);
      return true;
    }
    return false;
  }
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (env.NODE_ENV === "development" || !twilioClient || !env.TWILIO_VERIFY_SERVICE_SID) {
    return code === "123456";
  }

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    return verificationCheck.status === "approved";
  } catch (error) {
    console.error(`Failed to verify OTP for ${phone}:`, error);
    if (env.NODE_ENV !== "production") {
      return code === "123456";
    }
    return false;
  }
}

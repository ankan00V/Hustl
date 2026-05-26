import { env } from "./env.js";

/**
 * Twilio Verify client for OTP authentication
 * Uses Twilio Verify API for phone number verification
 */

interface TwilioVerifyResponse {
  status: "pending" | "approved" | "canceled";
  valid: boolean;
}

class TwilioClient {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private serviceSid: string | undefined;
  private baseUrl = "https://verify.twilio.com/v2";

  constructor() {
    this.accountSid = env.TWILIO_ACCOUNT_SID;
    this.authToken = env.TWILIO_AUTH_TOKEN;
    this.serviceSid = env.TWILIO_VERIFY_SERVICE_SID;
  }

  private get isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.serviceSid);
  }

  private getAuthHeader(): string {
    if (!this.accountSid || !this.authToken) {
      throw new Error("Twilio credentials not configured");
    }
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;
  }

  /**
   * Send OTP to phone number
   * @param phone - Phone number in E.164 format (e.g., +919876543210)
   * @returns Promise<void>
   */
  async sendOTP(phone: string): Promise<void> {
    // Development bypass
    if (env.DEV_BYPASS_OTP && env.NODE_ENV === "development") {
      console.log(`[DEV] Bypassing OTP send for ${phone}`);
      return;
    }

    if (!this.isConfigured) {
      throw new Error("Twilio Verify is not configured. Set TWILIO_* environment variables.");
    }

    const url = `${this.baseUrl}/Services/${this.serviceSid}/Verifications`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        To: phone,
        Channel: "sms"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio OTP send failed: ${error}`);
    }
  }

  /**
   * Verify OTP code
   * @param phone - Phone number in E.164 format
   * @param code - 6-digit OTP code
   * @returns Promise<boolean> - true if valid, false otherwise
   */
  async verifyOTP(phone: string, code: string): Promise<boolean> {
    // Development bypass - accept "123456" as valid OTP
    if (env.DEV_BYPASS_OTP && env.NODE_ENV === "development") {
      console.log(`[DEV] Bypassing OTP verify for ${phone}`);
      return code === "123456";
    }

    if (!this.isConfigured) {
      throw new Error("Twilio Verify is not configured. Set TWILIO_* environment variables.");
    }

    const url = `${this.baseUrl}/Services/${this.serviceSid}/VerificationCheck`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        To: phone,
        Code: code
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio OTP verify failed: ${error}`);
    }

    const data = await response.json() as TwilioVerifyResponse;
    return data.status === "approved" && data.valid;
  }
}

export const twilioClient = new TwilioClient();

// Made with Bob

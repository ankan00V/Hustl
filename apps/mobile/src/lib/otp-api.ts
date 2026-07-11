import Constants from "expo-constants";
import { useAuthStore } from "@/stores/auth";

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:4000";

export class OTPApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "OTPApiError";
  }
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<{ expiresIn: number }> {
  const response = await fetch(`${API_URL}/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new OTPApiError(
      body?.error?.message ?? `Request failed: ${response.status}`,
      response.status,
      body?.error?.code
    );
  }

  return response.json();
}

/**
 * Verify OTP and complete authentication
 */
export async function verifyOTP(
  phone: string,
  otp: string,
  name?: string,
  role?: "STUDENT" | "BUSINESS"
): Promise<{ user: any; token: string; refreshToken: string }> {
  const response = await fetch(`${API_URL}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, name, role }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new OTPApiError(
      body?.error?.message ?? `Request failed: ${response.status}`,
      response.status,
      body?.error?.code
    );
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // If refresh fails, logout user
    useAuthStore.getState().logout();
    throw new OTPApiError("Session expired", response.status);
  }

  return response.json();
}

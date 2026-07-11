import { createApp } from "./app.js";
import { initSocket, getSocket } from "./realtime/socket.js";
import { closeNotificationQueue } from "./jobs/notification.job.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
import { razorpay } from "./lib/razorpay.js";
import {
  queueConnection,
  autoCheckoutQueue,
  badgeMilestoneQueue,
  tdsCalculationQueue,
  pairInteractionQueue
} from "./lib/bullmq.js";
import http from "node:http";

// MANDATORY INTEGRITY WARNING
console.log(`
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
`);

// Mock Razorpay orders API to prevent external network calls
razorpay.orders = {
  ...razorpay.orders,
  create: async (params: any) => {
    console.log("[Mock Razorpay] Creating order", params);
    return {
      id: `order_${Math.random().toString(36).substring(2, 10)}`,
      amount: params.amount,
      currency: params.currency || "INR",
      receipt: params.receipt,
      status: "created",
    };
  }
} as any;

async function runTests() {
  const app = createApp();
  const server = http.createServer(app);
  const io = initSocket(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === "string" ? 0 : address?.port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Server] Started at ${baseUrl}`);

  const studentEmail = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`;
  const studentPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const studentName = "Student Tester";
  const studentPassword = "securePassword123";

  const businessEmail = `business_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`;
  const businessPhone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
  const businessName = "Business Tester";
  const businessPassword = "securePassword456";

  let studentId = "";
  let studentToken = "";
  let studentRefreshToken = "";

  let businessId = "";
  let businessToken = "";
  let businessRefreshToken = "";

  let listingId = "";
  let matchId = "";

  const sessionsToCleanRedis: string[] = [];

  async function apiCall(path: string, method: string, body?: any, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return {
      status: response.status,
      data,
    };
  }

  try {
    // 1. Signup STUDENT
    console.log("\n--- Assertion 1: Signup STUDENT ---");
    const signupStudentRes = await apiCall("/auth/signup", "POST", {
      name: studentName,
      email: studentEmail,
      phone: studentPhone,
      password: studentPassword,
      role: "STUDENT",
    });
    console.log("Signup STUDENT response status:", signupStudentRes.status);
    if (signupStudentRes.status !== 201) {
      throw new Error(`Signup student failed: ${JSON.stringify(signupStudentRes.data)}`);
    }
    studentId = signupStudentRes.data.user.id;
    console.log("Student ID:", studentId);

    // 2. Login STUDENT
    console.log("\n--- Assertion 2: Login STUDENT ---");
    const loginStudentRes = await apiCall("/auth/login", "POST", {
      email: studentEmail,
      password: studentPassword,
    });
    console.log("Login STUDENT response status:", loginStudentRes.status);
    if (loginStudentRes.status !== 200) {
      throw new Error(`Login student failed: ${JSON.stringify(loginStudentRes.data)}`);
    }
    const loginData = loginStudentRes.data;
    if (!loginData.token || !loginData.refreshToken || !loginData.user) {
      throw new Error(`Login student response missing fields: ${JSON.stringify(loginData)}`);
    }
    studentToken = loginData.token;
    studentRefreshToken = loginData.refreshToken;
    sessionsToCleanRedis.push(`hustl:session:${studentRefreshToken}`);
    console.log("Login STUDENT token and profile verified successfully.");

    // 3. Unauthorized check
    console.log("\n--- Assertion 3: Unauthorized check ---");
    const unauthRes = await apiCall("/companion/applied", "GET");
    console.log("Unauthorized check response status:", unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthorized request, got ${unauthRes.status}`);
    }
    console.log("Unauthorized check verified successfully (returned 401).");

    // 4. Applied check
    console.log("\n--- Assertion 4: Applied check (empty initially) ---");
    const appliedRes = await apiCall("/companion/applied", "GET", undefined, studentToken);
    console.log("Applied check response status:", appliedRes.status);
    if (appliedRes.status !== 200) {
      throw new Error(`Applied check failed: ${JSON.stringify(appliedRes.data)}`);
    }
    if (!Array.isArray(appliedRes.data.matches)) {
      throw new Error(`Expected matches array, got: ${JSON.stringify(appliedRes.data)}`);
    }
    console.log("Applied check verified successfully.");

    // 5. Saved listing check
    console.log("\n--- Assertion 5: Saved listing check ---");
    // Register business
    console.log("Registering BUSINESS user...");
    const signupBusinessRes = await apiCall("/auth/signup", "POST", {
      name: businessName,
      email: businessEmail,
      phone: businessPhone,
      password: businessPassword,
      role: "BUSINESS",
    });
    if (signupBusinessRes.status !== 201) {
      throw new Error(`Signup business failed: ${JSON.stringify(signupBusinessRes.data)}`);
    }
    businessId = signupBusinessRes.data.user.id;
    businessRefreshToken = signupBusinessRes.data.refreshToken;
    sessionsToCleanRedis.push(`hustl:session:${businessRefreshToken}`);
    
    // Login business
    console.log("Logging in BUSINESS user...");
    const loginBusinessRes = await apiCall("/auth/login", "POST", {
      email: businessEmail,
      password: businessPassword,
    });
    if (loginBusinessRes.status !== 200) {
      throw new Error(`Login business failed: ${JSON.stringify(loginBusinessRes.data)}`);
    }
    businessToken = loginBusinessRes.data.token;

    // Create a listing as business
    console.log("Creating listing as BUSINESS user...");
    const createListingRes = await apiCall("/listings", "POST", {
      title: "Gig for Student Verification Tester",
      description: "This is a detailed description of the testing gig. It has more than 20 characters.",
      skills: ["Testing", "Node.js"],
      hourlyRate: 500,
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      isUrgent: false,
      verifiedBadgeOnly: false,
      lat: 12.9716,
      lng: 77.5946,
    }, businessToken);
    
    if (createListingRes.status !== 201) {
      throw new Error(`Create listing failed: ${JSON.stringify(createListingRes.data)}`);
    }
    listingId = createListingRes.data.listing.id;
    console.log("Created Listing ID:", listingId);

    // Save listing as student
    console.log("Saving listing as STUDENT...");
    const saveListingRes = await apiCall(`/listings/${listingId}/save`, "POST", undefined, studentToken);
    console.log("Save listing response status:", saveListingRes.status);
    if (saveListingRes.status !== 201) {
      throw new Error(`Save listing failed: ${JSON.stringify(saveListingRes.data)}`);
    }

    // Fetch saved listings
    console.log("Fetching saved listings...");
    const savedListingsRes = await apiCall("/companion/saved", "GET", undefined, studentToken);
    console.log("Saved listings response status:", savedListingsRes.status);
    if (savedListingsRes.status !== 200) {
      throw new Error(`Fetch saved listings failed: ${JSON.stringify(savedListingsRes.data)}`);
    }
    const listings = savedListingsRes.data.listings;
    const isSaved = listings.some((l: any) => l.id === listingId);
    if (!isSaved) {
      throw new Error("Created listing was not found in saved listings response.");
    }
    console.log("Verified listing is in saved listings response.");

    // Unsave listing
    console.log("Unsaving listing...");
    const unsaveRes = await apiCall(`/listings/${listingId}/save`, "DELETE", undefined, studentToken);
    console.log("Unsave listing response status:", unsaveRes.status);
    if (unsaveRes.status !== 200) {
      throw new Error(`Unsave listing failed: ${JSON.stringify(unsaveRes.data)}`);
    }
    console.log("Saved listing check completed successfully.");

    // 6. Active listings check
    console.log("\n--- Assertion 6: Active listings check ---");
    // Swipe right as student
    console.log("Student swiping right to apply...");
    const swipeRes = await apiCall("/swipes", "POST", {
      listingId,
      direction: "RIGHT",
    }, studentToken);
    console.log("Swipe response status:", swipeRes.status);
    if (swipeRes.status !== 201) {
      throw new Error(`Swipe right failed: ${JSON.stringify(swipeRes.data)}`);
    }
    matchId = swipeRes.data.match.id;
    console.log("Created Match ID:", matchId);

    // Accept match as business
    console.log("Business accepting the match...");
    const acceptRes = await apiCall(`/matches/${matchId}/status`, "PATCH", {
      status: "ACCEPTED",
    }, businessToken);
    console.log("Accept match response status:", acceptRes.status);
    if (acceptRes.status !== 200) {
      throw new Error(`Accept match failed: ${JSON.stringify(acceptRes.data)}`);
    }

    // Fetch active matches as student
    console.log("Fetching active matches...");
    const activeRes = await apiCall("/companion/active", "GET", undefined, studentToken);
    console.log("Active matches response status:", activeRes.status);
    if (activeRes.status !== 200) {
      throw new Error(`Fetch active matches failed: ${JSON.stringify(activeRes.data)}`);
    }
    const activeMatches = activeRes.data.matches;
    const isMatchActive = activeMatches.some((m: any) => m.id === matchId && m.status === "ACCEPTED");
    if (!isMatchActive) {
      throw new Error("Accepted match is not in active matches response.");
    }
    console.log("Verified accepted match is in active matches response.");

    // 7. Earnings check
    console.log("\n--- Assertion 7: Earnings check ---");
    // Directly write a WalletTransaction in the DB
    console.log("Directly creating a WalletTransaction in DB...");
    await prisma.wallet.upsert({
      where: { userId: studentId },
      update: {},
      create: {
        userId: studentId,
        availableBalance: 1000,
        pendingBalance: 0,
        currency: "INR",
      },
    });

    const txIdempotencyKey = `earning_verification_test_${Date.now()}`;
    await prisma.walletTransaction.create({
      data: {
        walletUserId: studentId,
        type: "SHIFT_EARNING",
        status: "POSTED",
        grossAmount: 1000.00,
        tdsAmount: 10.00,
        netAmount: 990.00,
        amount: 990.00,
        platformFee: 80.00,
        idempotencyKey: txIdempotencyKey,
        postedAt: new Date(),
      },
    });

    // Fetch companion earnings
    console.log("Fetching companion earnings...");
    const earningsRes = await apiCall("/companion/earnings", "GET", undefined, studentToken);
    console.log("Earnings response status:", earningsRes.status);
    if (earningsRes.status !== 200) {
      throw new Error(`Fetch companion earnings failed: ${JSON.stringify(earningsRes.data)}`);
    }
    const earningsData = earningsRes.data;
    console.log("Earnings Data:", {
      totalGrossEarnings: earningsData.totalGrossEarnings,
      totalNetEarnings: earningsData.totalNetEarnings,
    });
    if (earningsData.totalGrossEarnings !== 1000 || earningsData.totalNetEarnings !== 990) {
      throw new Error(`Earnings mismatch! Expected gross 1000 and net 990, got gross ${earningsData.totalGrossEarnings} and net ${earningsData.totalNetEarnings}`);
    }
    console.log("Verified earnings total and net match transaction amounts.");

    console.log("\n=== ALL ASSERTIONS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("Test execution failed:", error);
    process.exitCode = 1;
  } finally {
    console.log("\n--- Cleaning up database test records ---");
    try {
      if (studentId) {
        // Clear wallet transactions
        await prisma.walletTransaction.deleteMany({
          where: { walletUserId: studentId },
        });
        // Clear wallet
        await prisma.wallet.deleteMany({
          where: { userId: studentId },
        });
      }

      if (listingId) {
        // Clear payments
        await prisma.payment.deleteMany({
          where: { match: { listingId } },
        });
        // Clear matches
        await prisma.match.deleteMany({
          where: { listingId },
        });
        // Clear swipes
        await prisma.swipe.deleteMany({
          where: { listingId },
        });
        // Clear listings
        await prisma.listing.deleteMany({
          where: { id: listingId },
        });
      }

      if (studentId) {
        await prisma.user.delete({
          where: { id: studentId },
        });
        console.log("Cleaned up student user.");
      }

      if (businessId) {
        await prisma.user.delete({
          where: { id: businessId },
        });
        console.log("Cleaned up business user.");
      }

      // Clean refresh sessions from Redis
      for (const sessionKey of sessionsToCleanRedis) {
        await redis.del(sessionKey);
      }
      console.log("Cleaned up session keys from Redis.");

    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }

    console.log("Closing connections...");
    // Close Server
    server.close();
    console.log("Server closed.");
    // Close Socket.io
    io.close();
    console.log("Socket server closed.");
    // Close Notification queue and worker
    await closeNotificationQueue();
    console.log("Notification queue and worker closed.");
    // Close BullMQ queues and connection
    try {
      await autoCheckoutQueue.close();
      await badgeMilestoneQueue.close();
      await tdsCalculationQueue.close();
      await pairInteractionQueue.close();
      await queueConnection.quit();
      console.log("BullMQ queues and connection closed.");
    } catch (bullmqError) {
      console.error("Failed to close BullMQ queues:", bullmqError);
    }
    // Disconnect Redis
    await redis.quit();
    console.log("Redis connection closed.");
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  }
}

runTests();

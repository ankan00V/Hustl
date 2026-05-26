import type { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

export type HustlSocketServer = Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
}

let io: HustlSocketServer | undefined;

// Socket authentication middleware
async function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user.id;
    socket.role = user.role;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true
    }
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const role = socket.role!;

    // Auto-join user to their personal room
    socket.join(`user:${userId}`);
    
    if (role === "STUDENT") {
      socket.join(`student:${userId}`);
    } else if (role === "BUSINESS") {
      socket.join(`business:${userId}`);
    }

    // Match namespace events
    socket.on("hustl:match:join", (matchId: string) => {
      socket.join(`match:${matchId}`);
    });

    socket.on("hustl:match:leave", (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    // Chat namespace events
    socket.on("hustl:chat:join", (matchId: string) => {
      socket.join(`chat:${matchId}`);
    });

    socket.on("hustl:chat:leave", (matchId: string) => {
      socket.leave(`chat:${matchId}`);
    });

    socket.on("hustl:chat:typing", (matchId: string) => {
      socket.to(`chat:${matchId}`).emit("hustl:chat:user_typing", { userId });
    });

    socket.on("hustl:chat:stop_typing", (matchId: string) => {
      socket.to(`chat:${matchId}`).emit("hustl:chat:user_stop_typing", { userId });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      // Cleanup handled automatically by socket.io
    });
  });

  return io;
}

export function getSocket() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}

// Helper functions to emit events
export function emitToUser(userId: string, event: string, data: unknown) {
  getSocket().to(`user:${userId}`).emit(event, data);
}

export function emitToMatch(matchId: string, event: string, data: unknown) {
  getSocket().to(`match:${matchId}`).emit(event, data);
}

export function emitToChat(matchId: string, event: string, data: unknown) {
  getSocket().to(`chat:${matchId}`).emit(event, data);
}

export function emitUrgentListingNearby(studentIds: string[], listingData: unknown) {
  studentIds.forEach((studentId) => {
    getSocket().to(`student:${studentId}`).emit("hustl:urgent:nearby", listingData);
  });
}

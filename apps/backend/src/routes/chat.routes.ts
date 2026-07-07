import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { emitToChat } from "../realtime/socket.js";

export const chatRouter = Router();

const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000)
});

const chatQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().positive().max(100).default(50)
});

// Get chat history for a match
chatRouter.get(
  "/:matchId",
  requireAuth,
  validate(chatQuerySchema, "query"),
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const { cursor, limit } = chatQuerySchema.parse(request.query);
    const userId = request.user!.id;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    const isStudent = match.studentId === userId;
    const isBusiness = match.listing.businessId === userId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    // Build cursor-based pagination query
    const messages = await prisma.chatMessage.findMany({
      where: {
        matchId,
        ...(cursor ? { id: { lt: cursor } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    // Mark messages as read
    const unreadMessageIds = messages
      .filter((msg) => msg.senderId !== userId && !msg.readAt)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.chatMessage.updateMany({
        where: { id: { in: unreadMessageIds } },
        data: { readAt: new Date() }
      });

      // Emit read receipts
      emitToChat(matchId, "hustl:chat:messages_read", {
        messageIds: unreadMessageIds,
        readBy: userId
      });
    }

    const nextCursor = messages.length === limit ? messages[messages.length - 1]?.id : null;

    response.json({
      messages: messages.reverse(), // Return in chronological order
      nextCursor,
      hasMore: messages.length === limit
    });
  })
);

// Send a message
chatRouter.post(
  "/:matchId",
  requireAuth,
  validate(sendMessageSchema),
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const { body } = sendMessageSchema.parse(request.body);
    const userId = request.user!.id;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    const isStudent = match.studentId === userId;
    const isBusiness = match.listing.businessId === userId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    // Verify match is in valid state for chat
    const validStatuses = ["ACCEPTED", "CHECKED_IN", "COMPLETED"];
    if (!validStatuses.includes(match.status)) {
      throw AppError.badRequest(
        "Chat is only available for accepted, checked-in, or completed matches",
        "INVALID_MATCH_STATUS"
      );
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        matchId,
        senderId: userId,
        body
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });

    // Emit to chat room
    emitToChat(matchId, "hustl:chat:message", message);

    // Determine recipient
    const recipientId = isStudent ? match.listing.businessId : match.studentId;

    // Emit notification to recipient's personal room
    emitToChat(matchId, "hustl:chat:new_message", {
      matchId,
      messageId: message.id,
      senderId: userId,
      senderName: message.sender.name,
      preview: body.substring(0, 100)
    });

    response.status(201).json({ message });
  })
);

// Get unread message count for a match
chatRouter.get(
  "/:matchId/unread",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const userId = request.user!.id;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    const isStudent = match.studentId === userId;
    const isBusiness = match.listing.businessId === userId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    const unreadCount = await prisma.chatMessage.count({
      where: {
        matchId,
        senderId: { not: userId },
        readAt: null
      }
    });

    response.json({ unreadCount });
  })
);

// Mark all messages as read
chatRouter.post(
  "/:matchId/read",
  requireAuth,
  asyncHandler(async (request, response) => {
    const matchId = request.params.matchId as string;
    const userId = request.user!.id;

    // Verify user is part of this match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { listing: true }
    });

    if (!match) {
      throw AppError.notFound("Match not found");
    }

    const isStudent = match.studentId === userId;
    const isBusiness = match.listing.businessId === userId;

    if (!isStudent && !isBusiness) {
      throw AppError.forbidden("You are not part of this match");
    }

    // Get unread message IDs
    const unreadMessages = await prisma.chatMessage.findMany({
      where: {
        matchId,
        senderId: { not: userId },
        readAt: null
      },
      select: { id: true }
    });

    const messageIds = unreadMessages.map((msg) => msg.id);

    if (messageIds.length > 0) {
      await prisma.chatMessage.updateMany({
        where: { id: { in: messageIds } },
        data: { readAt: new Date() }
      });

      // Emit read receipts
      emitToChat(matchId, "hustl:chat:messages_read", {
        messageIds,
        readBy: userId
      });
    }

    response.json({ markedAsRead: messageIds.length });
  })
);

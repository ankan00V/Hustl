import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@hustl/shared";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

type TokenPayload = {
  sub: string;
  role: UserRole;
};

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = request.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    next(AppError.unauthorized("Authentication required", "AUTH_REQUIRED"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
    if (!user) {
      throw AppError.unauthorized("Invalid authentication token", "AUTH_INVALID");
    }
    request.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized("Token expired", "TOKEN_EXPIRED"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized("Invalid token", "TOKEN_INVALID"));
    } else {
      next(error instanceof AppError ? error : AppError.unauthorized("Invalid authentication token", "AUTH_INVALID"));
    }
  }
}

export function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      next(AppError.unauthorized("Authentication required", "AUTH_REQUIRED"));
      return;
    }
    if (request.user.role !== role) {
      next(AppError.forbidden(`${role} role required`, "FORBIDDEN_ROLE"));
      return;
    }
    next();
  };
}

export function signToken(user: { id: string; role: UserRole }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
}

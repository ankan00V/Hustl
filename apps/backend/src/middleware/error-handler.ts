import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { isProduction } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { randomUUID } from "node:crypto";

/**
 * Central error handler middleware
 * Catches all errors and returns consistent JSON responses
 * Never exposes stack traces in production
 */
export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const requestId = randomUUID();
  
  // Log error with request context
  console.error({
    requestId,
    method: request.method,
    path: request.path,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack
    } : error
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request input",
        issues: error.flatten(),
        requestId
      }
    });
    return;
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      response.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Resource already exists",
          requestId
        }
      });
      return;
    }
    
    // Record not found
    if (error.code === "P2025") {
      response.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
          requestId
        }
      });
      return;
    }
  }

  // Application errors
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        requestId
      }
    });
    return;
  }

  // Unknown errors
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "Something went wrong" : error.message,
      requestId
    }
  });
};

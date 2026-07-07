import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates the need for try-catch blocks in every route handler
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await prisma.user.findMany();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

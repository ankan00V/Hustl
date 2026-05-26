import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: ValidationTarget = "body") {
  return (request: Request, _response: Response, next: NextFunction) => {
    request[target] = schema.parse(request[target]);
    next();
  };
}

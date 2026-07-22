import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncRoute(handler: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };
}

export function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    message: "Invalid request",
    errors: error.flatten(),
  });
}

export function requireSessionUserId(req: Request, res: Response): string | null {
  if (!req.session?.userId) {
    res.status(401).json({ message: "Unauthorised" });
    return null;
  }
  return req.session.userId;
}

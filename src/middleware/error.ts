import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} validation failed`, err.flatten());
    res.status(400).json({
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Error) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.stack ?? err.message);
    res.status(500).json({ message: err.message });
    return;
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} Unknown error`, err);
  res.status(500).json({ message: "Unexpected server error" });
}

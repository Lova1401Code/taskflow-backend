import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[HTTP] ${method} ${originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
}

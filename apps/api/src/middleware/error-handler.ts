import type { Request, Response, NextFunction } from "express";
import { AppError } from "../core/errors/index.ts";
import { logger } from "../core/logger/index.ts";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const reqId = (req as any).id || "unknown";

  if (err instanceof AppError) {
    logger.warn({
      reqId,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    }, `AppError [${err.code}]: ${err.message}`);

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unhandled / Internal Server Error
  logger.error({
    reqId,
    path: req.path,
    method: req.method,
    err: err?.stack || err?.message || err,
  }, `Unhandled Server Error: ${err?.message || "Internal Server Error"}`);

  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred"
      : err?.message || "Internal Server Error";

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
}

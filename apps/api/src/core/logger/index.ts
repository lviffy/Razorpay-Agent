import pino from "pino";
import { env } from "../../config/env.ts";

const isDev = env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}

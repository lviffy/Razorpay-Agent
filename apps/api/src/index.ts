import { app } from "./app.ts";
import { env } from "./config/env.ts";
import { logger } from "./core/logger/index.ts";
import { migrate } from "@zapai/database";
import { redis } from "./integrations/redis/index.ts";
import { startWhatsAppWorker, stopWhatsAppWorker } from "./workers/whatsapp-worker.ts";

async function main() {
  try {
    logger.info("⚡ Bootstrapping ZapAI Backend API...");

    // 1. Run database schema migrations
    try {
      await migrate();
      logger.info("✅ Database schema migrated and verified.");
    } catch (dbErr: any) {
      logger.warn({ err: dbErr.message }, "Database migration check failed or skipped");
    }

    // 2. Test Redis connectivity
    try {
      if (redis) {
        await redis.ping();
        logger.info("✅ Redis connected successfully");
      } else {
        logger.info("ℹ️ Running in-memory queue & mutex mode");
      }
    } catch (redisErr) {
      logger.warn("⚠️ Redis unavailable — running in-memory fallback queue and mutexes");
    }

    // 3. Start background worker
    startWhatsAppWorker();

    // 4. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 ZapAI Server running on port ${env.PORT} [${env.NODE_ENV}]`
      );
      logger.info(`   • REST API: http://localhost:${env.PORT}/api/v1`);
      logger.info(`   • Live Demo: http://localhost:${env.PORT}/demo`);
      logger.info(`   • Webhooks: http://localhost:${env.PORT}/webhooks`);
    });

    // 5. Graceful shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Gracefully shutting down...`);
      stopWhatsAppWorker();
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error("Forceful shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (err: any) {
    logger.fatal({ err: err.message }, "Fatal error during startup");
    process.exit(1);
  }
}

main();

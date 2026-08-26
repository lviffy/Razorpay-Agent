import { dequeueJob } from "../integrations/redis/index.ts";
import { processInboundMessage } from "../modules/agent/orchestrator.ts";
import type { WorkerJob } from "@zapai/types";
import { logger } from "../core/logger/index.ts";

let running = false;

export function startWhatsAppWorker(): void {
  if (running) return;
  running = true;
  processLoop();
}

export function stopWhatsAppWorker(): void {
  running = false;
}

async function processLoop(): Promise<void> {
  logger.info("[Worker] WhatsApp worker started — polling queue...");
  while (running) {
    try {
      const job = (await dequeueJob(5)) as WorkerJob | null;
      if (!job) continue;

      logger.info({ jobType: job.type }, "[Worker] Processing job");
      await handleJob(job);
    } catch (err) {
      logger.error({ err }, "[Worker] Error processing job");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function handleJob(job: WorkerJob): Promise<void> {
  try {
    await processInboundMessage(job);
  } catch (err) {
    logger.error({ err }, "[Worker] Failed to process message via conversation orchestrator");
  }
}

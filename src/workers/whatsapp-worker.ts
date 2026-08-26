import { dequeueJob } from "../services/redis.ts";
import { processInboundMessage } from "../conversation/orchestrator.ts";
import type { WorkerJob } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Worker — processes jobs from Redis queue asynchronously
// Runs in same process as Express (no separate service needed for demo)
// ─────────────────────────────────────────────────────────────────────────────

let running = false;

export function startWhatsAppWorker(): void {
  if (running) return;
  running = true;
  processLoop();
}

async function processLoop(): Promise<void> {
  console.log("[Worker] WhatsApp worker started — polling Redis queue...");
  while (running) {
    try {
      const job = (await dequeueJob(5)) as WorkerJob | null;
      if (!job) continue;

      console.log(`[Worker] Processing job: ${job.type}`);
      await handleJob(job);
    } catch (err) {
      console.error("[Worker] Error processing job:", err);
      // Brief pause before retrying on error
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function handleJob(job: WorkerJob): Promise<void> {
  try {
    await processInboundMessage(job);
  } catch (err) {
    console.error("[Worker] Failed to process message via conversation orchestrator:", err);
  }
}

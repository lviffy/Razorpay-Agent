import { Router } from "express";
import { createHmac } from "crypto";
import { enqueueJob } from "../../integrations/redis/index.ts";
import { appendMessage } from "../../services/conversation-memory.ts";
import { db } from "@zapai/database";
import type { WhatsAppInboundMessage, WorkerJob } from "@zapai/types";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

// GET /webhooks/whatsapp — Meta webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === (env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "zapai_meta_webhook_secret_2026")) {
    logger.info("✅ WhatsApp webhook verified by Meta");
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
});

// POST /webhooks/whatsapp — Inbound messages
router.post("/", async (req, res) => {
  res.status(200).json({ status: "received" });

  try {
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    if (!verifyMetaSignature(rawBody, signature)) {
      logger.warn("⚠️ Invalid Meta webhook signature — dropping");
      return;
    }

    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.length) return;

    for (const message of value.messages) {
      const msg = parseInboundMessage(message, value);
      if (!msg) continue;

      logger.info({ from: msg.from, text: msg.text }, "📱 WA message received");

      // Look up the active store so conversations are tagged with the correct store_id
      let activeStoreId: string | undefined;
      try {
        const { rows: storeRows } = await db.query(
          "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
        );
        activeStoreId = storeRows[0]?.id;
      } catch { /* ignore — store_id stays null */ }

      await appendMessage(msg.conversationId, msg.from, "customer", msg.text, {
        storeId: activeStoreId,
      });

      const job: WorkerJob = {
        type: "INBOUND_MESSAGE",
        payload: msg,
      };
      await enqueueJob(job);
      logger.info({ conversationId: msg.conversationId }, "📬 Job enqueued for conversation");
    }
  } catch (err) {
    logger.error({ err }, "Error processing WhatsApp webhook");
  }
});

function verifyMetaSignature(
  rawBody: string,
  signature: string | undefined
): boolean {
  const appSecret = env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    logger.warn("⚠️ WHATSAPP_APP_SECRET not set — skipping signature verification");
    return true;
  }

  if (!signature) {
    logger.warn("⚠️ Missing X-Hub-Signature-256 header from Meta webhook");
    return false;
  }

  const expected = "sha256=" + createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const match = expected === signature;
  if (!match) {
    logger.warn(`❌ Meta HMAC mismatch. Expected: ${expected.slice(0, 20)}... Got: ${signature.slice(0, 20)}...`);
  }
  return match;
}

function parseInboundMessage(
  message: Record<string, unknown>,
  value: Record<string, unknown>
): WhatsAppInboundMessage | null {
  const contacts = (value.contacts as Array<{ wa_id: string }>) ?? [];
  const from = contacts[0]?.wa_id ?? (message.from as string);

  if (!from) return null;

  if (message.type === "text") {
    return {
      messageId: message.id as string,
      conversationId: `conv_${from}`,
      from,
      text: (message.text as { body: string })?.body ?? "",
      timestamp: message.timestamp as number,
    };
  }

  if (message.type === "interactive") {
    const interactive = message.interactive as {
      type: string;
      button_reply?: { id: string; title: string };
    };
    if (interactive?.type === "button_reply" && interactive.button_reply) {
      return {
        messageId: message.id as string,
        conversationId: `conv_${from}`,
        from,
        text: `[BUTTON:${interactive.button_reply.id}]`,
        timestamp: message.timestamp as number,
        buttonReply: interactive.button_reply,
      };
    }
  }

  return null;
}

export default router;

import { Router } from "express";
import { createHmac } from "crypto";
import { enqueueJob } from "../services/redis.ts";
import { db } from "../db/migrate.ts";
import type { WhatsAppInboundMessage, WorkerJob } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Webhook — validate → persist → enqueue → return 200 immediately
// The worker handles all agent processing asynchronously
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// ── GET: Meta webhook verification ───────────────────────────────────────────

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified by Meta");
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verification failed" });
  }
});

// ── POST: Inbound messages ────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  // Return 200 immediately — Meta requires fast acknowledgement
  res.status(200).json({ status: "received" });

  try {
    // Verify X-Hub-Signature-256
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn("⚠️  Invalid Meta webhook signature — dropping");
      return;
    }

    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value?.messages?.length) return; // status updates, not messages

    for (const message of value.messages) {
      const msg = parseInboundMessage(message, value);
      if (!msg) continue;

      console.log(`📱 WA message from ${msg.from}: "${msg.text}"`);

      // Persist raw message
      await persistMessage(msg);

      // Enqueue for async worker processing
      const job: WorkerJob = {
        type: "INBOUND_MESSAGE",
        payload: msg,
      };
      await enqueueJob(job);
      console.log(`📬 Job enqueued for conversation ${msg.conversationId}`);
    }
  } catch (err) {
    console.error("Error processing WhatsApp webhook:", err);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function verifyMetaSignature(
  rawBody: string,
  signature: string | undefined
): boolean {
  // Meta signs webhook payloads with the Facebook App Secret
  // (NOT the WhatsApp Access Token — these are different credentials)
  // App Secret is found in: Meta Developer Console → Your App → Settings → Basic → App Secret
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    // Dev/staging without secret configured: warn but allow through
    console.warn("⚠️  WHATSAPP_APP_SECRET not set — skipping signature verification (set this in production)");
    return true;
  }

  if (!signature) {
    console.warn("⚠️  Missing X-Hub-Signature-256 header from Meta webhook");
    return false;
  }

  const expected = "sha256=" + createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const match = expected === signature;
  if (!match) {
    console.warn(`❌ Meta HMAC mismatch. Expected: ${expected.slice(0, 20)}... Got: ${signature.slice(0, 20)}...`);
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

  // Handle text messages
  if (message.type === "text") {
    return {
      messageId: message.id as string,
      conversationId: `conv_${from}`,  // keyed by phone number
      from,
      text: (message.text as { body: string })?.body ?? "",
      timestamp: message.timestamp as number,
    };
  }

  // Handle interactive button replies (Retry / Cancel)
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

import { appendMessage } from "../services/conversation-memory.ts";

async function persistMessage(msg: WhatsAppInboundMessage): Promise<void> {
  await appendMessage(msg.conversationId, msg.from, "customer", msg.text);
}

export default router;

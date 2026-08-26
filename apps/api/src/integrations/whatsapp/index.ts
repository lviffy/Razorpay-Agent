import axios from "axios";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";
import { appendMessage } from "../../services/conversation-memory.ts";

const WA_BASE = "https://graph.facebook.com/v19.0";

async function sendRequest(body: Record<string, unknown>): Promise<void> {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const token = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !token) {
    const to = body.to || "buyer";
    const type = body.type || "text";
    logger.debug({ to, type }, `📱 [WhatsApp Outbound Mock] To: ${to} | Type: ${type}`);
    return;
  }

  try {
    await axios.post(
      `${WA_BASE}/${phoneId}/messages`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      logger.error({ data: err.response?.data, message: err.message }, "WhatsApp API delivery error");
    }
    logger.warn("⚠️ WhatsApp delivery warning (proceeding without crashing worker)");
  }
}

export async function sendText(to: string, text: string): Promise<void> {
  const convId = `conv_${to}`;
  await appendMessage(convId, to, "seller_agent", text);

  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  });
}

export async function sendImage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<void> {
  const convId = `conv_${to}`;
  await appendMessage(convId, to, "seller_agent", caption || "Product Image", { mediaUrl: imageUrl });

  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: imageUrl,
      ...(caption ? { caption } : {}),
    },
  });
}

export async function sendInteractive(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  const convId = `conv_${to}`;
  await appendMessage(convId, to, "seller_agent", bodyText);

  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export async function sendPaymentLink(
  to: string,
  amount: number,
  link: string,
  storeName: string
): Promise<void> {
  const convId = `conv_${to}`;
  const textMsg = `✅ Deal locked!\n\n*₹${amount.toLocaleString("en-IN")}* from ${storeName}\n\nRazorpay Checkout Link: ${link}`;
  await appendMessage(convId, to, "seller_agent", textMsg, { sessionState: "AWAITING_PAYMENT" });

  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `✅ Deal locked!\n\n*₹${amount.toLocaleString("en-IN")}* from ${storeName}\n\nTap below to complete payment via Razorpay (test mode):`,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: `Pay ₹${amount.toLocaleString("en-IN")}`,
          url: link,
        },
      },
    },
  });
}

export interface ConfirmationIds {
  whatsappMessageId: string;
  conversationId: string;
  x402TransactionId: string;
  razorpayPaymentId: string;
  orderId: string;
  amount: number;
  storeName: string;
}

export async function sendConfirmation(
  to: string,
  ids: ConfirmationIds
): Promise<void> {
  const text =
    `🎉 *Payment Confirmed!*\n\n` +
    `Thank you for your order! Your purchase *${ids.orderId}* has been confirmed and settled via Razorpay.\n\n` +
    `💰 *Amount Paid:* ₹${ids.amount.toLocaleString("en-IN")}\n` +
    `🏪 *Store:* ${ids.storeName}\n\n` +
    `🧾 *Settlement Details:*\n` +
    `💳 Razorpay Payment: \`${ids.razorpayPaymentId}\`\n` +
    `🔗 x402 Audit Hash: \`${ids.x402TransactionId}\`\n\n` +
    `🚚 Your order is being packed for dispatch. Thank you for shopping with us!`;

  await sendText(to, text);
}

export async function sendPaymentFailedWithRetry(
  to: string,
  amount: number,
  timeRemainingSeconds: number
): Promise<void> {
  await sendInteractive(
    to,
    `❌ Payment failed.\n\nInventory held for ${timeRemainingSeconds}s more.\nRetry with a different method?`,
    [
      { id: "retry_payment", title: "Retry Payment" },
      { id: "cancel_order", title: "Cancel" },
    ]
  );
}

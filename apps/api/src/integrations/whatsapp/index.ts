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
    logger.debug({ to, type }, `📱 [WhatsApp Outbound] To: ${to} | Type: ${type}`);
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

export async function sendDocument(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<void> {
  const convId = `conv_${to}`;
  await appendMessage(convId, to, "seller_agent", caption || `📄 Document: ${filename}`, { mediaUrl: documentUrl });

  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "document",
    document: {
      link: documentUrl,
      filename,
      ...(caption ? { caption } : {}),
    },
  });
}

export async function sendPaymentWithInvoiceAndQr(params: {
  to: string;
  amount: number;
  paymentUrl: string;
  storeName: string;
  invoiceUrl?: string;
  qrImageUrl?: string;
  upiDeepLink?: string;
  offerSummary?: string;
}): Promise<void> {
  const { to, amount, paymentUrl, storeName, invoiceUrl, qrImageUrl, upiDeepLink, offerSummary } = params;
  const convId = `conv_${to}`;

  let textMsg = `✅ Deal locked!\n\n*₹${amount.toLocaleString("en-IN")}* from ${storeName}\n\nRazorpay Checkout Link: ${paymentUrl}`;
  if (offerSummary) {
    textMsg += `\n🏷️ ${offerSummary}`;
  }
  if (invoiceUrl) {
    textMsg += `\n🧾 GST Tax Invoice: ${invoiceUrl}`;
  }
  if (upiDeepLink) {
    textMsg += `\n⚡ Instant UPI: ${upiDeepLink}`;
  }

  await appendMessage(convId, to, "seller_agent", textMsg, { sessionState: "AWAITING_PAYMENT" });

  // 1. Send CTA payment link
  await sendRequest({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: `✅ Deal locked!\n\n*₹${amount.toLocaleString("en-IN")}* from ${storeName}${offerSummary ? `\n🏷️ *Offer Applied:* ${offerSummary}` : ""}${invoiceUrl ? `\n🧾 *GST Tax Invoice Generated*` : ""}\n\nTap below to complete payment via Razorpay:`,
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: `Pay ₹${amount.toLocaleString("en-IN")}`,
          url: paymentUrl,
        },
      },
    },
  });

  // 2. If QR image is provided, send the dynamic QR image for instant scanning
  if (qrImageUrl) {
    await sendImage(to, qrImageUrl, `📱 Scan with GPay/PhonePe/Paytm to pay ₹${amount.toLocaleString("en-IN")}`);
  }

  // 3. If Invoice PDF is provided, send the GST tax invoice
  if (invoiceUrl) {
    await sendDocument(to, invoiceUrl, `Invoice_${Date.now()}.pdf`, `🧾 GST Tax Invoice for your order at ${storeName}`);
  }
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
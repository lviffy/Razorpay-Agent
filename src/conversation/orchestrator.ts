import { loadConversation, updateConversationContext } from "../services/conversation-memory.ts";
import { db } from "../db/migrate.ts";
import { getProducts, getNegotiationRules, getStore } from "../services/merchant.ts";
import { sendText, sendImage, sendPaymentLink } from "../services/whatsapp.ts";
import { resolveIntent } from "./intent-resolver.ts";
import { executeCommerceAction } from "./commerce-executor.ts";
import { generateCustomerResponse } from "./response-generator.ts";
import type { WorkerJob, Product } from "../types/index.ts";
import type { ConversationContext } from "./types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Central Conversation Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function processInboundMessage(job: WorkerJob): Promise<void> {
  const { payload: msg } = job;
  const phoneNumber = msg.from;
  const conversationId = msg.conversationId;

  console.log(`[Orchestrator] Processing inbound message from ${phoneNumber}: "${msg.text}"`);

  // ── 1. Load multi-turn conversation state ──────────────────────────────────
  const state = await loadConversation(conversationId, phoneNumber);

  // ── 2. Load active store & live catalog ────────────────────────────────────
  const { rows: storeRows } = await db.query(
    "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  const activeStoreId = storeRows[0]?.id;
  if (!activeStoreId) {
    await sendText(phoneNumber, "Store currently offline. Please try again shortly.");
    return;
  }

  const [availableProducts, rules, store] = await Promise.all([
    getProducts(activeStoreId),
    getNegotiationRules(activeStoreId),
    getStore(activeStoreId),
  ]);

  if (!store || !rules) {
    await sendText(phoneNumber, "Store configuration not found. Please try again shortly.");
    return;
  }

  const context: ConversationContext = {
    conversationId,
    phoneNumber,
    state,
    availableProducts,
    store,
    rules,
  };

  // ── 3. Understand Message & Resolve References / Intent ─────────────────────
  const intent = await resolveIntent(msg.text, context);
  console.log(`[Orchestrator] Resolved intent: ${intent.intent} (Confidence: ${intent.confidence})`);

  // ── 4. Execute Commerce Action (Deterministic Business Logic) ───────────────
  const commerceResult = await executeCommerceAction(intent, context, msg.text);
  console.log(`[Orchestrator] Commerce result: ${commerceResult.type}`);

  // ── 5. Update Conversation State & Memory ─────────────────────────────────
  const updatedActiveProduct = commerceResult.product || state.activeProduct;
  const updatedOffer = commerceResult.offer
    ? {
        productTitle: commerceResult.product?.title || state.activeProduct?.title || "Product",
        variantId: commerceResult.product?.variantId || state.activeProduct?.variantId || "",
        offeredPrice: commerceResult.offer.offeredPrice,
        listedPrice: commerceResult.product?.listedPrice || state.activeProduct?.listedPrice || commerceResult.offer.offeredPrice,
        shippingFree: commerceResult.offer.shippingFree,
        status: commerceResult.offer.status === "COUNTER" ? ("COUNTER" as const) : ("PROPOSED" as const),
      }
    : state.currentOffer;

  const nextSessionState =
    commerceResult.type === "PAYMENT_LINK_CREATED"
      ? "AWAITING_PAYMENT"
      : commerceResult.type === "OFFER_PROPOSED" || commerceResult.type === "COUNTER_OFFER"
      ? "NEGOTIATING"
      : state.sessionState;

  await updateConversationContext(conversationId, phoneNumber, {
    activeProduct: updatedActiveProduct,
    currentOffer: updatedOffer,
    buyerBudget: intent.extractedBudget || intent.requestedPrice || state.buyerBudget,
    lastIntent: intent.intent,
    awaitingConfirmation: commerceResult.type === "OFFER_PROPOSED" || commerceResult.type === "COUNTER_OFFER" ? "PAYMENT_LINK" : null,
    sessionState: nextSessionState,
    dealAmount: commerceResult.paymentAmount || commerceResult.product?.offeredPrice,
  });

  // ── 6. Generate Customer Response ─────────────────────────────────────────
  const response = await generateCustomerResponse(msg.text, intent, commerceResult, context);

  // ── 7. Send Outbound WhatsApp Communication ───────────────────────────────
  // Send product image if available and requested/relevant
  if (response.mediaUrl && response.mediaUrl.startsWith("http") && !response.mediaUrl.startsWith("blob:")) {
    try {
      await sendImage(phoneNumber, response.mediaUrl, response.mediaCaption);
    } catch (imgErr) {
      console.warn("[Orchestrator] Image send warning (proceeding with text):", imgErr);
    }
  }

  // Send payment link interactive message or standard text
  if (response.isPaymentLink && response.paymentUrl && response.paymentAmount) {
    await sendPaymentLink(
      phoneNumber,
      response.paymentAmount,
      response.paymentUrl,
      store.name
    );
  } else {
    await sendText(phoneNumber, response.text);
  }
}

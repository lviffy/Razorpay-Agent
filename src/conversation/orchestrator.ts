import { loadConversation, updateConversationContext } from "../services/conversation-memory.ts";
import { db } from "../db/migrate.ts";
import { getProducts, getAllActiveProducts, getNegotiationRules, getStore } from "../services/merchant.ts";
import { sendText, sendImage, sendPaymentLink } from "../services/whatsapp.ts";
import { resolveIntent } from "./intent-resolver.ts";
import { executeCommerceAction } from "./commerce-executor.ts";
import { generateCustomerResponse } from "./response-generator.ts";
import type { WorkerJob } from "../types/index.ts";
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

  // ── 2. Load active store & live catalog across all merchant stores ──────────
  const { rows: storeRows } = await db.query(
    "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  const activeStoreId = storeRows[0]?.id;
  if (!activeStoreId) {
    await sendText(phoneNumber, "Store currently offline. Please try again shortly.");
    return;
  }

  const [availableProducts, rules, store] = await Promise.all([
    getAllActiveProducts(),
    getNegotiationRules(activeStoreId),
    getStore(activeStoreId),
  ]);

  const activeStore = store || {
    id: activeStoreId,
    name: "MVPFAST",
    city: "Bengaluru",
    razorpayAccountId: "rzp_test_mock",
    currency: "INR",
    isActive: true,
  };

  const activeRules = rules || {
    storeId: activeStoreId,
    maxDiscountPercentage: 12,
    minOrderValueForDiscount: 500,
    freeShippingThreshold: 3000,
    allowBundleOffers: true,
  };

  const context: ConversationContext = {
    conversationId,
    phoneNumber,
    state,
    availableProducts,
    store: activeStore,
    rules: activeRules,
  };

  // ── 3. Understand Message & Resolve References / Intent ─────────────────────
  const intent = await resolveIntent(msg.text, context);
  console.log(`[Orchestrator] Resolved intent: ${intent.intent} (Confidence: ${intent.confidence})`);

  // ── 4. Execute Commerce Action (Deterministic Business Logic) ───────────────
  const commerceResult = await executeCommerceAction(intent, context, msg.text);
  console.log(`[Orchestrator] Commerce result: ${commerceResult.type}`);

  // ── 5. Update Conversation State & Memory ─────────────────────────────────
  let updatedActiveProduct = commerceResult.product || state.activeProduct;
  let updatedOffer = commerceResult.offer
    ? {
        productTitle: commerceResult.product?.title || state.activeProduct?.title || "Product",
        variantId: commerceResult.product?.variantId || state.activeProduct?.variantId || "",
        offeredPrice: commerceResult.offer.offeredPrice,
        listedPrice: commerceResult.product?.listedPrice || state.activeProduct?.listedPrice || commerceResult.offer.offeredPrice,
        shippingFree: commerceResult.offer.shippingFree,
        status: commerceResult.offer.status === "COUNTER" ? ("COUNTER" as const) : ("PROPOSED" as const),
      }
    : state.currentOffer;

  // On clean greeting, reset active product so old focus is not carried over
  if (intent.intent === "SMALL_TALK") {
    updatedActiveProduct = undefined;
    updatedOffer = undefined;
  }

  const nextSessionState =
    commerceResult.type === "PAYMENT_LINK_CREATED"
      ? "AWAITING_PAYMENT"
      : commerceResult.type === "OFFER_PROPOSED" || commerceResult.type === "COUNTER_OFFER"
      ? "NEGOTIATING"
      : intent.intent === "SMALL_TALK"
      ? "IDLE"
      : state.sessionState;

  const awaitingConf =
    commerceResult.type === "OFFER_PROPOSED" || commerceResult.type === "COUNTER_OFFER"
      ? ("PAYMENT_LINK" as const)
      : commerceResult.type === "GREETING"
      ? ("CATALOG" as const)
      : null;

  await updateConversationContext(conversationId, phoneNumber, {
    activeProduct: updatedActiveProduct,
    currentOffer: updatedOffer,
    buyerBudget: intent.extractedBudget || intent.requestedPrice || (intent.intent === "SMALL_TALK" ? undefined : state.buyerBudget),
    requestedQuantity: intent.requestedQuantity || commerceResult.quantity || state.requestedQuantity,
    lastIntent: intent.intent,
    awaitingConfirmation: awaitingConf,
    sessionState: nextSessionState,
    dealAmount: commerceResult.paymentAmount || commerceResult.product?.offeredPrice,
  });

  // ── 6. Generate Customer Response ─────────────────────────────────────────
  const response = await generateCustomerResponse(msg.text, intent, commerceResult, context);

  // ── 7. Send Outbound WhatsApp Communication ───────────────────────────────
  if (response.mediaList && response.mediaList.length > 0) {
    for (const item of response.mediaList) {
      try {
        await sendImage(phoneNumber, item.mediaUrl, item.caption);
      } catch (imgErr) {
        console.warn("[Orchestrator] Catalog multi-image send warning:", imgErr);
      }
    }
  } else {
    // Avoid re-sending the same single image on every subsequent follow-up turn
    const wasImageAlreadySent = state.transcript.some(
      (t: any) => t.mediaUrl && t.mediaUrl === response.mediaUrl
    );

    const shouldSendImage =
      response.mediaUrl &&
      response.mediaUrl.startsWith("http") &&
      !response.mediaUrl.startsWith("blob:") &&
      (intent.isPhotoRequest || !wasImageAlreadySent);

    if (shouldSendImage) {
      try {
        const prod = commerceResult.product || updatedActiveProduct;
        const shortCaption =
          response.mediaCaption ||
          (prod ? `Featured: ${prod.title} (₹${(prod.offeredPrice || prod.listedPrice).toLocaleString("en-IN")}) 📸` : undefined);

        await sendImage(phoneNumber, response.mediaUrl!, shortCaption);
        if (commerceResult.type === "PHOTO_FOUND") {
          return; // Photo sent with dedicated caption
        }
      } catch (imgErr) {
        console.warn("[Orchestrator] Image send warning, proceeding with text:", imgErr);
      }
    }
  }

  // Send payment link interactive message or standard text
  if (response.isPaymentLink && response.paymentUrl && response.paymentAmount) {
    await sendPaymentLink(
      phoneNumber,
      response.paymentAmount,
      response.paymentUrl,
      activeStore.name
    );
  } else {
    await sendText(phoneNumber, response.text);
  }
}

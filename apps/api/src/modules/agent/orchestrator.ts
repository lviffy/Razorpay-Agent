import { loadConversation, updateConversationContext } from "../../services/conversation-memory.ts";
import { db } from "@zapai/database";
import { getProducts, getAllActiveProducts, getNegotiationRules, getStore } from "../../services/merchant.ts";
import { sendText, sendImage, sendPaymentLink } from "../../integrations/whatsapp/index.ts";
import { resolveIntent } from "./intent-resolver.ts";
import { executeCommerceAction } from "./commerce-executor.ts";
import { generateCustomerResponse } from "./response-generator.ts";
import type { WorkerJob } from "@zapai/types";
import type { ConversationContext } from "./types.ts";
import { logger } from "../../core/logger/index.ts";

export async function processInboundMessage(job: WorkerJob): Promise<void> {
  const { payload: msg } = job;
  const phoneNumber = msg.from;
  const conversationId = msg.conversationId;

  logger.info({ phone: phoneNumber, text: msg.text }, "[Orchestrator] Processing inbound message");

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

  const [storeProducts, rules, store] = await Promise.all([
    getProducts(activeStoreId),
    getNegotiationRules(activeStoreId),
    getStore(activeStoreId),
  ]);

  const availableProducts = storeProducts.length > 0 ? storeProducts : await getAllActiveProducts();

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

  // ── 3. Resolve Intent & Context ───────────────────────────────────────────
  const intent = await resolveIntent(msg.text, context);
  logger.debug({ intent: intent.intent, ref: intent.referencedProductTitle }, "[Orchestrator] Resolved intent");

  // ── 4. Execute Commerce Action ─────────────────────────────────────────────
  const commerceResult = await executeCommerceAction(intent, context, msg.text);
  logger.debug({ resultType: commerceResult.type }, "[Orchestrator] Executed commerce action");

  // ── 5. Generate Natural Customer Response ─────────────────────────────────
  const customerReply = await generateCustomerResponse(msg.text, intent, commerceResult, context);

  // ── 6. Update Multi-Turn Memory State ─────────────────────────────────────
  let nextSessionState = state.sessionState;
  let nextActiveProduct = state.activeProduct;
  let nextCurrentOffer = state.currentOffer;
  let nextAwaitingConfirmation = state.awaitingConfirmation;

  let nextRequestedQuantity = 1;
  if (intent.requestedQuantity !== undefined) {
    nextRequestedQuantity = intent.requestedQuantity;
  } else if (commerceResult.type === "GREETING" || commerceResult.type === "PAYMENT_LINK_CREATED") {
    nextRequestedQuantity = 1;
  } else if (commerceResult.product && state.activeProduct && commerceResult.product.id !== state.activeProduct.id) {
    nextRequestedQuantity = 1;
  } else if (state.requestedQuantity) {
    nextRequestedQuantity = state.requestedQuantity;
  }

  if (commerceResult.type === "GREETING") {
    nextActiveProduct = undefined;
    nextCurrentOffer = undefined;
    nextAwaitingConfirmation = "CATALOG";
  } else if (commerceResult.type === "CATALOG_LIST") {
    nextAwaitingConfirmation = null;
  } else if (commerceResult.product) {
    nextActiveProduct = {
      id: commerceResult.product.id,
      title: commerceResult.product.title,
      listedPrice: commerceResult.product.listedPrice,
      floorPrice: commerceResult.product.floorPrice,
      offeredPrice: commerceResult.product.offeredPrice,
      inventoryAvailable: commerceResult.product.inventoryAvailable,
      imageUrl: commerceResult.product.imageUrl,
      sku: commerceResult.product.sku,
      variantId: commerceResult.product.variantId,
    };

    if (commerceResult.type === "COUNTER_OFFER" && commerceResult.offer) {
      nextCurrentOffer = {
        productTitle: commerceResult.product.title,
        variantId: commerceResult.product.variantId,
        offeredPrice: commerceResult.offer.offeredPrice,
        listedPrice: commerceResult.product.listedPrice,
        shippingFree: commerceResult.offer.shippingFree,
        status: "COUNTER",
      };
      nextSessionState = "NEGOTIATING";
      nextAwaitingConfirmation = "PRICE_ACCEPTANCE";
    } else if (commerceResult.type === "PAYMENT_LINK_CREATED") {
      nextSessionState = "AWAITING_PAYMENT";
      nextAwaitingConfirmation = null;
    }
  }

  if (intent.extractedBudget) {
    state.buyerBudget = intent.extractedBudget;
  }

  await updateConversationContext(conversationId, phoneNumber, {
    activeProduct: nextActiveProduct,
    currentOffer: nextCurrentOffer,
    buyerBudget: state.buyerBudget,
    requestedQuantity: nextRequestedQuantity,
    lastIntent: intent.intent,
    awaitingConfirmation: nextAwaitingConfirmation,
    activeCategory: intent.category,
    sessionState: nextSessionState,
    dealAmount: commerceResult.paymentAmount || (nextActiveProduct?.offeredPrice ? nextActiveProduct.offeredPrice * nextRequestedQuantity : undefined),
  });

  // ── 7. Dispatch to WhatsApp Outbound ──────────────────────────────────────
  if (customerReply.mediaList && customerReply.mediaList.length > 0) {
    for (const item of customerReply.mediaList) {
      try {
        await sendImage(phoneNumber, item.mediaUrl, item.caption);
      } catch (imgErr) {
        logger.warn({ imgErr }, "[Orchestrator] Catalog multi-image send warning");
      }
    }
  } else {
    const wasImageAlreadySent = state.transcript.some(
      (t: any) => t.mediaUrl && t.mediaUrl === customerReply.mediaUrl
    );

    const shouldSendImage =
      customerReply.mediaUrl &&
      customerReply.mediaUrl.startsWith("http") &&
      !customerReply.mediaUrl.startsWith("blob:") &&
      (intent.isPhotoRequest || !wasImageAlreadySent);

    if (shouldSendImage) {
      try {
        const prod = commerceResult.product || nextActiveProduct;
        const shortCaption =
          customerReply.mediaCaption ||
          (prod ? `Featured: ${prod.title} (₹${(prod.offeredPrice || prod.listedPrice).toLocaleString("en-IN")}) 📸` : undefined);

        await sendImage(phoneNumber, customerReply.mediaUrl!, shortCaption);
        if (commerceResult.type === "PHOTO_FOUND") {
          return;
        }
      } catch (imgErr) {
        logger.warn({ imgErr }, "[Orchestrator] Image send warning, proceeding with text");
      }
    }
  }

  if (customerReply.isPaymentLink && customerReply.paymentUrl && customerReply.paymentAmount) {
    await sendPaymentLink(
      phoneNumber,
      customerReply.paymentAmount,
      customerReply.paymentUrl,
      activeStore.name
    );
  } else {
    await sendText(phoneNumber, customerReply.text);
  }
}

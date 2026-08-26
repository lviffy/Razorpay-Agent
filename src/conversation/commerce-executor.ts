import { BuyerAgent } from "../agents/buyer-agent.ts";
import { SellerAgent } from "../agents/seller-agent.ts";
import { acquireLock, releaseLock } from "../services/redis.ts";
import { createOrder, createStandardPaymentLink, generateOrderId, rupeesToPaise } from "../services/razorpay.ts";
import { issueTransactionId } from "../services/x402.ts";
import { setInventoryState, getStore, getProducts, getNegotiationRules } from "../services/merchant.ts";
import { logEvent } from "../services/audit.ts";
import { checkBuyerVelocity } from "../services/rate-limit.ts";
import { db } from "../db/migrate.ts";
import type { ConversationContext, ConversationIntent, CommerceResult, ConversationState } from "./types.ts";
import type { Product, AgentProductSchema } from "../types/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Commerce Action Executor — Deterministic Business & Transaction Logic
// ─────────────────────────────────────────────────────────────────────────────

export async function executeCommerceAction(
  intent: ConversationIntent,
  context: ConversationContext,
  userMessage: string
): Promise<CommerceResult> {
  const { state, availableProducts, store, rules, phoneNumber, conversationId } = context;

  // ── 1. Greetings & Small Talk ─────────────────────────────────────────────
  if (intent.intent === "SMALL_TALK") {
    return {
      type: "GREETING",
      infoDetails: `Welcome to ${store.name}!`,
    };
  }

  // ── 2. Catalog Browsing ───────────────────────────────────────────────────
  if (intent.intent === "CATALOG_BROWSE") {
    const catalogItems = availableProducts.slice(0, 10).map((p) => ({
      title: p.title,
      price: p.listedPrice,
      sku: p.sku,
      inStock: p.inventoryAvailable > 0,
    }));

    // Collect images for ALL available products with valid public URLs (up to 5 items)
    const productsWithImages = availableProducts
      .filter((p) => p.imageUrl && p.imageUrl.startsWith("http") && !p.imageUrl.startsWith("blob:"))
      .slice(0, 5);

    const mediaList = productsWithImages.map((p) => ({
      mediaUrl: p.imageUrl!,
      caption: `• *${p.title}* — ₹${p.listedPrice.toLocaleString("en-IN")} (${p.inventoryAvailable} in stock) 📸`,
    }));

    const featuredProductWithImage = productsWithImages[0] || availableProducts[0];

    return {
      type: "CATALOG_LIST",
      catalogItems,
      product: featuredProductWithImage
        ? {
            id: featuredProductWithImage.id,
            title: featuredProductWithImage.title,
            variantId: featuredProductWithImage.shopifyVariantId,
            listedPrice: featuredProductWithImage.listedPrice,
            floorPrice: featuredProductWithImage.floorPrice,
            offeredPrice: featuredProductWithImage.listedPrice,
            inventoryAvailable: featuredProductWithImage.inventoryAvailable,
            imageUrl: featuredProductWithImage.imageUrl,
            sku: featuredProductWithImage.sku,
          }
        : undefined,
      mediaList,
      mediaUrlToSend: featuredProductWithImage?.imageUrl,
      mediaCaption: featuredProductWithImage
        ? `Featured: ${featuredProductWithImage.title} (₹${featuredProductWithImage.listedPrice.toLocaleString("en-IN")}) 📸`
        : undefined,
    };
  }

  // ── 3. Payment Retry Flow ──────────────────────────────────────────────────
  if (intent.intent === "PAYMENT_RETRY") {
    // Correct customer-scoped order lookup
    const { rows } = await db.query(
      `SELECT o.*, s.name as store_name
       FROM orders o
       LEFT JOIN stores s ON o.store_id = s.id
       WHERE o.customer_phone = $1 AND o.status = 'CREATED'
       ORDER BY o.created_at DESC LIMIT 1`,
      [phoneNumber]
    );

    if (!rows[0]) {
      return {
        type: "INFO_ONLY",
        infoDetails: "No pending orders found to retry. Tell me what you'd like to buy!",
      };
    }

    const order = rows[0];
    const plink = (await createStandardPaymentLink({
      amountInPaise: rupeesToPaise(parseFloat(order.amount)),
      description: `ZapAI Retry: ${order.order_id}`,
      callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/payment-complete`,
      referenceId: order.order_id,
      customerPhone: phoneNumber,
    })) as unknown as { short_url: string; id: string };

    return {
      type: "PAYMENT_RETRY_READY",
      paymentUrl: plink.short_url,
      paymentAmount: parseFloat(order.amount),
      orderRef: order.order_id,
    };
  }

  // ── 4. Order Cancellation ──────────────────────────────────────────────────
  if (intent.intent === "CANCELLATION") {
    return {
      type: "ORDER_CANCELLED",
      infoDetails: "Order search cancelled. Feel free to ask anytime if you want to explore new items.",
    };
  }

  // ── 5. Handle Ambiguous Requests (Preserve Uncertainty) ────────────────────
  if (intent.intent === "AMBIGUOUS") {
    return {
      type: "CLARIFICATION_NEEDED",
      clarificationPrompt: "What type of product are you looking for, or do you have a specific budget in mind?",
    };
  }

  // ── 6. Photo / Picture Requests ───────────────────────────────────────────
  if (intent.isPhotoRequest || (intent.intent === "PRODUCT_QUESTION" && intent.isPhotoRequest)) {
    const targetProduct = resolveTargetProduct(intent, availableProducts, state.activeProduct);
    if (targetProduct) {
      const offeredPrice = getProductKnownPrice(targetProduct, state);
      const isQtyAsk = /how many|how much stock|qty|quantity|in stock|units available|stock/i.test(userMessage);
      return {
        type: "PHOTO_FOUND",
        product: {
          id: targetProduct.id,
          title: targetProduct.title,
          variantId: targetProduct.shopifyVariantId,
          listedPrice: targetProduct.listedPrice,
          floorPrice: targetProduct.floorPrice,
          offeredPrice,
          inventoryAvailable: targetProduct.inventoryAvailable,
          imageUrl: targetProduct.imageUrl,
          sku: targetProduct.sku,
        },
        infoDetails: isQtyAsk ? `Live stock: Exactly ${targetProduct.inventoryAvailable} unit(s) available in stock.` : undefined,
        mediaUrlToSend: targetProduct.imageUrl,
        mediaCaption: `Here is ${targetProduct.title} (₹${offeredPrice.toLocaleString("en-IN")}) 📸`,
      };
    }
  }

  // ── 7. Price Negotiation & Product Stock Inquiry ──────────────────────────
  const isQtyOrStockAsk = /how many|how much stock|qty|quantity|in stock|units available|stock/i.test(userMessage);
  if ((intent.intent === "PRICE_NEGOTIATION" || isQtyOrStockAsk) && (state.activeProduct || intent.referencedProductTitle)) {
    const targetProduct = resolveTargetProduct(intent, availableProducts, state.activeProduct) || availableProducts[0];

    if (targetProduct) {
      const maxDiscountPct = rules.maxDiscountPercentage || 10;
      const minAllowedPrice = Math.max(
        targetProduct.floorPrice,
        Math.round(targetProduct.listedPrice * (1 - maxDiscountPct / 100))
      );

      // Determine starting reference price
      const currentKnownPrice = getProductKnownPrice(targetProduct, state);

      let counterPrice: number;
      let reasoning: string;

      if (intent.requestedPrice) {
        if (intent.requestedPrice >= minAllowedPrice) {
          counterPrice = intent.requestedPrice;
          reasoning = `Accepted customer requested price of ₹${counterPrice}.`;
        } else {
          counterPrice = minAllowedPrice;
          reasoning = `₹${minAllowedPrice} is our rock-bottom floor price for ${targetProduct.title}.`;
        }
      } else if (isQtyOrStockAsk) {
        counterPrice = currentKnownPrice;
        reasoning = `Live stock: We have exactly ${targetProduct.inventoryAvailable} unit(s) of ${targetProduct.title} available in stock.`;
      } else {
        // Progressive negotiation: if current price is listed price, drop to first discount tier
        if (currentKnownPrice >= targetProduct.listedPrice) {
          counterPrice = minAllowedPrice;
          reasoning = `Special discount of ${maxDiscountPct}% applied: ₹${counterPrice}.`;
        } else if (currentKnownPrice > minAllowedPrice) {
          counterPrice = minAllowedPrice;
          reasoning = `Dropped to our absolute floor price: ₹${counterPrice}.`;
        } else {
          // Already at rock bottom
          counterPrice = currentKnownPrice;
          reasoning = `₹${currentKnownPrice} is our absolute lowest rock-bottom price. We cannot go below this.`;
        }
      }

      // Enforce strict monotonicity: counter price must NEVER be higher than previously offered price
      if (state.currentOffer?.offeredPrice && counterPrice > state.currentOffer.offeredPrice) {
        counterPrice = state.currentOffer.offeredPrice;
      }

      const shippingFree = Boolean(
        rules.freeShippingThreshold && counterPrice >= rules.freeShippingThreshold
      );

      return {
        type: isQtyOrStockAsk ? "INFO_ONLY" : "COUNTER_OFFER",
        product: {
          id: targetProduct.id,
          title: targetProduct.title,
          variantId: targetProduct.shopifyVariantId,
          listedPrice: targetProduct.listedPrice,
          floorPrice: targetProduct.floorPrice,
          offeredPrice: counterPrice,
          inventoryAvailable: targetProduct.inventoryAvailable,
          imageUrl: targetProduct.imageUrl,
          sku: targetProduct.sku,
        },
        infoDetails: reasoning,
        offer: {
          status: "COUNTER",
          product: targetProduct.agentSchema,
          offeredPrice: counterPrice,
          shippingFree,
          reasoningTrace: reasoning,
          sessionId: conversationId,
        },
        mediaUrlToSend: targetProduct.imageUrl,
      };
    }
  }

  // ── 8. Accept Offer / Payment Generation ──────────────────────────────────
  if (
    intent.intent === "ACCEPT_OFFER" ||
    intent.intent === "PAYMENT_REQUEST" ||
    (intent.intent === "PURCHASE_INTENT" && state.activeProduct)
  ) {
    const targetProduct = resolveTargetProduct(intent, availableProducts, state.activeProduct);
    if (!targetProduct) {
      return {
        type: "NO_MATCH",
        errorMessage: "Could not find active product to checkout.",
      };
    }

    const quantity = intent.requestedQuantity || state.requestedQuantity || 1;

    // Check stock availability
    if (quantity > targetProduct.inventoryAvailable) {
      return {
        type: "INFO_ONLY",
        product: {
          id: targetProduct.id,
          title: targetProduct.title,
          variantId: targetProduct.shopifyVariantId,
          listedPrice: targetProduct.listedPrice,
          floorPrice: targetProduct.floorPrice,
          offeredPrice: targetProduct.listedPrice,
          inventoryAvailable: targetProduct.inventoryAvailable,
          imageUrl: targetProduct.imageUrl,
          sku: targetProduct.sku,
        },
        infoDetails: `We only have ${targetProduct.inventoryAvailable} unit(s) of ${targetProduct.title} available in stock right now. Would you like to proceed with ${targetProduct.inventoryAvailable} unit(s)?`,
      };
    }

    const unitPrice = getProductKnownPrice(targetProduct, state);
    const totalAmount = unitPrice * quantity;

    // Velocity / Fraud check
    const velocity = await checkBuyerVelocity(phoneNumber);
    if (!velocity.allowed) {
      const resetMin = Math.ceil((velocity.resetInSeconds ?? 300) / 60);
      return {
        type: "INFO_ONLY",
        infoDetails: `⚠️ Transaction limit reached (max 3 per 5 minutes). Please try again in ~${resetMin} minutes.`,
      };
    }

    // Acquire Redis Lock
    const lockAcquired = await acquireLock(store.id, targetProduct.shopifyVariantId);
    if (!lockAcquired) {
      return {
        type: "INVENTORY_UNAVAILABLE",
        errorMessage: "That item was just reserved by another buyer.",
      };
    }

    // Reserve inventory for the requested quantity
    await setInventoryState(targetProduct.id, "RESERVED", {
      reservedDelta: quantity,
      availableDelta: -quantity,
      reservationExpiresAt: new Date(Date.now() + 120_000),
    });

    const x402TxId = issueTransactionId();
    const orderRef = generateOrderId();

    // Create Razorpay Order
    let rzpOrder: { id: string };
    try {
      rzpOrder = (await createOrder({
        amountInPaise: rupeesToPaise(totalAmount),
        receipt: x402TxId,
        sessionId: conversationId,
        notes: {
          conversation_id: conversationId,
          phone_number: phoneNumber,
          product_id: targetProduct.id,
          quantity: String(quantity),
        },
      })) as unknown as { id: string };
    } catch (err) {
      await releaseLock(store.id, targetProduct.shopifyVariantId);
      await setInventoryState(targetProduct.id, "AVAILABLE", {
        reservedDelta: -quantity,
        availableDelta: quantity,
        reservationExpiresAt: null,
      });
      return {
        type: "INFO_ONLY",
        errorMessage: "Failed to create payment order. Please try again in a moment.",
      };
    }

    // Transition inventory to PAYMENT_PENDING
    await setInventoryState(targetProduct.id, "PAYMENT_PENDING");

    // Save order in PostgreSQL
    const itemTitleWithQty = quantity > 1 ? `${quantity}x ${targetProduct.title}` : targetProduct.title;
    await db.query(
      `INSERT INTO orders (
        store_id, razorpay_order_id, order_id, x402_tx_hash,
        mandate_id, amount, currency, status,
        customer_phone, customer_name, product_title, sku
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        store.id,
        rzpOrder.id,
        orderRef,
        x402TxId,
        `mnd_${conversationId.slice(-8)}`,
        totalAmount,
        "INR",
        "CREATED",
        phoneNumber,
        state.customerName || "Customer",
        itemTitleWithQty,
        targetProduct.sku || "",
      ]
    );

    // Audit log
    await logEvent("INVENTORY_LOCKED", {
      whatsappMessageId: `msg_${Date.now()}`,
      conversationId,
      x402TransactionId: x402TxId,
    }, {
      productId: targetProduct.id,
      storeId: store.id,
      variantId: targetProduct.shopifyVariantId,
      price: totalAmount,
      quantity,
    });

    // Create Razorpay Payment Link
    const plink = (await createStandardPaymentLink({
      amountInPaise: rupeesToPaise(totalAmount),
      description: `ZapAI: ${itemTitleWithQty} | ${orderRef}`,
      callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/payment-complete`,
      referenceId: orderRef,
      customerPhone: phoneNumber,
      notes: {
        product_id: targetProduct.id,
        conversation_id: conversationId,
        phone_number: phoneNumber,
        quantity: String(quantity),
        reference_id: orderRef,
        sku: targetProduct.sku || "",
      },
    })) as unknown as { short_url: string; id: string };

    return {
      type: "PAYMENT_LINK_CREATED",
      product: {
        id: targetProduct.id,
        title: targetProduct.title,
        variantId: targetProduct.shopifyVariantId,
        listedPrice: targetProduct.listedPrice,
        floorPrice: targetProduct.floorPrice,
        offeredPrice: unitPrice,
        inventoryAvailable: targetProduct.inventoryAvailable,
        imageUrl: targetProduct.imageUrl,
        sku: targetProduct.sku,
      },
      quantity,
      paymentUrl: plink.short_url,
      paymentAmount: totalAmount,
      mediaUrlToSend: targetProduct.imageUrl,
    };
  }

  // ── 9. Product Search & Catalog Evaluation ────────────────────────────────
  const spendingLimit = intent.requestedPrice || intent.extractedBudget || state.buyerBudget || 999999;
  const targetProduct = resolveTargetProduct(intent, availableProducts, state.activeProduct);

  if (targetProduct) {
    const seller = new SellerAgent(store.id);
    const offer = await seller.handleQuery({
      buyerQuery: intent.referencedProductTitle || targetProduct.title,
      targetPrice: spendingLimit < 999999 ? spendingLimit : undefined,
      category: intent.category,
      sessionId: conversationId,
    });

    if (offer) {
      return {
        type: "OFFER_PROPOSED",
        product: {
          id: targetProduct.id,
          title: targetProduct.title,
          variantId: targetProduct.shopifyVariantId,
          listedPrice: targetProduct.listedPrice,
          floorPrice: targetProduct.floorPrice,
          offeredPrice: offer.offeredPrice,
          imageUrl: targetProduct.imageUrl,
          sku: targetProduct.sku,
        },
        offer,
        mediaUrlToSend: targetProduct.imageUrl,
      };
    }
  }

  // General multi-store buyer agent search if budget specified
  if (spendingLimit < 999999) {
    const buyerAgent = new BuyerAgent();
    const decision = await buyerAgent.processTask({
      message: userMessage,
      spendingLimit,
      phoneNumber,
      conversationId,
      waMessageId: `msg_${Date.now()}`,
    });

    if (decision.accepted && decision.offer) {
      const p = availableProducts.find((item) => item.shopifyVariantId === decision.offer?.product.variantId) || availableProducts[0];
      return {
        type: "OFFER_PROPOSED",
        product: {
          id: p.id,
          title: decision.offer.product.title,
          variantId: decision.offer.product.variantId,
          listedPrice: decision.offer.product.listedPrice,
          floorPrice: decision.offer.product.floorPrice,
          offeredPrice: decision.offer.offeredPrice,
          imageUrl: decision.offer.product.imageUrl || p.imageUrl,
          sku: decision.offer.product.sku,
        },
        offer: decision.offer,
        mandate: decision.mandate,
        mediaUrlToSend: decision.offer.product.imageUrl || p.imageUrl,
      };
    }

    if (decision.escalateToUser && decision.escalationMessage) {
      return {
        type: "OFFER_ABOVE_BUDGET",
        infoDetails: decision.escalationMessage,
      };
    }
  }

  return {
    type: "NO_MATCH",
    errorMessage: `Couldn't find an exact match for your request. Let me know if you'd like to see our featured catalog!`,
  };
}

function resolveTargetProduct(
  intent: ConversationIntent,
  availableProducts: Product[],
  activeProduct?: any
): Product | null {
  if (availableProducts.length === 0) return null;

  // 1. Check referenced title
  if (intent.referencedProductTitle) {
    const refLower = intent.referencedProductTitle.toLowerCase().trim();
    const p = availableProducts.find((item) => {
      const tLower = item.title.toLowerCase().trim();
      return tLower.includes(refLower) || refLower.includes(tLower) || (item.sku && refLower.includes(item.sku.toLowerCase()));
    });
    if (p) return p;
  }

  // 2. Check referenced variant ID
  if (intent.referencedVariantId) {
    const p = availableProducts.find((item) => item.shopifyVariantId === intent.referencedVariantId);
    if (p) return p;
  }

  // 3. Check active product in state
  if (activeProduct?.title) {
    const actLower = activeProduct.title.toLowerCase().trim();
    const p = availableProducts.find(
      (item) => item.title.toLowerCase().trim() === actLower ||
                item.shopifyVariantId === activeProduct.variantId
    );
    if (p) return p;
  }

  // 4. Check brand match
  if (intent.brand) {
    const p = availableProducts.find((item) => item.title.toLowerCase().includes(intent.brand!.toLowerCase()));
    if (p) return p;
  }

  return availableProducts[0] || null;
}

function getProductKnownPrice(targetProduct: Product, state: ConversationState): number {
  const isSameProduct =
    state.activeProduct &&
    (state.activeProduct.id === targetProduct.id ||
     state.activeProduct.variantId === targetProduct.shopifyVariantId ||
     state.activeProduct.title.toLowerCase().trim() === targetProduct.title.toLowerCase().trim() ||
     targetProduct.title.toLowerCase().trim().includes(state.activeProduct.title.toLowerCase().trim()) ||
     state.activeProduct.title.toLowerCase().trim().includes(targetProduct.title.toLowerCase().trim()));

  if (isSameProduct) {
    return state.currentOffer?.offeredPrice || state.activeProduct?.offeredPrice || targetProduct.listedPrice;
  }

  return targetProduct.listedPrice;
}

import { Router } from "express";
import { acquireLock, releaseLock } from "../../integrations/redis/index.ts";
import { createOrder, createStandardPaymentLink, generateOrderId, rupeesToPaise } from "../../integrations/razorpay/index.ts";
import { issueChallenge, issueTransactionId, verifyAuthorization, issueReceipt } from "../../services/x402.ts";
import { setInventoryState, getProductById, getStore } from "../../services/merchant.ts";
import { logEvent } from "../../services/audit.ts";
import { db } from "@zapai/database";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

// POST /api/v1/checkout/reserve
router.post("/reserve", async (req: Request, res: Response) => {
  try {
    const {
      storeId = "a0000000-0000-0000-0000-000000000001",
      variantId,
      productId,
      agreedPrice,
      mandateId,
      buyerAgentId = "buyer_agent_ext",
      customerName = "Autonomous Buyer",
      customerPhone = "+91 98765 43210",
      sessionId = `sess_${uuidv4().slice(0, 8)}`,
    } = req.body;

    if (!agreedPrice || (!variantId && !productId)) {
      return res.status(400).json({
        error: "agreedPrice and variantId (or productId) are required",
      });
    }

    let productRow;
    if (productId) {
      const { rows } = await db.query(
        "SELECT id, store_id, shopify_variant_id, title, sku, listed_price, floor_price FROM products WHERE id = $1",
        [productId]
      );
      productRow = rows[0];
    } else {
      const { rows } = await db.query(
        "SELECT id, store_id, shopify_variant_id, title, sku, listed_price, floor_price FROM products WHERE shopify_variant_id = $1",
        [variantId]
      );
      productRow = rows[0];
    }

    if (!productRow) {
      return res.status(404).json({ error: "Product or variant not found" });
    }

    const effectiveStoreId = productRow.store_id || storeId;
    const effectiveVariantId = productRow.shopify_variant_id || productRow.id;
    const numericAgreedPrice = Number(agreedPrice);

    if (numericAgreedPrice < parseFloat(productRow.floor_price)) {
      return res.status(403).json({
        error: "Price below merchant floor price mandate",
        floorPrice: parseFloat(productRow.floor_price),
      });
    }

    const lockAcquired = await acquireLock(effectiveStoreId, effectiveVariantId);
    if (!lockAcquired) {
      return res.status(409).json({
        error: "Inventory lock conflict — variant currently reserved by another buyer",
      });
    }

    const x402TxId = issueTransactionId();
    const orderId = generateOrderId();
    const amountInPaise = rupeesToPaise(numericAgreedPrice);

    let rzpOrder: { id: string };
    try {
      await setInventoryState(productRow.id, "RESERVED", {
        reservedDelta: 1,
        clearExpiry: false,
      });

      rzpOrder = (await createOrder({
        amountInPaise,
        receipt: x402TxId,
        sessionId,
      })) as unknown as { id: string };

      await setInventoryState(productRow.id, "PAYMENT_PENDING");
    } catch (rzpErr) {
      await setInventoryState(productRow.id, "AVAILABLE", {
        reservedDelta: -1,
        clearExpiry: true,
      });
      return res.status(502).json({ error: "Razorpay order creation failed", detail: String(rzpErr) });
    } finally {
      await releaseLock(effectiveStoreId, effectiveVariantId);
    }

    await db.query(
      `INSERT INTO orders (
        store_id, razorpay_order_id, order_id, x402_tx_hash,
        mandate_id, amount, original_price, discount_applied,
        customer_name, customer_phone, product_title, sku, currency, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'INR', 'CREATED', NOW())
      ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [
        effectiveStoreId,
        rzpOrder.id,
        orderId,
        x402TxId,
        mandateId || `mandate_${uuidv4().slice(0, 8)}`,
        numericAgreedPrice,
        parseFloat(productRow.listed_price),
        parseFloat(productRow.listed_price) - numericAgreedPrice,
        customerName,
        customerPhone,
        productRow.title,
        productRow.sku,
      ]
    );

    await logEvent(
      "INVENTORY_LOCKED",
      {
        x402TransactionId: x402TxId,
        orderId,
        conversationId: `conv_${sessionId}`,
      },
      {
        productId: productRow.id,
        storeId: effectiveStoreId,
        variantId: effectiveVariantId,
        price: numericAgreedPrice,
        razorpayOrderId: rzpOrder.id,
      }
    );

    const { headers: x402Headers, challenge } = issueChallenge(rzpOrder.id, amountInPaise);

    for (const [key, value] of Object.entries(x402Headers)) {
      res.setHeader(key, value);
    }

    return res.status(402).json({
      status: "PAYMENT_REQUIRED",
      protocol: "x402-fiat-razorpay",
      challenge,
      order: {
        orderId,
        razorpayOrderId: rzpOrder.id,
        amount: numericAgreedPrice,
        currency: "INR",
        product: productRow.title,
        sku: productRow.sku,
      },
    });
  } catch (err) {
    logger.error({ err }, "Checkout reserve error");
    return res.status(500).json({ error: "Failed to reserve inventory and issue x402 challenge" });
  }
});

// POST /api/v1/checkout/pay
router.post("/pay", async (req: Request, res: Response) => {
  try {
    const {
      razorpayOrderId,
      orderId,
      customerPhone = "",
      customerName = "Direct Buyer",
    } = req.body;

    const queryTarget = razorpayOrderId || req.headers["x-402-order-id"] as string;

    if (!queryTarget && !orderId) {
      return res.status(400).json({ error: "razorpayOrderId or orderId required" });
    }

    const { rows } = await db.query(
      `SELECT o.*, s.name as store_name
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.razorpay_order_id = $1 OR o.order_id = $2`,
      [queryTarget, orderId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = rows[0];
    const amountInPaise = rupeesToPaise(parseFloat(order.amount));

    const paymentLink = (await createStandardPaymentLink({
      amountInPaise,
      description: `ZapAI: ${order.product_title || "Purchase"} | ${order.order_id}`,
      callbackUrl: `${env.APP_URL || "http://localhost:8000"}/payment-complete`,
      referenceId: order.order_id,
      customerPhone,
    })) as unknown as { short_url: string; id: string };

    return res.json({
      status: "PAYMENT_LINK_ISSUED",
      orderId: order.order_id,
      razorpayOrderId: order.razorpay_order_id,
      x402TransactionId: order.x402_tx_hash,
      amount: parseFloat(order.amount),
      currency: "INR",
      paymentUrl: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
      storeName: order.store_name,
    });
  } catch (err) {
    logger.error({ err }, "Checkout pay error");
    return res.status(500).json({ error: "Failed to generate payment execution link" });
  }
});

export default router;

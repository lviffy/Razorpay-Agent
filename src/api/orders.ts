import { Router } from "express";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

// GET /api/v1/orders — List all orders from database
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT
        o.id,
        o.order_id,
        o.razorpay_order_id,
        o.razorpay_payment_id,
        o.x402_tx_hash,
        o.mandate_id,
        o.amount,
        o.original_price,
        o.discount_applied,
        o.customer_name,
        o.customer_phone,
        o.product_title,
        o.sku,
        o.currency,
        o.status,
        o.created_at,
        s.name as store_name
      FROM orders o
      JOIN stores s ON o.store_id = s.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (storeId) {
      params.push(storeId);
      conditions.push(`o.store_id = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`o.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY o.created_at DESC`;

    const { rows } = await db.query(query, params);

    const orders = rows.map((r) => {
      const amount = parseFloat(r.amount);
      const originalPrice = r.original_price ? parseFloat(r.original_price) : Math.round(amount * 1.08);
      const discountApplied = r.discount_applied ? parseFloat(r.discount_applied) : originalPrice - amount;

      let paymentStatus: "paid" | "pending" | "failed" | "refunded" = "pending";
      if (r.status === "CAPTURED") paymentStatus = "paid";
      else if (r.status === "FAILED") paymentStatus = "failed";
      else if (r.status === "REFUNDED") paymentStatus = "refunded";

      return {
        id: r.id,
        orderNumber: r.order_id || `ORD-${r.id.slice(0, 4).toUpperCase()}`,
        customerName: r.customer_name || "Customer",
        customerPhone: r.customer_phone || "+91 98765 00000",
        productTitle: r.product_title || "Product Item",
        sku: r.sku || "SKU-001",
        amount,
        originalPrice,
        discountApplied,
        paymentStatus,
        orderStatus: paymentStatus === "paid" ? "fulfilled" : paymentStatus === "failed" ? "cancelled" : "processing",
        provider: "ZAPAI",
        razorpayPaymentId: r.razorpay_payment_id || undefined,
        razorpayOrderId: r.razorpay_order_id,
        x402TxHash: r.x402_tx_hash,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      };
    });

    return res.json(orders);
  } catch (err) {
    console.error("Orders list error:", err);
    return res.status(500).json({ error: "Failed to list orders" });
  }
});

// GET /api/v1/orders/:id — Get order by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT o.*, s.name as store_name
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.id = $1 OR o.order_id = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Get order error:", err);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;

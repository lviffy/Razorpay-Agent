import { Router } from "express";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.X402_SIGNING_SECRET ||
  "zapai_jwt_secret_neon_auth_2026";

async function getStoreIdFromReq(req: Request): Promise<string | null> {
  const storeIdQuery = req.query.storeId as string | undefined;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (storeIdQuery && uuidRegex.test(storeIdQuery)) {
    return storeIdQuery;
  }

  const storeIdHeader = req.headers["x-store-id"] as string | undefined;
  if (storeIdHeader && uuidRegex.test(storeIdHeader)) {
    return storeIdHeader;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded?.storeId && uuidRegex.test(decoded.storeId)) {
        return decoded.storeId;
      }
      if (decoded?.userId) {
        const { rows } = await db.query(
          "SELECT store_id FROM users WHERE id = $1 LIMIT 1",
          [decoded.userId]
        );
        if (rows[0]?.store_id) return rows[0].store_id;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

// GET /api/v1/orders — List all orders from database
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
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
      LEFT JOIN stores s ON o.store_id = s.id
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
      const originalPrice = r.original_price ? parseFloat(r.original_price) : amount;
      const discountApplied = r.discount_applied ? parseFloat(r.discount_applied) : 0;

      let paymentStatus: "paid" | "pending" | "failed" | "refunded" = "pending";
      if (r.status === "CAPTURED") paymentStatus = "paid";
      else if (r.status === "FAILED") paymentStatus = "failed";
      else if (r.status === "REFUNDED") paymentStatus = "refunded";

      return {
        id: r.id,
        orderNumber: r.order_id || `ORD-${r.id.slice(0, 4).toUpperCase()}`,
        customerName: r.customer_name || "Direct Buyer",
        customerPhone: r.customer_phone || "",
        productTitle: r.product_title || "Product Item",
        sku: r.sku || "",
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
       LEFT JOIN stores s ON o.store_id = s.id
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

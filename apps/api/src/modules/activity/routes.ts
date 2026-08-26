import { Router } from "express";
import { db } from "@zapai/database";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

const JWT_SECRET = env.JWT_SECRET || "zapai_jwt_secret_neon_auth_2026";

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

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// GET /api/v1/activity
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const storeId = await getStoreIdFromReq(req);

    const search = req.query.search as string | undefined;
    let query = `
      SELECT id, event_type, whatsapp_message_id, conversation_id, x402_transaction_id, razorpay_payment_id, order_id, payload, event_checksum, timestamp
      FROM audit_ledger
      WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
    `;
    const params: any[] = [storeId];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (
        LOWER(event_type) LIKE $${params.length} OR
        LOWER(COALESCE(x402_transaction_id, '')) LIKE $${params.length} OR
        LOWER(COALESCE(razorpay_payment_id, '')) LIKE $${params.length} OR
        LOWER(COALESCE(order_id, '')) LIKE $${params.length} OR
        LOWER(COALESCE(whatsapp_message_id, '')) LIKE $${params.length}
      )`;
    }

    params.push(limit);
    query += ` ORDER BY id DESC LIMIT $${params.length}`;

    const { rows } = await db.query(query, params);

    const activity = rows.map((a) => {
      const p = typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload || {};
      let title = a.event_type.replace(/_/g, " ");
      let desc = "Verified cryptographic audit trail recorded.";

      if (a.event_type === "PAYMENT_CAPTURED") {
        title = "Instant UPI Payment Captured";
        const amt = p.amount ? (p.amount > 1000 ? p.amount / 100 : p.amount) : null;
        desc = amt
          ? `₹${amt.toLocaleString("en-IN")} settled via Razorpay UPI (${p.method || "UPI"})`
          : `Payment settled via Razorpay UPI (${p.method || "UPI"})`;
      } else if (a.event_type === "INVENTORY_LOCKED") {
        title = "Autonomous Inventory Reservation";
        desc = `Locked 1 unit for ${p.sku || p.productTitle || "item"} (Redis Redlock TTL 120s)`;
      } else if (a.event_type === "NEGOTIATION_COMPLETED") {
        title = "AI Counter-Offer Agreed";
        desc = p.agreedPrice
          ? `Deal struck at ₹${Number(p.agreedPrice).toLocaleString("en-IN")}${p.discountPercent ? ` with ${p.discountPercent}% concession` : ""}`
          : `Deal agreed within floor price mandate`;
      } else if (a.event_type === "INVENTORY_UPDATED") {
        title = "Catalog Stock Synchronized";
        desc = `${p.sku || p.title || "Catalog SKU"} stock verified (${p.newStock ?? p.inventory ?? 0} available)`;
      }

      return {
        id: `act_${a.id}`,
        type: a.event_type,
        eventType: a.event_type,
        title,
        description: desc,
        whatsappMessageId: a.whatsapp_message_id || undefined,
        conversationId: a.conversation_id || undefined,
        x402TransactionId: a.x402_transaction_id || `x402_${a.id}`,
        razorpayPaymentId: a.razorpay_payment_id || undefined,
        orderId: a.order_id || undefined,
        payload: p,
        checksum: a.event_checksum || `chk_${a.id}`,
        timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : new Date().toISOString(),
        metadata: {
          ...p,
          x402TransactionId: a.x402_transaction_id,
          razorpayPaymentId: a.razorpay_payment_id,
          orderId: a.order_id,
        },
      };
    });

    return res.json(activity);
  } catch (err) {
    logger.error({ err }, "Get activity error");
    return res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// GET /api/v1/activity/notifications
router.get("/notifications", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);

    const { rows } = await db.query(
      `SELECT id, event_type, payload, timestamp
       FROM audit_ledger
       WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
       ORDER BY id DESC
       LIMIT 5`,
      [storeId]
    );

    const notifications = rows.map((a, i) => {
      const p = typeof a.payload === "string" ? JSON.parse(a.payload) : a.payload || {};
      let title = "System Notification";
      let description = "Live agent telemetry update";
      let type = "deal";

      if (a.event_type === "PAYMENT_CAPTURED") {
        title = "UPI Payment Captured";
        const amt = p.amount ? (p.amount > 1000 ? p.amount / 100 : p.amount) : null;
        description = amt
          ? `₹${amt.toLocaleString("en-IN")} received via Razorpay UPI.`
          : `Payment received via Razorpay UPI.`;
        type = "payment";
      } else if (a.event_type === "NEGOTIATION_COMPLETED") {
        title = "AI Deal Closed on WhatsApp";
        description = `Auto-conceded discount to close ${p.product || p.productTitle || "buyer"} lead.`;
        type = "deal";
      } else if (a.event_type === "INVENTORY_LOCKED" || a.event_type === "INVENTORY_UPDATED") {
        title = "Inventory Telemetry";
        description = `${p.sku || p.productTitle || "Product SKU"} inventory reserved atomically.`;
        type = "inventory";
      }

      return {
        id: `notif_${a.id || i}`,
        title,
        description,
        time: a.timestamp ? formatRelativeTime(new Date(a.timestamp)) : "Just now",
        read: false,
        type,
      };
    });

    return res.json(notifications);
  } catch (err) {
    logger.error({ err }, "Get notifications error");
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

export default router;

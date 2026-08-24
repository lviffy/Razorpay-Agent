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

// GET /api/v1/conversations — List all conversation threads with transcripts & traces
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);

    const { rows } = await db.query(
      `SELECT
        id,
        conversation_id,
        phone_number,
        customer_name,
        buyer_agent_id,
        mandate_id,
        session_state,
        status,
        deal_amount,
        products_discussed,
        last_message_id,
        context,
        created_at,
        updated_at
      FROM conversations
      WHERE ($1::uuid IS NULL OR store_id = $1::uuid)
      ORDER BY updated_at DESC`,
      [storeId]
    );

    const threads = rows.map((r) => {
      const ctx = typeof r.context === "string" ? JSON.parse(r.context) : r.context || {};
      const transcript = ctx.transcript || [];
      const traces = ctx.traces || [];
      const lastMsgObj = transcript[transcript.length - 1];

      return {
        id: r.conversation_id || `conv_${r.id.slice(0, 8)}`,
        customerPhone: r.phone_number,
        customerName: r.customer_name || "Customer",
        lastMessage: lastMsgObj ? lastMsgObj.content : "Inbound WhatsApp message",
        lastMessageAt: lastMsgObj ? lastMsgObj.timestamp : new Date(r.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: (r.status || "active") as "active" | "negotiating" | "deal_closed" | "escalated",
        unread: false,
        dealAmount: r.deal_amount ? parseFloat(r.deal_amount) : undefined,
        productsDiscussed: Array.isArray(r.products_discussed)
          ? r.products_discussed
          : typeof r.products_discussed === "string"
          ? JSON.parse(r.products_discussed)
          : [],
        messages: transcript.map((m: any, idx: number) => ({
          id: m.id || `msg_${idx}`,
          conversationId: r.conversation_id,
          sender: m.sender || "customer",
          content: m.content || "",
          timestamp: m.timestamp || "Just now",
          metadata: m.metadata || undefined,
        })),
        traces: traces.map((t: any, idx: number) => ({
          id: t.id || `trace_${idx}`,
          title: t.title || "Agent Execution Step",
          detail: t.detail || "",
          status: t.status || "completed",
          timestamp: t.timestamp || "Just now",
          durationMs: t.durationMs || 45,
        })),
      };
    });

    return res.json(threads);
  } catch (err) {
    console.error("Conversations list error:", err);
    return res.status(500).json({ error: "Failed to list conversations" });
  }
});

// GET /api/v1/conversations/:id — Get conversation thread by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM conversations WHERE conversation_id = $1 OR id::text = $1`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const r = rows[0];
    const ctx = typeof r.context === "string" ? JSON.parse(r.context) : r.context || {};
    const transcript = ctx.transcript || [];
    const traces = ctx.traces || [];

    return res.json({
      id: r.conversation_id,
      customerPhone: r.phone_number,
      customerName: r.customer_name || "Customer",
      status: r.status || "active",
      dealAmount: r.deal_amount ? parseFloat(r.deal_amount) : undefined,
      productsDiscussed: r.products_discussed || [],
      messages: transcript,
      traces,
    });
  } catch (err) {
    console.error("Get conversation error:", err);
    return res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

export default router;

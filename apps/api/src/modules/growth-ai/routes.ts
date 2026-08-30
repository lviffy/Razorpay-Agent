import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "@zapai/database";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";
import {
  processGrowthAIChat,
  generateDailyBriefing,
  ChatMessage,
} from "./service.ts";
import { executeToolCall } from "./tools.ts";

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

  // Fallback to active store if available
  const { rows } = await db.query(
    "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0]?.id || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/growth-ai/chat — Interactive Store Intelligence Chat
// ─────────────────────────────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { messages, message } = req.body;

    let chatHistory: ChatMessage[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      chatHistory = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content || m.text || "",
      }));
    } else if (message && typeof message === "string") {
      chatHistory = [{ role: "user", content: message }];
    } else {
      return res.status(400).json({ error: "A message string or messages array is required." });
    }

    const response = await processGrowthAIChat(chatHistory, { storeId });
    return res.json(response);
  } catch (err: any) {
    logger.error({ err }, "Growth AI chat endpoint error");
    return res.status(500).json({
      error: "Failed to process Growth AI chat",
      message: err?.message || "Unknown error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/growth-ai/briefing — Proactive Daily Store Growth Briefing
// ─────────────────────────────────────────────────────────────────────────────
router.get("/briefing", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const briefing = await generateDailyBriefing({ storeId });
    return res.json(briefing);
  } catch (err: any) {
    logger.error({ err }, "Growth AI briefing endpoint error");
    return res.status(500).json({
      error: "Failed to generate Growth AI daily briefing",
      message: err?.message || "Unknown error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/growth-ai/inventory-radar — Inventory Health & Burn Rate
// ─────────────────────────────────────────────────────────────────────────────
router.get("/inventory-radar", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const filterStatus = (req.query.filter as string) || "ALL";
    const data = await executeToolCall("getInventoryHealthMetrics", { filterStatus }, { storeId });
    return res.json(data);
  } catch (err: any) {
    logger.error({ err }, "Growth AI inventory radar endpoint error");
    return res.status(500).json({
      error: "Failed to fetch inventory radar",
      message: err?.message || "Unknown error",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/growth-ai/action — Execute 1-Click Store Action
// ─────────────────────────────────────────────────────────────────────────────
router.post("/action", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);
    const { actionType, sku, value } = req.body;

    if (!actionType || value === undefined) {
      return res.status(400).json({ error: "actionType and value are required." });
    }

    const result = await executeToolCall("executeStoreAction", { actionType, sku, value }, { storeId });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result);
  } catch (err: any) {
    logger.error({ err }, "Growth AI execute action error");
    return res.status(500).json({
      error: "Failed to execute store action",
      message: err?.message || "Unknown error",
    });
  }
});

export default router;

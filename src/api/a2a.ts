import { Router } from "express";
import { BuyerAgent } from "../agents/buyer-agent.ts";
import { getAllStores } from "../services/merchant.ts";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────────────────────────────────────
// A2A (Agent-to-Agent) Protocol Engine
// Implements autonomous Buyer Agent execution and store-to-store negotiation
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// POST /api/v1/a2a/negotiate — Query a single store seller agent
router.post("/negotiate", async (req: Request, res: Response) => {
  const { storeId, buyerQuery, targetPrice, sessionId = uuidv4(), mandateId } = req.body;

  if (!storeId || !buyerQuery) {
    return res.status(400).json({
      error: "storeId and buyerQuery are required",
    });
  }

  try {
    const { SellerAgent } = await import("../agents/seller-agent.ts");
    const seller = new SellerAgent(storeId);

    const offer = await seller.handleQuery({
      buyerQuery,
      targetPrice,
      sessionId,
    });

    if (!offer) {
      return res.status(404).json({
        error: "No matching products found in this store",
      });
    }

    return res.json({ offer });
  } catch (err) {
    console.error("A2A negotiate error:", err);
    return res.status(500).json({ error: "Negotiation failed" });
  }
});

// POST /api/v1/a2a/buyer-task — Run full autonomous Buyer Agent across all stores
router.post("/buyer-task", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    task = "Buy running shoes under ₹4,000",
    budget = 4000,
    phoneNumber = "+91 98765 43210",
  } = req.body;

  try {
    const buyerAgent = new BuyerAgent();
    const sessionId = `a2a_${uuidv4().slice(0, 8)}`;

    const decision = await buyerAgent.processTask({
      message: task,
      spendingLimit: Number(budget),
      phoneNumber,
      conversationId: `conv_${sessionId}`,
      waMessageId: `msg_${sessionId}`,
    });

    const stores = await getAllStores();

    return res.json({
      sessionId,
      task,
      budget: Number(budget),
      decision,
      storesScanned: stores.map((s) => ({ id: s.id, name: s.name, city: s.city })),
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Buyer task error:", err);
    return res.status(500).json({ error: "Failed to execute autonomous buyer agent", detail: String(err) });
  }
});

export default router;

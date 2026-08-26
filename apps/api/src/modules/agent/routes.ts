import { Router } from "express";
import { BuyerAgent } from "./buyer-agent.ts";
import { SellerAgent } from "./seller-agent.ts";
import { getAllStores } from "../../services/merchant.ts";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../core/logger/index.ts";

const router = Router();

// POST /api/v1/a2a/negotiate
router.post("/negotiate", async (req: Request, res: Response) => {
  const { storeId, buyerQuery, targetPrice, sessionId = uuidv4(), mandateId } = req.body;

  if (!storeId || !buyerQuery) {
    return res.status(400).json({
      error: "storeId and buyerQuery are required",
    });
  }

  try {
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
    logger.error({ err }, "A2A negotiate error");
    return res.status(500).json({ error: "Negotiation failed" });
  }
});

// POST /api/v1/a2a/buyer-task
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
    logger.error({ err }, "Buyer task error");
    return res.status(500).json({ error: "Failed to execute autonomous buyer agent", detail: String(err) });
  }
});

export default router;

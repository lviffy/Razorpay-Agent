import { Router } from "express";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// A2A (Agent-to-Agent) negotiation API
// Used by Buyer Agent to send structured queries to Seller Agents
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

router.post("/negotiate", async (req: Request, res: Response) => {
  const { storeId, buyerQuery, targetPrice, sessionId, mandateId } = req.body;

  if (!storeId || !buyerQuery || !sessionId) {
    return res.status(400).json({
      error: "storeId, buyerQuery, and sessionId are required",
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

export default router;

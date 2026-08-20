import { Router } from "express";
import { getCatalogForAgent, getAllStores } from "../services/merchant.ts";
import { issueChallenge, verifyAuthorization, issueTransactionId } from "../services/x402.ts";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// Catalog API — x402 Fiat-Native HTTP 402 challenge/response
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  // Step 1: Check for X-402-Authorization header
  const authHeader = req.headers["x-402-authorization"];

  if (!authHeader) {
    // No auth — issue HTTP 402 challenge (symbolic amount for catalog access)
    const { headers, challenge } = issueChallenge(
      "catalog_access",
      0 // catalog access is free — challenge is for agent identity verification
    );

    // Attach all X-402-* headers
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }

    return res.status(402).json({
      error: "Payment Required",
      message: "Submit X-402-Authorization header to access catalog",
      paymentRequirements: {
        version: challenge.version,
        scheme: challenge.scheme,
        amount: challenge.amount,
        currency: "INR",
        description: "AgentBridge catalog access",
        challenge: challenge.challenge,
        expiresAt: challenge.expiry,
      },
    });
  }

  // Step 2: Verify the authorization token
  const verification = verifyAuthorization(req.headers as Record<string, string>);

  if (!verification.valid) {
    return res.status(401).json({
      error: "Unauthorized",
      reason: verification.reason,
    });
  }

  // Step 3: Return structured catalog
  const catalog = await getCatalogForAgent();
  const x402TxId = issueTransactionId();

  // Attach receipt header
  res.setHeader("X-402-Receipt", x402TxId);

  return res.json({
    x402TransactionId: x402TxId,
    stores: catalog.map(({ store, products }) => ({
      storeId: store.id,
      storeName: store.name,
      city: store.city,
      currency: store.currency,
      products,
    })),
    generatedAt: new Date().toISOString(),
  });
});

export default router;

import { Router } from "express";
import { getCatalogForAgent } from "../../services/merchant.ts";
import { issueChallenge, verifyAuthorization, issueTransactionId } from "../../services/x402.ts";
import type { Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const authHeader = req.headers["x-402-authorization"];

  if (!authHeader) {
    const { headers, challenge } = issueChallenge(
      "catalog_access",
      0
    );

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
        description: "ZapAI catalog access",
        challenge: challenge.challenge,
        expiresAt: challenge.expiry,
      },
    });
  }

  const verification = verifyAuthorization(req.headers as Record<string, string>);

  if (!verification.valid) {
    return res.status(401).json({
      error: "Unauthorized",
      reason: verification.reason,
    });
  }

  const catalog = await getCatalogForAgent();
  const x402TxId = issueTransactionId();

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

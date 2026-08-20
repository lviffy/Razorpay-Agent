import { Router } from "express";
import type { Request, Response } from "express";

// ─────────────────────────────────────────────────────────────────────────────
// Checkout API — reserve inventory + create payment link
// Called by the WhatsApp worker internally; exposed as REST for testing
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// POST /api/v1/checkout/reserve — acquire lock + create Razorpay order
router.post("/reserve", async (_req: Request, res: Response) => {
  // This logic lives in the WhatsApp worker for the demo.
  // This stub is retained for external agent access and testing.
  res.status(501).json({ message: "Use /api/v1/a2a/negotiate → WhatsApp flow" });
});

// POST /api/v1/checkout/pay — create Standard Payment Link
router.post("/pay", async (_req: Request, res: Response) => {
  res.status(501).json({ message: "Use /api/v1/a2a/negotiate → WhatsApp flow" });
});

export default router;

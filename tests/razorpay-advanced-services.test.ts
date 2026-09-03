import { describe, it, expect } from "bun:test";
import {
  registerCustomerMandateToken,
  chargeMandateToken,
  RBI_SUB_MANDATE_MAX_PAISE,
  fetchActiveRazorpayOffers,
  calculateBestRazorpayDiscount,
  createRazorpaySplitOrder,
  calculateBundleTransfers,
  processRazorpayRefund,
  compileDisputeEvidence,
  submitRazorpayDisputeEvidence,
  defaultRazorpayAdapter,
} from "../apps/api/src/payments";
import { evaluateBuyerOffer } from "../apps/api/src/commerce/offers";
import { computeBlockHash, computePayloadHash, GENESIS_HASH } from "../apps/api/src/audit/hash-chain";
import type { AuditLedgerEntry, Product, NegotiationRules, A2AOffer } from "@zapai/types";

describe("Advanced Razorpay Services Integration Suite", () => {
  // ── 1. UPI AutoPay & Tokenized Mandate Settlement ───────────────────────────
  describe("UPI AutoPay & Tokenized Mandates", () => {
    it("should register a customer mandate token within RBI limits", async () => {
      const result = await registerCustomerMandateToken({
        customerId: "cust_agent_buyer_01",
        maxAmountPaise: 1000000, // ₹10,000
        frequency: "as_presented",
        authType: "upi",
      });

      expect(result.tokenId).toBeDefined();
      expect(result.status).toBe("active");
      expect(result.maxAmountPaise).toBe(1000000);
    });

    it("should execute a zero-touch autonomous token debit for transactions under ₹15,000", async () => {
      const debitResult = await chargeMandateToken({
        tokenId: "token_autopay_test_01",
        customerId: "cust_agent_buyer_01",
        amountPaise: 379900, // ₹3,799
        orderId: "ORD-AUTOPAY-101",
        description: "Autonomous Agent Settlement for Running Shoes",
      });

      expect(debitResult.paymentId).toBeDefined();
      expect(debitResult.status).toBe("captured");
      expect(debitResult.amountPaise).toBe(379900);
      expect(debitResult.rbiExemptionApplied).toBe(true);
    });

    it("should reject autonomous zero-touch debit exceeding the RBI ₹15,000 threshold", async () => {
      const overLimitAmount = RBI_SUB_MANDATE_MAX_PAISE + 100000; // ₹16,000
      expect(
        chargeMandateToken({
          tokenId: "token_autopay_test_01",
          customerId: "cust_agent_buyer_01",
          amountPaise: overLimitAmount,
          orderId: "ORD-AUTOPAY-EXCEED",
        })
      ).rejects.toThrow("exceeds RBI e-mandate exemption limit");
    });
  });

  // ── 2. Razorpay Dynamic Offers Engine in A2A Negotiations ───────────────────
  describe("Razorpay Offers Engine & A2A Dynamic Bargaining", () => {
    it("should calculate optimal discount across active bank & UPI campaigns", async () => {
      const offers = await fetchActiveRazorpayOffers();
      expect(offers.length).toBeGreaterThan(0);

      // Test with ₹4,000 order
      const calculation = calculateBestRazorpayDiscount(400000, offers);
      expect(calculation.offerApplied).toBeDefined();
      expect(calculation.savingsPaise).toBeGreaterThan(0);
      expect(calculation.discountedPricePaise).toBe(400000 - calculation.savingsPaise);
    });

    it("should inject Razorpay affiliate offers into A2A counter-offer reasoning", async () => {
      const product: Product = {
        id: "prod_shoe_01",
        skuId: "SKU-SHOE-001",
        title: "Pro Marathon Running Shoes",
        price: 4999, // ₹4,999
        minPrice: 4200, // ₹4,200 floor price
        inventory: 10,
        merchantId: "merchant_runfast",
      };

      const rules: NegotiationRules = {
        maxDiscountPercentage: 10, // Max discount to ₹4,499.10
        freeShippingThreshold: 3000,
        allowBundleOffers: true,
      };

      const offer: A2AOffer = {
        type: "OFFER",
        offerId: "off_101",
        conversationId: "conv_test",
        merchantId: "merchant_runfast",
        skuId: "SKU-SHOE-001",
        quantity: 1,
        targetPrice: 380000, // ₹3,800 (too low)
        currency: "INR",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };

      const activeOffers = await fetchActiveRazorpayOffers();
      const evalResult = evaluateBuyerOffer({
        product,
        rules,
        offer,
        availableRazorpayOffers: activeOffers,
      });

      expect(evalResult.decision).toBe("COUNTER");
      expect(evalResult.razorpayOffer).toBeDefined();
      expect(evalResult.reasoning).toContain("Eligible for");
    });
  });

  // ── 3. Razorpay Route (Multi-Merchant Split Settlements) ─────────────────────
  describe("Razorpay Route & Split Settlements", () => {
    it("should accurately compute multi-seller bundle distribution and platform fee", () => {
      const bundle = calculateBundleTransfers({
        items: [
          { merchantAccountId: "acc_shoe_seller", itemPricePaise: 350000, skuId: "SKU-SHOE-001" }, // ₹3,500
          { merchantAccountId: "acc_sock_seller", itemPricePaise: 49900, skuId: "SKU-SOCK-001" },   // ₹499
        ],
        facilitatorCommissionPercent: 2, // 2% platform fee
      });

      expect(bundle.totalAmountPaise).toBe(399900);
      expect(bundle.facilitatorFeePaise).toBe(Math.round(350000 * 0.02) + Math.round(49900 * 0.02));
      expect(bundle.transfers.length).toBe(2);
      expect(bundle.transfers[0].amountPaise).toBe(350000 - Math.round(350000 * 0.02));
    });

    it("should create a split order with linked account routing via Adapter", async () => {
      const splitResult = await defaultRazorpayAdapter.createSplitOrder({
        amountPaise: 399900,
        receipt: "rcpt_bundle_split_01",
        transfers: [
          { account: "acc_shoe_seller", amountPaise: 343000, onHold: false },
          { account: "acc_sock_seller", amountPaise: 48902, onHold: false },
        ],
      });

      expect(splitResult.orderId).toBeDefined();
      expect(splitResult.transfers.length).toBe(2);
      expect(splitResult.facilitatorFeePaise).toBe(399900 - (343000 + 48902));
    });
  });

  // ── 4. Instant Programmatic Refunds ─────────────────────────────────────────
  describe("Instant Programmatic Refunds", () => {
    it("should trigger an instant refund with structured dispute reason", async () => {
      const refund = await processRazorpayRefund({
        paymentId: "pay_captured_test_101",
        amountPaise: 379900,
        speed: "instant",
        reason: "inventory_unavailable",
        notes: { agent_triggered: "true" },
      });

      expect(refund.refundId).toBeDefined();
      expect(refund.paymentId).toBe("pay_captured_test_101");
      expect(refund.status).toBe("processed");
      expect(refund.speed).toBe("instant");
      expect(refund.reason).toBe("inventory_unavailable");
    });
  });

  // ── 5. Audit Hash-Chain Dispute Evidence Adapter ────────────────────────────
  describe("Dispute Evidence Compilation & Cryptographic Verification", () => {
    it("should compile a verifiable dispute proof bundle linking the SHA-256 Hash Chain", async () => {
      // Create a 3-block valid hash chain
      const time1 = new Date().toISOString();
      const pHash1 = computePayloadHash({ offer: "OFFER", price: 399900 });
      const bHash1 = computeBlockHash({
        previousHash: GENESIS_HASH,
        eventType: "A2A_OFFER_ACCEPTED",
        actor: "BUYER_AGENT",
        payloadHash: pHash1,
        timestamp: time1,
      });

      const entry1: AuditLedgerEntry = {
        sequenceId: 1,
        eventId: "evt_1",
        transactionId: "tx_101",
        eventType: "A2A_OFFER_ACCEPTED",
        actor: "BUYER_AGENT",
        payload: { offer: "OFFER", price: 399900 },
        payloadHash: pHash1,
        previousHash: GENESIS_HASH,
        currentHash: bHash1,
        timestamp: time1,
      };

      const time2 = new Date().toISOString();
      const pHash2 = computePayloadHash({ paymentId: "pay_101", amount: 379900 });
      const bHash2 = computeBlockHash({
        previousHash: bHash1,
        eventType: "PAYMENT_SETTLED",
        actor: "ZAPAI_FACILITATOR",
        payloadHash: pHash2,
        timestamp: time2,
      });

      const entry2: AuditLedgerEntry = {
        sequenceId: 2,
        eventId: "evt_2",
        transactionId: "tx_101",
        eventType: "PAYMENT_SETTLED",
        actor: "ZAPAI_FACILITATOR",
        payload: { paymentId: "pay_101", amount: 379900 },
        payloadHash: pHash2,
        previousHash: bHash1,
        currentHash: bHash2,
        timestamp: time2,
      };

      const proofBundle = compileDisputeEvidence({
        disputeId: "disp_99182",
        transactionId: "tx_101",
        orderId: "ORD-101",
        auditEntries: [entry1, entry2],
        mandate: {
          mandateId: "mandate_8819",
          buyerId: "user_lviffy",
          spendingLimit: 400000,
          signature: "sig_ed25519_proof",
          nonce: "n_9912",
        },
      });

      expect(proofBundle.isChainIntact).toBe(true);
      expect(proofBundle.chainLength).toBe(2);
      expect(proofBundle.cryptographicProofDigest).toBeDefined();
      expect(proofBundle.rawTextSummary).toContain("SHA-256 Hash Chain Status: VERIFIED / INTACT");

      const submission = await submitRazorpayDisputeEvidence({
        disputeId: "disp_99182",
        proofBundle,
      });

      expect(submission.status).toBe("submitted");
      expect(submission.proofDigest).toBe(proofBundle.cryptographicProofDigest);
    });
  });
});

import { describe, it, expect } from "bun:test";
import {
  createSpendingMandate,
  verifyMandateSignature,
  verifyMandatePolicy,
  consumeNonce,
} from "../apps/api/src/mandate/index";
import {
  evaluateBuyerOffer,
  createCounterOfferEvent,
} from "../apps/api/src/commerce/offers";
import {
  createPaymentRequiredChallenge,
  signPaymentChallenge,
  ZapAIFacilitator,
  decodePaymentRequired,
  decodePaymentSignature,
} from "../apps/api/src/x402/index";
import {
  computePayloadHash,
  computeBlockHash,
  verifyAuditChainIntegrity,
  GENESIS_HASH,
} from "../apps/api/src/audit/hash-chain";
import type { Product, NegotiationRules, A2AOffer, AuditLedgerEntry } from "@zapai/types";

describe("Phase 1 — Spending Mandate & Zero-Trust Policy Engine", () => {
  it("should create and cryptographically sign a spending mandate", () => {
    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000, // ₹4,000.00 in paise
      currency: "INR",
      purpose: {
        category: "footwear",
        skuIds: ["SKU-SHOE-001", "SKU-SHOE-002"],
      },
      merchantAllowlist: ["runfast", "speedgear"],
      ttlSeconds: 3600,
    });

    expect(mandate.mandateId).toBeDefined();
    expect(mandate.nonce).toBeDefined();
    expect(mandate.signature).toBeDefined();
    expect(mandate.spendingLimit).toBe(400000);
    expect(mandate.currency).toBe("INR");

    // Cryptographic signature check
    const isValid = verifyMandateSignature(mandate);
    expect(isValid).toBe(true);
  });

  it("should fail validation if mandate signature is tampered", () => {
    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000,
      currency: "INR",
    });

    // Tamper with spending limit without re-signing
    const tamperedMandate = {
      ...mandate,
      spendingLimit: 900000,
    };

    const isValid = verifyMandateSignature(tamperedMandate);
    expect(isValid).toBe(false);
  });

  it("should enforce zero-trust spending limits on server", () => {
    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000, // ₹4,000.00
      currency: "INR",
      merchantAllowlist: ["runfast"],
    });

    // Case 1: Valid purchase under limit
    const validCheck = verifyMandatePolicy({
      mandate,
      merchantId: "runfast",
      amount: 379900, // ₹3,799.00
      currency: "INR",
    });
    expect(validCheck.valid).toBe(true);

    // Case 2: Purchase exceeding spending limit
    const overBudgetCheck = verifyMandatePolicy({
      mandate,
      merchantId: "runfast",
      amount: 450000, // ₹4,500.00
      currency: "INR",
    });
    expect(overBudgetCheck.valid).toBe(false);
    expect(overBudgetCheck.code).toBe("EXCEEDS_SPENDING_LIMIT");

    // Case 3: Merchant not in allowlist
    const forbiddenMerchantCheck = verifyMandatePolicy({
      mandate,
      merchantId: "unauthorized_store",
      amount: 200000,
      currency: "INR",
    });
    expect(forbiddenMerchantCheck.valid).toBe(false);
    expect(forbiddenMerchantCheck.code).toBe("MERCHANT_NOT_ALLOWED");
  });

  it("should prevent nonce replay attacks", () => {
    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000,
      currency: "INR",
    });

    // First use consumes the nonce
    const firstCheck = verifyMandatePolicy(
      {
        mandate,
        merchantId: "runfast",
        amount: 350000,
        currency: "INR",
      },
      { consumeNonce: true }
    );
    expect(firstCheck.valid).toBe(true);

    // Second use with the same nonce must fail
    const replayCheck = verifyMandatePolicy({
      mandate,
      merchantId: "runfast",
      amount: 350000,
      currency: "INR",
    });
    expect(replayCheck.valid).toBe(false);
    expect(replayCheck.code).toBe("NONCE_REUSED");
  });
});

describe("Phase 2 — Commerce & Offer Evaluation Engine", () => {
  const mockProduct: Product = {
    id: "prod_shoe_1",
    storeId: "runfast",
    title: "AeroGlide Marathon Running Shoes",
    sku: "SKU-SHOE-001",
    listedPrice: 3999, // ₹3,999
    floorPrice: 3400,  // ₹3,400
    price: 3999,
  };

  const mockRules: NegotiationRules = {
    storeId: "runfast",
    maxDiscountPercentage: 8, // max discount = ₹319.92, floor = ₹3,679.08
    freeShippingThreshold: 3000,
    allowBundleOffers: true,
  };

  it("should formulate a counter-offer when buyer offer is below allowed discount", () => {
    const offer: A2AOffer = {
      type: "OFFER",
      offerId: "off_1",
      conversationId: "conv_1",
      buyerAgentId: "agent_b1",
      merchantId: "runfast",
      skuId: "SKU-SHOE-001",
      quantity: 1,
      targetPrice: 350000, // ₹3,500.00
      currency: "INR",
      expiresAt: new Date(Date.now() + 120000).toISOString(),
    };

    const evaluation = evaluateBuyerOffer({
      product: mockProduct,
      rules: mockRules,
      offer,
    });

    expect(evaluation.decision).toBe("COUNTER");
    expect(evaluation.counterPrice).toBeGreaterThan(350000);
    expect(evaluation.shippingFree).toBe(true);

    const counterEvent = createCounterOfferEvent({ offer, evaluation });
    expect(counterEvent.type).toBe("COUNTER_OFFER");
    expect(counterEvent.price).toBe(evaluation.counterPrice!);
  });

  it("should accept deal when buyer offer is within allowed discount", () => {
    const offer: A2AOffer = {
      type: "OFFER",
      offerId: "off_2",
      conversationId: "conv_1",
      buyerAgentId: "agent_b1",
      merchantId: "runfast",
      skuId: "SKU-SHOE-001",
      quantity: 1,
      targetPrice: 379900, // ₹3,799.00 (within 8% discount)
      currency: "INR",
      expiresAt: new Date(Date.now() + 120000).toISOString(),
    };

    const evaluation = evaluateBuyerOffer({
      product: mockProduct,
      rules: mockRules,
      offer,
    });

    expect(evaluation.decision).toBe("ACCEPT");
    expect(evaluation.counterPrice).toBe(379900);
  });
});

describe("Phase 4 — x402 V2 Protocol & ZapAI Facilitator", () => {
  it("should complete full x402 challenge, signing, facilitator verification and settlement", async () => {
    // 1. Seller creates PAYMENT-REQUIRED challenge
    const challenge = createPaymentRequiredChallenge({
      merchantId: "runfast",
      orderId: "ORD-1042",
      amountPaise: 379900,
    });

    expect(challenge.requirements.scheme).toBe("exact");
    expect(challenge.requirements.network).toBe("zapai-inr");
    expect(challenge.requirements.amount).toBe("379900");

    // 2. Buyer creates valid mandate
    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000,
      currency: "INR",
      merchantAllowlist: ["runfast"],
    });

    // 3. Buyer signs payment challenge -> PAYMENT-SIGNATURE
    const signResult = signPaymentChallenge({
      paymentRequiredHeader: challenge.encodedHeader,
      mandate,
      merchantId: "runfast",
      skuId: "SKU-SHOE-001",
    });

    expect(signResult.success).toBe(true);
    expect(signResult.authorization).toBeDefined();

    // 4. ZapAI Facilitator verifies authorization (/x402/verify)
    const facilitator = new ZapAIFacilitator();
    const verifyResp = facilitator.verify({
      authorization: signResult.authorization!,
      requirements: challenge.requirements,
      mandate,
      merchantId: "runfast",
      skuId: "SKU-SHOE-001",
    });

    expect(verifyResp.valid).toBe(true);
    expect(verifyResp.paymentId).toBe(signResult.authorization!.paymentId);

    // 5. ZapAI Facilitator settles transaction (/x402/settle)
    const settleResp = await facilitator.settle({
      authorization: signResult.authorization!,
      requirements: challenge.requirements,
      mandate,
      merchantId: "runfast",
      skuId: "SKU-SHOE-001",
      orderId: "ORD-1042",
    });

    expect(settleResp.success).toBe(true);
    expect(settleResp.response.success).toBe(true);
    expect(settleResp.response.amount).toBe(379900);
    expect(settleResp.executionResult.settlementMode).toBe("AUTONOMOUS_FACILITATOR");
  });

  it("should trigger human approval fallback when customer interactive rail is required", async () => {
    const challenge = createPaymentRequiredChallenge({
      merchantId: "runfast",
      orderId: "ORD-1043",
      amountPaise: 379900,
    });

    const mandate = createSpendingMandate({
      buyerId: "usr_buyer_101",
      spendingLimit: 400000,
      currency: "INR",
    });

    const signResult = signPaymentChallenge({
      paymentRequiredHeader: challenge.encodedHeader,
      mandate,
      merchantId: "runfast",
    });

    const facilitator = new ZapAIFacilitator();
    const settleResp = await facilitator.settle({
      authorization: signResult.authorization!,
      requirements: challenge.requirements,
      mandate,
      merchantId: "runfast",
      orderId: "ORD-1043",
      options: {
        allowHumanFallback: true,
        customer: {
          name: "Aarav Patel",
          contact: "+919876543210",
        },
      },
    });

    expect(settleResp.success).toBe(true);
    expect(settleResp.executionResult.settlementMode).toBe("HUMAN_PAYMENT_LINK");
    expect(settleResp.executionResult.status).toBe("PENDING_HUMAN_APPROVAL");
    expect(settleResp.executionResult.paymentUrl).toBeDefined();
  });
});

describe("Phase 6 — Tamper-Evident Hash-Chained Audit Ledger", () => {
  it("should build and verify a cryptographically linked hash chain", () => {
    const timestamp1 = "2026-08-31T18:30:00.000Z";
    const payload1 = { sku: "SKU-SHOE-001", price: 399900 };
    const payloadHash1 = computePayloadHash(payload1);
    const blockHash1 = computeBlockHash({
      previousHash: GENESIS_HASH,
      eventType: "OFFER_CREATED",
      actor: "BUYER_AGENT",
      payloadHash: payloadHash1,
      timestamp: timestamp1,
    });

    const entry1: AuditLedgerEntry = {
      eventId: "evt_1",
      transactionId: "tx_100",
      eventType: "OFFER_CREATED",
      actor: "BUYER_AGENT",
      payload: payload1,
      payloadHash: payloadHash1,
      previousHash: GENESIS_HASH,
      currentHash: blockHash1,
      timestamp: timestamp1,
    };

    const timestamp2 = "2026-08-31T18:30:02.000Z";
    const payload2 = { agreedPrice: 379900, status: "DEAL_ACCEPTED" };
    const payloadHash2 = computePayloadHash(payload2);
    const blockHash2 = computeBlockHash({
      previousHash: blockHash1,
      eventType: "DEAL_ACCEPTED",
      actor: "SELLER_AGENT",
      payloadHash: payloadHash2,
      timestamp: timestamp2,
    });

    const entry2: AuditLedgerEntry = {
      eventId: "evt_2",
      transactionId: "tx_100",
      eventType: "DEAL_ACCEPTED",
      actor: "SELLER_AGENT",
      payload: payload2,
      payloadHash: payloadHash2,
      previousHash: blockHash1,
      currentHash: blockHash2,
      timestamp: timestamp2,
    };

    const chain: AuditLedgerEntry[] = [entry1, entry2];
    const check = verifyAuditChainIntegrity(chain);
    expect(check.valid).toBe(true);

    // Tampering test: modify entry 1 payload
    const tamperedEntry1: AuditLedgerEntry = {
      ...entry1,
      payload: { sku: "SKU-SHOE-001", price: 100000 }, // illegally altered price
    };

    const tamperedCheck = verifyAuditChainIntegrity([tamperedEntry1, entry2]);
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.brokenIndex).toBe(0);
  });
});

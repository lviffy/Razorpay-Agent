import { describe, expect, it } from "bun:test";
import { createHmac } from "crypto";
import {
  normalizeShopDomain,
  verifyShopifyWebhookHmac,
  createShopifyOrder,
} from "../apps/api/src/integrations/shopify/index.ts";

describe("Shopify Integration & Synchronization Engine", () => {
  describe("Domain Normalization", () => {
    it("should normalize bare store handles to myshopify.com", () => {
      expect(normalizeShopDomain("runfast-sports")).toBe("runfast-sports.myshopify.com");
      expect(normalizeShopDomain("runfast-sports.myshopify.com")).toBe("runfast-sports.myshopify.com");
    });

    it("should clean http and https prefixes and paths", () => {
      expect(normalizeShopDomain("https://rohanm.in/")).toBe("rohanm.in");
      expect(normalizeShopDomain("http://store.myshopify.com/admin/products")).toBe("store.myshopify.com");
    });

    it("should handle custom domains", () => {
      expect(normalizeShopDomain("runfastsports.in")).toBe("runfastsports.in");
    });
  });

  describe("Webhook HMAC Verification", () => {
    const secret = "shpss_test_secret_12345";
    const payload = JSON.stringify({
      id: 123456789,
      title: "Nike Air Zoom Pegasus 40",
      vendor: "RunFast Sports",
      variants: [{ id: 987654321, price: "3999.00", inventory_quantity: 12 }],
    });

    it("should verify valid HMAC SHA-256 signature", () => {
      const validHmac = createHmac("sha256", secret).update(payload).digest("base64");
      const isValid = verifyShopifyWebhookHmac(payload, validHmac, secret);
      expect(isValid).toBe(true);
    });

    it("should reject tampered payload or incorrect secret", () => {
      const validHmac = createHmac("sha256", secret).update(payload).digest("base64");
      const isInvalidSecret = verifyShopifyWebhookHmac(payload, validHmac, "wrong_secret");
      expect(isInvalidSecret).toBe(false);

      const tamperedPayload = payload + " ";
      const isInvalidPayload = verifyShopifyWebhookHmac(tamperedPayload, validHmac, secret);
      expect(isInvalidPayload).toBe(false);
    });

    it("should gracefully reject missing signature or secret", () => {
      expect(verifyShopifyWebhookHmac(payload, undefined, secret)).toBe(false);
      expect(verifyShopifyWebhookHmac(payload, "invalid_sig", "")).toBe(false);
    });
  });

  describe("Shopify Order Creation Decoupling", () => {
    it("should gracefully handle store without Shopify connection without throwing", async () => {
      const result = await createShopifyOrder({
        storeId: "00000000-0000-0000-0000-000000000000",
        orderId: "test_ord_1",
        orderReferenceId: "ORD-9999",
        amount: 3799,
        productTitle: "Test Running Shoes",
        sku: "RUN-SHOE-10",
        customerName: "Aarav Patel",
        customerPhone: "+919876543210",
        razorpayPaymentId: "pay_test_mock_123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

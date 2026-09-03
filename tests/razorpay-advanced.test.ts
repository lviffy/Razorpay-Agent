import { describe, expect, test } from "bun:test";
import { createRazorpayInvoice } from "../apps/api/src/payments/razorpay/invoices.ts";
import { createRazorpayQrCode, generateUpiDeepLink } from "../apps/api/src/payments/razorpay/qr.ts";
import { createRazorpaySubscriptionPlan, createRazorpaySubscription } from "../apps/api/src/payments/razorpay/subscriptions.ts";
import { fetchActiveRazorpayOffers, calculateBestRazorpayDiscount } from "../apps/api/src/payments/razorpay/offers.ts";
import { defaultRazorpayAdapter } from "../apps/api/src/payments/razorpay/adapter.ts";

describe("Razorpay Advanced Capabilities Suite", () => {
  test("1. Dynamic GST Invoice Generation with Tax Breakdown", async () => {
    const inv = await createRazorpayInvoice({
      orderRef: "ORD-TEST-9921",
      customer: {
        name: "Aarav Sharma",
        contact: "+919876543210",
        email: "aarav@example.com",
      },
      lineItems: [
        {
          name: "Running Shoes",
          amountPaise: 300000, // ₹3,000.00
          quantity: 1,
          hsnCode: "640411",
        },
      ],
      taxPercent: 18,
    });

    expect(inv.invoiceNumber).toContain("INV-");
    expect(inv.netAmountPaise).toBe(300000);
    expect(inv.status).toBe("issued");
    expect(inv.pdfUrl).toBeDefined();
    expect(inv.gstBreakdown.taxRatePercent).toBe(18);
    expect(inv.gstBreakdown.cgstPaise + inv.gstBreakdown.sgstPaise).toBe(inv.taxAmountPaise);
  });

  test("2. Dynamic UPI QR Code & UPI DeepLink Generation", async () => {
    const deepLink = generateUpiDeepLink({
      payeeName: "ZapAI RunFast Sports",
      amountPaise: 150000,
      transactionRef: "ORD-9821",
      transactionNote: "Shoes Payment",
    });

    expect(deepLink).toContain("upi://pay?");
    expect(deepLink).toContain("am=1500.00");
    expect(deepLink).toContain("tr=ORD-9821");

    const qr = await createRazorpayQrCode({
      orderRef: "ORD-9821",
      amountPaise: 150000,
      description: "Shoes Payment",
      customerName: "Aarav",
    });

    expect(qr.qrId).toBeDefined();
    expect(qr.imageUrl).toBeDefined();
    expect(qr.status).toBe("active");
  });

  test("3. Razorpay Offers Engine & Best Discount Calculation", async () => {
    const offers = await fetchActiveRazorpayOffers({ amountPaise: 350000 });
    expect(offers.length).toBeGreaterThan(0);

    const calc = calculateBestRazorpayDiscount(350000, offers);
    expect(calc.savingsPaise).toBeGreaterThan(0);
    expect(calc.discountedPricePaise).toBeLessThan(350000);
    expect(calc.offerApplied).toBeDefined();
  });

  test("4. Recurring AutoPay Subscriptions & Plan Setup", async () => {
    const plan = await createRazorpaySubscriptionPlan({
      name: "Monthly Restock Plan",
      period: "monthly",
      interval: 1,
      amountPaise: 99900,
    });

    expect(plan.id).toBeDefined();

    const sub = await createRazorpaySubscription({
      planId: plan.id,
      totalCount: 12,
    });

    expect(sub.subscriptionId).toBeDefined();
    expect(sub.totalCount).toBe(12);
  });

  test("5. Payment Adapter Integration Verification", async () => {
    const inv = await defaultRazorpayAdapter.createInvoice({
      orderRef: "ORD-ADAPTER-1",
      customer: { name: "Test User", contact: "+919999999999" },
      lineItems: [{ name: "Product A", amountPaise: 100000, quantity: 1 }],
    });
    expect(inv.invoiceId).toBeDefined();

    const qr = await defaultRazorpayAdapter.generateQrCode({
      orderRef: "ORD-ADAPTER-1",
      amountPaise: 100000,
      description: "Adapter QR Test",
    });
    expect(qr.qrId).toBeDefined();
  });
});

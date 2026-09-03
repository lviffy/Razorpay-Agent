import type { PaymentService } from "../payment-service";
import { createRazorpayOrder, type CreateRazorpayOrderParams, type RazorpayOrderResult } from "./orders";
import { createRazorpayPaymentLink, type CreatePaymentLinkParams, type PaymentLinkResult } from "./payment-links";
import { verifyRazorpayWebhookSignature } from "./webhooks";
import {
  chargeMandateToken,
  registerCustomerMandateToken,
  type ChargeMandateTokenParams,
  type TokenDebitResult,
  type RegisterMandateTokenParams,
  type MandateTokenResult,
} from "./autopay";
import {
  fetchActiveRazorpayOffers,
  calculateBestRazorpayDiscount,
  type RazorpayOffer,
  type BestOfferCalculationResult,
} from "./offers";
import {
  createRazorpaySplitOrder,
  calculateBundleTransfers,
  type CreateSplitOrderParams,
  type SplitOrderResult,
  type SplitTransferItem,
} from "./route";
import {
  processRazorpayRefund,
  type ProcessRefundParams,
  type RefundResult,
} from "./refunds";
import {
  compileDisputeEvidence,
  submitRazorpayDisputeEvidence,
  type DisputeProofBundle,
  type DisputeEvidenceResult,
} from "./disputes";
import {
  createRazorpayInvoice,
  type CreateInvoiceParams,
  type RazorpayInvoiceResult,
} from "./invoices";
import {
  createRazorpayQrCode,
  generateUpiDeepLink,
  type CreateQrCodeParams,
  type RazorpayQrCodeResult,
} from "./qr";
import {
  createRazorpaySubscriptionPlan,
  createRazorpaySubscription,
  type CreateSubscriptionPlanParams,
  type CreateSubscriptionParams,
  type RazorpaySubscriptionResult,
} from "./subscriptions";

export class RazorpayPaymentAdapter implements PaymentService {
  async createOrder(params: {
    amount: number; // in paise
    currency: "INR";
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ orderId: string; amount: number; currency: string }> {
    const res = await createRazorpayOrder({
      amountPaise: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    });
    return {
      orderId: res.orderId,
      amount: res.amount,
      currency: res.currency,
    };
  }

  async createPaymentLink(params: {
    amount: number; // in paise
    currency: "INR";
    description: string;
    customer: { name: string; contact: string; email?: string };
    notes?: Record<string, string>;
  }): Promise<{ paymentLinkId: string; paymentUrl: string }> {
    const res = await createRazorpayPaymentLink({
      amountPaise: params.amount,
      description: params.description,
      customer: params.customer,
      referenceId: params.notes?.orderId || `ref_${Date.now()}`,
      notes: params.notes,
    });
    return {
      paymentLinkId: res.paymentLinkId,
      paymentUrl: res.paymentUrl,
    };
  }

  verifyWebhookSignature(params: {
    rawBody: string | Buffer;
    signature: string;
    secret: string;
  }): boolean {
    return verifyRazorpayWebhookSignature({
      rawBody: params.rawBody,
      signature: params.signature,
      secret: params.secret,
    });
  }

  // ── Extended Deep Razorpay Methods for Autonomous Commerce ───────────────

  async registerMandateToken(params: RegisterMandateTokenParams): Promise<MandateTokenResult> {
    return registerCustomerMandateToken(params);
  }

  async chargeMandateToken(params: ChargeMandateTokenParams): Promise<TokenDebitResult> {
    return chargeMandateToken(params);
  }

  async fetchOffers(params?: { merchantId?: string; amountPaise?: number }): Promise<RazorpayOffer[]> {
    return fetchActiveRazorpayOffers(params);
  }

  calculateBestDiscount(amountPaise: number, offers?: RazorpayOffer[]): BestOfferCalculationResult {
    return calculateBestRazorpayDiscount(amountPaise, offers);
  }

  async createSplitOrder(params: CreateSplitOrderParams): Promise<SplitOrderResult> {
    return createRazorpaySplitOrder(params);
  }

  calculateBundleTransfers(params: {
    items: Array<{ merchantAccountId: string; itemPricePaise: number; skuId: string }>;
    facilitatorCommissionPercent?: number;
  }) {
    return calculateBundleTransfers(params);
  }

  async processRefund(params: ProcessRefundParams): Promise<RefundResult> {
    return processRazorpayRefund(params);
  }

  compileDisputeEvidence(params: Parameters<typeof compileDisputeEvidence>[0]): DisputeProofBundle {
    return compileDisputeEvidence(params);
  }

  async submitDisputeEvidence(params: {
    disputeId: string;
    proofBundle: DisputeProofBundle;
  }): Promise<DisputeEvidenceResult> {
    return submitRazorpayDisputeEvidence(params);
  }

  async createInvoice(params: CreateInvoiceParams): Promise<RazorpayInvoiceResult> {
    return createRazorpayInvoice(params);
  }

  async generateQrCode(params: CreateQrCodeParams): Promise<RazorpayQrCodeResult> {
    return createRazorpayQrCode(params);
  }

  generateUpiDeepLink(params: Parameters<typeof generateUpiDeepLink>[0]): string {
    return generateUpiDeepLink(params);
  }

  async createSubscriptionPlan(params: CreateSubscriptionPlanParams) {
    return createRazorpaySubscriptionPlan(params);
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<RazorpaySubscriptionResult> {
    return createRazorpaySubscription(params);
  }
}

export const defaultRazorpayAdapter = new RazorpayPaymentAdapter();


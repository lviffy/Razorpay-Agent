import type { PaymentService } from "../payment-service";
import { createRazorpayOrder } from "./orders";
import { createRazorpayPaymentLink } from "./payment-links";
import { verifyRazorpayWebhookSignature } from "./webhooks";

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
}

export const defaultRazorpayAdapter = new RazorpayPaymentAdapter();

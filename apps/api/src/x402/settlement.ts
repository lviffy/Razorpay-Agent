import type {
  X402PaymentAuthorization,
  X402PaymentRequirements,
  PaymentExecutionResult,
} from "@zapai/types";
import type { PaymentService } from "../payments/payment-service";
import { defaultRazorpayAdapter } from "../payments/razorpay/adapter";

export interface SettleChallengeOptions {
  paymentService?: PaymentService;
  allowHumanFallback?: boolean;
  customer?: { name: string; contact: string; email?: string };
}

/**
 * Executes settlement for a verified x402 payment authorization
 */
export async function executeSettlement(params: {
  authorization: X402PaymentAuthorization;
  requirements: X402PaymentRequirements;
  merchantId: string;
  orderId: string;
  options?: SettleChallengeOptions;
}): Promise<PaymentExecutionResult> {
  const paymentService = params.options?.paymentService ?? defaultRazorpayAdapter;
  const amountPaise = parseInt(params.authorization.amount, 10);
  const allowFallback = params.options?.allowHumanFallback ?? true;

  try {
    // 1. Create authoritative Razorpay order
    const order = await paymentService.createOrder({
      amount: amountPaise,
      currency: "INR",
      receipt: params.authorization.paymentId,
      notes: {
        mandateId: params.authorization.mandateId,
        orderId: params.orderId,
        merchantId: params.merchantId,
        x402Network: params.requirements.network,
      },
    });

    // 2. If human approval fallback is required (e.g. standard checkout test URL for demo)
    if (allowFallback && params.options?.customer) {
      const link = await paymentService.createPaymentLink({
        amount: amountPaise,
        currency: "INR",
        description: `Order ${params.orderId} at ${params.merchantId}`,
        customer: params.options.customer,
        notes: {
          orderId: params.orderId,
          paymentId: params.authorization.paymentId,
          mandateId: params.authorization.mandateId,
        },
      });

      return {
        success: true,
        settlementMode: "HUMAN_PAYMENT_LINK",
        razorpayOrderId: order.orderId,
        paymentUrl: link.paymentUrl,
        status: "PENDING_HUMAN_APPROVAL",
      };
    }

    // 3. Autonomous settlement confirmed via order
    return {
      success: true,
      settlementMode: "AUTONOMOUS_FACILITATOR",
      razorpayOrderId: order.orderId,
      razorpayPaymentId: `pay_auto_${params.authorization.paymentId}`,
      status: "CAPTURED",
    };
  } catch (err: any) {
    return {
      success: false,
      settlementMode: "AUTONOMOUS_FACILITATOR",
      status: "FAILED",
      error: `Settlement execution failure: ${err.message}`,
    };
  }
}

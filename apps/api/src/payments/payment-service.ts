import type { PaymentService, PaymentExecutionResult } from "@zapai/types";

export interface SettlementOptions {
  amountPaise: number;
  currency: "INR";
  orderId: string;
  paymentId: string;
  merchantId: string;
  customer?: { name: string; contact: string; email?: string };
  allowHumanFallback?: boolean;
}

export type { PaymentService, PaymentExecutionResult };

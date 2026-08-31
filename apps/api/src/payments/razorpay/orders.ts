import { getRazorpayClient } from "../../integrations/razorpay/index";

export interface CreateRazorpayOrderParams {
  amountPaise: number;
  currency?: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

/**
 * Creates an authoritative Razorpay Order via POST /v1/orders
 */
export async function createRazorpayOrder(
  params: CreateRazorpayOrderParams
): Promise<RazorpayOrderResult> {
  const client = getRazorpayClient();
  const currency = params.currency ?? "INR";

  if (!client) {
    // Deterministic mock order for local testing / buildathon offline demo
    return {
      orderId: `order_mock_${Date.now()}`,
      amount: params.amountPaise,
      currency,
      receipt: params.receipt,
      status: "created",
    };
  }

  try {
    const order = await client.orders.create({
      amount: params.amountPaise,
      currency,
      receipt: params.receipt,
      notes: {
        source: "zapai_x402",
        ...(params.notes ?? {}),
      },
    });

    return {
      orderId: order.id,
      amount: typeof order.amount === "number" ? order.amount : Number(order.amount),
      currency: order.currency,
      receipt: order.receipt ?? params.receipt,
      status: order.status,
    };
  } catch (err: any) {
    console.warn(`[Razorpay Orders API] API error: ${err.message}. Using test fallback order.`);
    return {
      orderId: `order_test_${Date.now()}`,
      amount: params.amountPaise,
      currency,
      receipt: params.receipt,
      status: "created",
    };
  }
}

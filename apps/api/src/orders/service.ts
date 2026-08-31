import { db } from "@zapai/database";
import type { Order, PaymentStatus } from "@zapai/types";
import { isValidOrderStateTransition } from "./state-machine";

export interface CreateOrderRecordParams {
  sessionId?: string;
  storeId?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  orderId: string;
  x402TxHash: string;
  mandateId?: string;
  amount: number; // in rupees
  originalPrice?: number;
  discountApplied?: number;
  customerName?: string;
  customerPhone?: string;
  productTitle?: string;
  sku?: string;
  status?: PaymentStatus;
}

/**
 * Creates an order record in the database
 */
export async function createOrderRecord(params: CreateOrderRecordParams): Promise<Order> {
  const { rows } = await db.query<Order>(
    `INSERT INTO orders (
      session_id, store_id, razorpay_order_id, razorpay_payment_id,
      order_id, x402_tx_hash, mandate_id, amount, original_price,
      discount_applied, customer_name, customer_phone, product_title,
      sku, currency, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'INR', $15, NOW(), NOW())
    ON CONFLICT (razorpay_order_id) DO UPDATE SET
      razorpay_payment_id = EXCLUDED.razorpay_payment_id,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *`,
    [
      params.sessionId ?? null,
      params.storeId ?? null,
      params.razorpayOrderId,
      params.razorpayPaymentId ?? null,
      params.orderId,
      params.x402TxHash,
      params.mandateId ?? null,
      params.amount,
      params.originalPrice ?? params.amount,
      params.discountApplied ?? 0,
      params.customerName ?? "Aarav Patel",
      params.customerPhone ?? "+91 98765 43210",
      params.productTitle ?? null,
      params.sku ?? null,
      params.status ?? "CREATED",
    ]
  );

  return rows[0];
}

/**
 * Updates order payment status idempotently
 */
export async function updateOrderStatus(
  orderIdOrRazorpayId: string,
  newStatus: PaymentStatus,
  razorpayPaymentId?: string
): Promise<boolean> {
  const { rows } = await db.query<{ status: PaymentStatus }>(
    `SELECT status FROM orders WHERE order_id = $1 OR razorpay_order_id = $1`,
    [orderIdOrRazorpayId]
  );

  if (rows.length > 0) {
    const currentStatus = rows[0].status;
    if (!isValidOrderStateTransition(currentStatus, newStatus)) {
      console.warn(
        `[Order State Machine] Invalid transition attempted: ${currentStatus} -> ${newStatus} for order ${orderIdOrRazorpayId}`
      );
      return false;
    }
  }

  await db.query(
    `UPDATE orders
     SET status = $1,
         razorpay_payment_id = COALESCE($2, razorpay_payment_id),
         updated_at = NOW()
     WHERE order_id = $3 OR razorpay_order_id = $3`,
    [newStatus, razorpayPaymentId ?? null, orderIdOrRazorpayId]
  );

  return true;
}

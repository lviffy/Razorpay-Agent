import "dotenv/config";
import { db } from "../src/db/migrate.ts";
import { redis } from "../src/services/redis.ts";
import { acquireLock, releaseLock } from "../src/services/redis.ts";
import { setInventoryState } from "../src/services/merchant.ts";
import { issueTransactionId } from "../src/services/x402.ts";
import { generateOrderId } from "../src/services/razorpay.ts";
import { logEvent, queryAudit } from "../src/services/audit.ts";

async function main() {
  console.log("=================================================");
  console.log("⚠️  AgentBridge — Payment Failure & Recovery Simulation");
  console.log("=================================================\n");

  await db.query("SELECT 1");
  await redis.ping();
  await db.query("UPDATE products SET inventory_state = 'AVAILABLE', inventory_available = 10, inventory_reserved = 0");
  await redis.flushdb();

  // Get store & product
  const { rows: products } = await db.query(
    "SELECT id, store_id, shopify_variant_id, listed_price FROM products LIMIT 1"
  );
  const prod = products[0];

  const waMessageId = `wamid.FAIL_${Date.now()}`;
  const conversationId = `conv_fail_demo`;
  const x402TxId = issueTransactionId();
  const orderId = generateOrderId();
  const mockRzpOrderId = `order_fail_${Date.now()}`;

  console.log(`[Step 1] Reserving inventory for product ${prod.shopify_variant_id}...`);
  await acquireLock(prod.store_id, prod.shopify_variant_id);
  await setInventoryState(prod.id, "PAYMENT_PENDING", { reservedDelta: 1, availableDelta: -1 });

  await db.query(
    `INSERT INTO orders (store_id, razorpay_order_id, order_id, x402_tx_hash, amount, status)
     VALUES ($1, $2, $3, $4, $5, 'CREATED')`,
    [prod.store_id, mockRzpOrderId, orderId, x402TxId, prod.listed_price]
  );

  console.log(`   - Order created: ${orderId}`);
  console.log(`   - Inventory state: PAYMENT_PENDING\n`);

  // Simulate payment.failed
  console.log(`[Step 2] Simulating payment.failed webhook...`);
  const mockPaymentId = `pay_failed_${Date.now()}`;

  await db.query(
    "UPDATE orders SET status = 'FAILED' WHERE razorpay_order_id = $1",
    [mockRzpOrderId]
  );

  // Transition back: PAYMENT_PENDING → AVAILABLE
  await setInventoryState(prod.id, "AVAILABLE", { reservedDelta: -1, availableDelta: 1 });
  await releaseLock(prod.store_id, prod.shopify_variant_id);

  console.log(`   - Postgres inventory state restored: AVAILABLE`);
  console.log(`   - Redis lock released`);

  await logEvent("PAYMENT_FAILED", {
    whatsappMessageId: waMessageId,
    conversationId,
    x402TransactionId: x402TxId,
    razorpayPaymentId: mockPaymentId,
    orderId,
  }, { reason: "BAD_OTP", description: "Payment authentication failed" });

  console.log(`   - PAYMENT_FAILED event logged to audit ledger\n`);

  // Simulate retry
  console.log(`[Step 3] User taps [Retry Payment] on WhatsApp...`);
  const retryOrderId = generateOrderId();
  const newX402TxId = issueTransactionId();
  const retryRzpOrderId = `order_retry_${Date.now()}`;

  await acquireLock(prod.store_id, prod.shopify_variant_id);
  await setInventoryState(prod.id, "PAYMENT_PENDING", { reservedDelta: 1, availableDelta: -1 });

  await db.query(
    `INSERT INTO orders (store_id, razorpay_order_id, order_id, x402_tx_hash, amount, status)
     VALUES ($1, $2, $3, $4, $5, 'CREATED')`,
    [prod.store_id, retryRzpOrderId, retryOrderId, newX402TxId, prod.listed_price]
  );

  console.log(`   - Retry order created: ${retryOrderId}`);

  // Simulate payment.captured on retry
  console.log(`\n[Step 4] Retry payment succeeds (payment.captured)...`);
  const retryPaymentId = `pay_success_${Date.now()}`;

  await db.query(
    "UPDATE orders SET razorpay_payment_id = $1, status = 'CAPTURED' WHERE razorpay_order_id = $2",
    [retryPaymentId, retryRzpOrderId]
  );

  await setInventoryState(prod.id, "PAID", { reservedDelta: -1 });
  await releaseLock(prod.store_id, prod.shopify_variant_id);

  await logEvent("PAYMENT_CAPTURED", {
    whatsappMessageId: waMessageId,
    conversationId,
    x402TransactionId: newX402TxId,
    razorpayPaymentId: retryPaymentId,
    orderId: retryOrderId,
  }, { amount: prod.listed_price, retryOf: orderId });

  // Audit trail verification
  console.log(`\n[Step 5] Audit ledger verification:`);
  const events = await queryAudit({ conversationId });
  for (const ev of events) {
    const eventType = ev.event_type ?? ev.eventType;
    const x402 = ev.x402_transaction_id ?? ev.x402TransactionId;
    const pay = ev.razorpay_payment_id ?? ev.razorpayPaymentId;
    const order = ev.order_id ?? ev.orderId;

    console.log(`   [${eventType}] x402: ${x402} | Pay: ${pay || "N/A"} | Order: ${order || "N/A"}`);
  }

  console.log("\n=================================================");
  console.log("🎉 Failure & Retry Recovery Simulation Passed!");
  console.log("=================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});

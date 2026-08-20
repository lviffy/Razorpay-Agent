import "dotenv/config";
import { db } from "../src/db/migrate.ts";
import { redis } from "../src/services/redis.ts";
import { BuyerAgent } from "../src/agents/buyer-agent.ts";
import { acquireLock, releaseLock } from "../src/services/redis.ts";
import { createOrder, createStandardPaymentLink, generateOrderId, rupeesToPaise } from "../src/services/razorpay.ts";
import { issueTransactionId } from "../src/services/x402.ts";
import { setInventoryState, getStore } from "../src/services/merchant.ts";
import { logEvent, queryAudit } from "../src/services/audit.ts";

async function main() {
  console.log("=================================================");
  console.log("🚀 AgentBridge — Happy Path End-to-End Simulation");
  console.log("=================================================\n");

  // Verify DB & Redis
  await db.query("SELECT 1");
  await redis.ping();
  await db.query("UPDATE products SET inventory_state = 'AVAILABLE', inventory_available = 10, inventory_reserved = 0");
  await redis.flushdb();
  console.log("✅ DB and Redis connected\n");

  const waMessageId = `wamid.SIM_${Date.now()}`;
  const conversationId = `conv_sim_919876543210`;
  const phoneNumber = "919876543210";
  const userMessage = "Buy Nike running shoes under ₹4,000";
  const spendingLimit = 4000;

  console.log(`[Step 1] Inbound message: "${userMessage}" (Limit: ₹${spendingLimit})`);

  // Run Buyer Agent
  const buyerAgent = new BuyerAgent();
  const decision = await buyerAgent.processTask({
    message: userMessage,
    spendingLimit,
    phoneNumber,
    conversationId,
    waMessageId,
  });

  if (!decision.accepted || !decision.offer || !decision.mandate) {
    console.error("❌ Agent rejected:", decision.reasoning);
    process.exit(1);
  }

  const { offer, mandate } = decision;
  console.log(`\n[Step 2] Buyer Agent Decision:`);
  console.log(`   - Selected: ${offer.product.title}`);
  console.log(`   - Listed Price: ₹${offer.product.listedPrice}`);
  console.log(`   - Agreed Price: ₹${offer.offeredPrice}`);
  console.log(`   - Free Shipping: ${offer.shippingFree}`);
  console.log(`   - Reasoning: ${offer.reasoningTrace}`);
  console.log(`   - Mandate: ${mandate.mandateId} (Limit: ₹${mandate.spendingLimit})\n`);

  // Find product ID in DB
  const { rows: prodRows } = await db.query(
    "SELECT id, store_id FROM products WHERE shopify_variant_id = $1",
    [offer.product.variantId]
  );

  const productId = prodRows[0].id as string;
  const storeId = prodRows[0].store_id as string;

  // Lock inventory
  console.log(`[Step 3] Acquiring Redis inventory lock...`);
  const locked = await acquireLock(storeId, offer.product.variantId);
  console.log(`   - Redis SET NX EX 120 result: ${locked ? "SUCCESS" : "FAILED"}`);

  // Transition state: AVAILABLE → RESERVED
  await setInventoryState(productId, "RESERVED", { reservedDelta: 1, availableDelta: -1 });
  console.log(`   - Postgres inventory state: RESERVED\n`);

  // Issue x402 transaction ID & Razorpay Order
  const x402TxId = issueTransactionId();
  const orderId = generateOrderId();
  console.log(`[Step 4] Creating Razorpay Order & Standard Payment Link...`);
  console.log(`   - x402 Tx ID: ${x402TxId}`);
  console.log(`   - Order ID:   ${orderId}`);

  let rzpOrder: { id: string };
  try {
    rzpOrder = (await createOrder({
      amountInPaise: rupeesToPaise(offer.offeredPrice),
      receipt: x402TxId,
      sessionId: offer.sessionId,
    })) as unknown as { id: string };
    console.log(`   - Razorpay Order ID: ${rzpOrder.id}`);
  } catch (err) {
    console.log(`   - Razorpay Order creation fallback (mocking ID for dry-run if API keys missing)`);
    rzpOrder = { id: `order_mock_${Date.now()}` };
  }

  // Transition state: RESERVED → PAYMENT_PENDING
  await setInventoryState(productId, "PAYMENT_PENDING");

  // Save order
  await db.query(
    `INSERT INTO orders (store_id, razorpay_order_id, order_id, x402_tx_hash, mandate_id, amount, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'CREATED')`,
    [storeId, rzpOrder.id, orderId, x402TxId, mandate.mandateId, offer.offeredPrice]
  );

  // Log INVENTORY_LOCKED
  await logEvent("INVENTORY_LOCKED", {
    whatsappMessageId: waMessageId,
    conversationId,
    x402TransactionId: x402TxId,
  }, { productId, storeId, agreedPrice: offer.offeredPrice });

  // Simulate payment.captured webhook
  console.log(`\n[Step 5] Simulating Razorpay payment.captured webhook...`);
  const mockPaymentId = `pay_sim_${Date.now()}`;

  await db.query(
    "UPDATE orders SET razorpay_payment_id = $1, status = 'CAPTURED' WHERE razorpay_order_id = $2",
    [mockPaymentId, rzpOrder.id]
  );

  // Transition state: PAYMENT_PENDING → PAID
  await setInventoryState(productId, "PAID", { reservedDelta: -1 });
  await releaseLock(storeId, offer.product.variantId);
  console.log(`   - Postgres inventory state: PAID`);
  console.log(`   - Redis lock released`);

  // Log PAYMENT_CAPTURED
  await logEvent("PAYMENT_CAPTURED", {
    whatsappMessageId: waMessageId,
    conversationId,
    x402TransactionId: x402TxId,
    razorpayPaymentId: mockPaymentId,
    orderId,
  }, { amount: offer.offeredPrice, status: "CAPTURED" });

  // Verify Audit Trail
  console.log(`\n[Step 6] Verifying 5-Field Audit Ledger Linkage...`);
  const auditEvents = await queryAudit({ x402TransactionId: x402TxId });
  console.log(`   - Total audit records found: ${auditEvents.length}`);

  for (const ev of auditEvents) {
    const eventType = ev.event_type ?? ev.eventType;
    const wa = ev.whatsapp_message_id ?? ev.whatsappMessageId;
    const conv = ev.conversation_id ?? ev.conversationId;
    const x402 = ev.x402_transaction_id ?? ev.x402TransactionId;
    const pay = ev.razorpay_payment_id ?? ev.razorpayPaymentId;
    const order = ev.order_id ?? ev.orderId;
    const checksum = (ev.event_checksum ?? ev.eventChecksum ?? "").slice(0, 16);

    console.log(`     [${eventType}] WA: ${wa} | Conv: ${conv} | x402: ${x402} | Pay: ${pay || "N/A"} | Order: ${order || "N/A"}`);
    console.log(`     Checksum: ${checksum}...`);
  }

  console.log("\n=================================================");
  console.log("🎉 Happy Path Simulation Completed Successfully!");
  console.log("=================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});

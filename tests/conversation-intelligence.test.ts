import { resolveIntent } from "../src/conversation/intent-resolver.ts";
import { executeCommerceAction } from "../src/conversation/commerce-executor.ts";
import { generateCustomerResponse } from "../src/conversation/response-generator.ts";
import type { ConversationContext, ConversationState } from "../src/conversation/types.ts";
import type { Product, Store, NegotiationRules } from "../src/types/index.ts";

const mockStore: Store = {
  id: "309d48dd-3124-42ac-a6ec-9e50828acf82",
  name: "MVPFAST",
  city: "Mumbai",
  razorpayAccountId: "acc_mock_test",
  currency: "INR",
  isActive: true,
};

const mockRules: NegotiationRules = {
  storeId: mockStore.id,
  maxDiscountPercentage: 10,
  minOrderValueForDiscount: 500,
  freeShippingThreshold: 3000,
  allowBundleOffers: true,
};

const mockProducts: Product[] = [
  {
    id: "prod_rohan_shirt",
    storeId: mockStore.id,
    shopifyProductId: "sp_1",
    shopifyVariantId: "var_rohan_001",
    title: "Rohan Shirt",
    sku: "SKU-001",
    listedPrice: 1200,
    floorPrice: 1080,
    inventoryAvailable: 15,
    inventoryReserved: 0,
    inventoryState: "AVAILABLE",
    agentSchema: {
      variantId: "var_rohan_001",
      title: "Rohan Shirt",
      sku: "SKU-001",
      listedPrice: 1200,
      floorPrice: 1080,
      inventoryAvailable: 15,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      attributes: { category: "Apparel", brand: "Rohan" },
    },
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    updatedAt: new Date(),
  },
  {
    id: "prod_nike_pegasus",
    storeId: mockStore.id,
    shopifyProductId: "sp_2",
    shopifyVariantId: "var_nike_pegasus_40",
    title: "Nike Air Zoom Pegasus 40",
    sku: "NK-PEG40-BLK",
    listedPrice: 4999,
    floorPrice: 4499,
    inventoryAvailable: 10,
    inventoryReserved: 0,
    inventoryState: "AVAILABLE",
    agentSchema: {
      variantId: "var_nike_pegasus_40",
      title: "Nike Air Zoom Pegasus 40",
      sku: "NK-PEG40-BLK",
      listedPrice: 4999,
      floorPrice: 4499,
      inventoryAvailable: 10,
      imageUrl: "https://images.unsplash.com/photo-nike.jpg",
      attributes: { category: "Running Shoes", brand: "Nike" },
    },
    imageUrl: "https://images.unsplash.com/photo-nike.jpg",
    updatedAt: new Date(),
  },
  {
    id: "b1ad2e4b-79f4-41cf-a65a-8684d60e798c",
    storeId: mockStore.id,
    shopifyProductId: "sp_3",
    shopifyVariantId: "var_shayanna_002",
    title: "Shayanna",
    sku: "SKU-002",
    listedPrice: 23000,
    floorPrice: 22000,
    inventoryAvailable: 7,
    inventoryReserved: 0,
    inventoryState: "AVAILABLE",
    agentSchema: {
      variantId: "var_shayanna_002",
      title: "Shayanna",
      sku: "SKU-002",
      listedPrice: 23000,
      floorPrice: 22000,
      inventoryAvailable: 7,
      imageUrl: "https://images.unsplash.com/photo-shayanna.jpg",
      attributes: { category: "Luxury", brand: "Shayanna" },
    },
    imageUrl: "https://images.unsplash.com/photo-shayanna.jpg",
    updatedAt: new Date(),
  },
];

function createMockContext(stateOverrides?: Partial<ConversationState>): ConversationContext {
  const baseState: ConversationState = {
    conversationId: "conv_917077013159",
    phoneNumber: "917077013159",
    customerName: "Aarav Patel",
    sessionState: "IDLE",
    transcript: [],
    productsDiscussed: [],
    ...stateOverrides,
  };

  return {
    conversationId: baseState.conversationId,
    phoneNumber: baseState.phoneNumber,
    state: baseState,
    availableProducts: mockProducts,
    store: mockStore,
    rules: mockRules,
  };
}

async function runTestSuite() {
  console.log("🧪 ================= STARTING CONVERSATIONAL INTELLIGENCE TEST SUITE =================\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
    }
  }

  // ── SCENARIO 1: Fresh Greeting ("hi") with stale previous conversation ─────────
  console.log("▶️ Scenario 1: Clean Greeting ('hi') without dragging stale product");
  const ctx1 = createMockContext({
    activeProduct: {
      id: "prod_rohan_shirt",
      title: "rohan",
      listedPrice: 1200,
      floorPrice: 1080,
      variantId: "var_rohan_001",
    },
    transcript: [
      { id: "1", sender: "customer", content: "hi", timestamp: "08:58 PM" },
    ],
  });

  const intent1 = await resolveIntent("hi", ctx1);
  assert(
    intent1.intent === "SMALL_TALK",
    "'hi' is classified as clean SMALL_TALK",
    `Intent: ${intent1.intent}`
  );

  const comm1 = await executeCommerceAction(intent1, ctx1, "hi");
  const resp1 = await generateCustomerResponse("hi", intent1, comm1, ctx1);
  assert(
    !resp1.text.toLowerCase().includes("couldn't find an exact match for") &&
    !resp1.text.toLowerCase().includes("rohan"),
    "Greeting does not mention missing products or stale 'rohan' context",
    resp1.text
  );

  // ── SCENARIO 2: Catalog Listing ───────────────────────────────────────────────
  console.log("\n▶️ Scenario 2: Catalog Listing ('yes' after catalog offer)");
  const ctx2 = createMockContext({
    awaitingConfirmation: "CATALOG",
  });

  const intent2 = await resolveIntent("yes", ctx2);
  assert(
    intent2.intent === "CATALOG_BROWSE",
    "'yes' following catalog question resolves to CATALOG_BROWSE",
    `Intent: ${intent2.intent}`
  );

  const comm2 = await executeCommerceAction(intent2, ctx2, "yes");
  const resp2 = await generateCustomerResponse("yes", intent2, comm2, ctx2);
  assert(
    resp2.text.includes("Rohan Shirt") && resp2.text.includes("₹1,200"),
    "Catalog response formats real products and prices from database",
    resp2.text
  );

  // ── SCENARIO 3: Discount Request ("any discounts?") ───────────────────────────
  console.log("\n▶️ Scenario 3: Initial Discount Request ('any discounts?')");
  const ctx3 = createMockContext({
    activeProduct: {
      id: "prod_rohan_shirt",
      title: "Rohan Shirt",
      listedPrice: 1200,
      floorPrice: 1080,
      variantId: "var_rohan_001",
      imageUrl: mockProducts[0].imageUrl,
    },
    sessionState: "NEGOTIATING",
  });

  const intent3 = await resolveIntent("any discounts?", ctx3);
  assert(
    intent3.intent === "PRICE_NEGOTIATION",
    "'any discounts?' resolved to PRICE_NEGOTIATION",
    `Intent: ${intent3.intent}`
  );

  const comm3 = await executeCommerceAction(intent3, ctx3, "any discounts?");
  assert(
    comm3.type === "COUNTER_OFFER" && comm3.offer?.offeredPrice === 1080,
    "Offers 10% discount to ₹1080 within margin rules",
    `Offered: ${comm3.offer?.offeredPrice}`
  );

  const resp3 = await generateCustomerResponse("any discounts?", intent3, comm3, ctx3);
  assert(
    resp3.text.includes("1080") || resp3.text.includes("1,080"),
    "Response communicates ₹1080 discount clearly",
    resp3.text
  );

  // ── SCENARIO 4: Monotonic Floor Price ("anything less") ───────────────────────
  console.log("\n▶️ Scenario 4: Countering at Floor Price ('anything less')");
  const ctx4 = createMockContext({
    activeProduct: {
      id: "prod_rohan_shirt",
      title: "Rohan Shirt",
      listedPrice: 1200,
      floorPrice: 1080,
      offeredPrice: 1080,
      variantId: "var_rohan_001",
    },
    currentOffer: {
      productTitle: "Rohan Shirt",
      variantId: "var_rohan_001",
      offeredPrice: 1080,
      listedPrice: 1200,
      shippingFree: false,
      status: "COUNTER",
    },
    sessionState: "NEGOTIATING",
  });

  const intent4 = await resolveIntent("anything less", ctx4);
  const comm4 = await executeCommerceAction(intent4, ctx4, "anything less");
  assert(
    comm4.type === "COUNTER_OFFER" && comm4.offer?.offeredPrice === 1080,
    "Price does NOT jump back to ₹1200; stays firm at floor ₹1080",
    `Offered: ${comm4.offer?.offeredPrice}`
  );

  const resp4 = await generateCustomerResponse("anything less", intent4, comm4, ctx4);
  assert(
    !resp4.text.includes("1200 is our best") && !resp4.text.includes("1,200 is our best"),
    "Does not claim ₹1200 is best price after already offering ₹1080",
    resp4.text
  );

  // ── SCENARIO 5: Photo Delivery & Product Switching ("shw me rohan") ─────────
  console.log("\n▶️ Scenario 5: Direct Photo Delivery with Product Switching ('shw me rohan' after Shayanna ₹23,000)");
  const ctx5 = createMockContext({
    activeProduct: {
      id: "b1ad2e4b-79f4-41cf-a65a-8684d60e798c",
      title: "Shayanna",
      listedPrice: 23000,
      floorPrice: 22000,
      offeredPrice: 23000,
      variantId: "var_shayanna_002",
    },
  });

  const intent5 = await resolveIntent("shw me rohan", ctx5);
  assert(
    intent5.isPhotoRequest === true,
    "Recognized photo request",
    `isPhotoRequest: ${intent5.isPhotoRequest}`
  );

  const comm5 = await executeCommerceAction(intent5, ctx5, "shw me rohan");
  assert(
    comm5.type === "PHOTO_FOUND" && Boolean(comm5.mediaUrlToSend?.startsWith("http")),
    "Found product image URL for delivery",
    comm5.mediaUrlToSend
  );
  assert(
    Boolean(
      comm5.product?.title.toLowerCase().includes("rohan") &&
      comm5.mediaCaption?.includes("1,200") &&
      !comm5.mediaCaption?.includes("23,000")
    ),
    "Photo caption shows correct price for Rohan (₹1,200) and not stale Shayanna price (₹23,000)",
    comm5.mediaCaption
  );

  const resp5 = await generateCustomerResponse("shw me rohan", intent5, comm5, ctx5);
  assert(
    !resp5.text.toLowerCase().includes("would you like me to send you its picture") &&
    Boolean(resp5.mediaUrl),
    "Delivers photo directly without asking permission to send what was requested",
    resp5.text
  );

  // ── SCENARIO 6: Store Query ('what do u sell at MVPFAST?') ─────────────────
  console.log("\n▶️ Scenario 6: Store Inventory Query ('what do u sell at MVPFAST?')");
  const ctx6 = createMockContext();
  const intent6 = await resolveIntent("what do u sell at MVPFAST?", ctx6);
  assert(
    intent6.intent === "CATALOG_BROWSE",
    "'what do u sell at MVPFAST?' resolves to CATALOG_BROWSE",
    `Intent: ${intent6.intent}`
  );

  const comm6 = await executeCommerceAction(intent6, ctx6, "what do u sell at MVPFAST?");
  const resp6 = await generateCustomerResponse("what do u sell at MVPFAST?", intent6, comm6, ctx6);
  assert(
    !resp6.text.toLowerCase().includes("milk") &&
    !resp6.text.toLowerCase().includes("grocery") &&
    !resp6.text.toLowerCase().includes("veggies") &&
    resp6.text.includes("Rohan Shirt"),
    "Does not hallucinate grocery/milk and shows real items like Rohan Shirt",
    resp6.text
  );

  // ── SCENARIO 7: Direct Single-Word Product Query ('rohan') ──────────────────
  console.log("\n▶️ Scenario 7: Direct Single-Word Product Query ('rohan')");
  const ctx7 = createMockContext();
  const intent7 = await resolveIntent("rohan", ctx7);
  assert(
    intent7.intent === "PRODUCT_SEARCH" && Boolean(intent7.referencedProductTitle?.toLowerCase().includes("rohan")),
    "'rohan' resolves directly to product search for Rohan Shirt",
    `Intent: ${intent7.intent}, Referenced: ${intent7.referencedProductTitle}`
  );

  const comm7 = await executeCommerceAction(intent7, ctx7, "rohan");
  const resp7 = await generateCustomerResponse("rohan", intent7, comm7, ctx7);
  assert(
    !resp7.text.toLowerCase().includes("what type of product are you looking for") &&
    resp7.text.includes("1200") || resp7.text.includes("1,200") || resp7.text.includes("Rohan"),
    "Responds with Rohan product details instead of generic clarification",
    resp7.text
  );

  // ── SCENARIO 8: Quantity & Live Stock Query ('how many qty are available') ──
  console.log("\n▶️ Scenario 8: Quantity & Live Stock Query ('yes i want to order rohann how many qty are available')");
  const ctx8 = createMockContext({
    activeProduct: {
      id: "prod_rohan_shirt",
      title: "rohann",
      listedPrice: 1200,
      floorPrice: 1100,
      offeredPrice: 1200,
      inventoryAvailable: 1,
      variantId: "var_rohan_001",
    },
  });

  const intent8 = await resolveIntent("yes i want to order rohann how many qty are available", ctx8);
  const comm8 = await executeCommerceAction(intent8, ctx8, "yes i want to order rohann how many qty are available");
  const resp8 = await generateCustomerResponse("yes i want to order rohann how many qty are available", intent8, comm8, ctx8);

  assert(
    !resp8.text.toLowerCase().includes("plenty") &&
    (resp8.text.includes("1 unit") || resp8.text.includes("1 item") || resp8.text.includes("1 available") || resp8.text.includes("1 in stock") || resp8.text.includes("1")),
    "States exact stock of 1 unit and does NOT claim 'plenty in stock'",
    resp8.text
  );

  // ── SCENARIO 9: Multi-Quantity Checkout ('i want 2') ───────────────────────
  console.log("\n▶️ Scenario 9: Multi-Quantity Purchase Command ('i want 2' on ₹23,000 item)");
  const ctx9 = createMockContext({
    activeProduct: {
      id: "b1ad2e4b-79f4-41cf-a65a-8684d60e798c",
      title: "Shayanna",
      listedPrice: 23000,
      floorPrice: 22000,
      offeredPrice: 23000,
      inventoryAvailable: 7,
      variantId: "var_shayanna_002",
    },
    sessionState: "NEGOTIATING",
  });

  const intent9 = await resolveIntent("i want 2", ctx9);
  assert(
    intent9.intent === "ACCEPT_OFFER" && intent9.requestedQuantity === 2,
    "'i want 2' resolves to ACCEPT_OFFER with requestedQuantity = 2",
    `Intent: ${intent9.intent}, Quantity: ${intent9.requestedQuantity}`
  );

  const comm9 = await executeCommerceAction(intent9, ctx9, "i want 2");
  assert(
    comm9.type === "PAYMENT_LINK_CREATED" && comm9.paymentAmount === 46000 && comm9.quantity === 2,
    "Generates payment link for 2 units (2 x ₹23,000 = ₹46,000)",
    `Amount: ${comm9.paymentAmount}, Quantity: ${comm9.quantity}`
  );

  const resp9 = await generateCustomerResponse("i want 2", intent9, comm9, ctx9);
  assert(
    resp9.text.includes("46,000") || resp9.text.includes("46000"),
    "Response explicitly states total price of ₹46,000 for 2 units",
    resp9.text
  );

  console.log(`\n🏁 ================= TEST RESULTS: ${passed}/${total} PASSED =================\n`);
  if (passed === total) {
    console.log("🎉 ALL REAL-WORLD CONVERSATIONAL SCENARIOS PASSED!");
  } else {
    process.exit(1);
  }
}

runTestSuite();

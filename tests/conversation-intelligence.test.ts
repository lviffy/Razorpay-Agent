import { describe, test, expect } from "bun:test";
import { resolveIntent } from "../apps/api/src/modules/agent/intent-resolver.ts";
import { executeCommerceAction } from "../apps/api/src/modules/agent/commerce-executor.ts";
import { generateCustomerResponse } from "../apps/api/src/modules/agent/response-generator.ts";
import type { ConversationContext, ConversationState } from "../apps/api/src/modules/agent/types.ts";
import type { Product, Store, NegotiationRules } from "@zapai/types";

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

describe("Conversational Intelligence Test Suite", () => {
  test("Scenario 1: Clean Greeting ('hi') without dragging stale product", async () => {
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
    expect(intent1.intent).toBe("SMALL_TALK");

    const comm1 = await executeCommerceAction(intent1, ctx1, "hi");
    const resp1 = await generateCustomerResponse("hi", intent1, comm1, ctx1);
    expect(resp1.text.toLowerCase()).not.toContain("couldn't find an exact match for");
    expect(resp1.text.toLowerCase()).not.toContain("rohan");
  }, 45000);

  test("Scenario 2: Catalog Listing ('yes' after catalog offer)", async () => {
    const ctx2 = createMockContext({
      awaitingConfirmation: "CATALOG",
    });

    const intent2 = await resolveIntent("yes", ctx2);
    expect(intent2.intent).toBe("CATALOG_BROWSE");

    const comm2 = await executeCommerceAction(intent2, ctx2, "yes");
    const resp2 = await generateCustomerResponse("yes", intent2, comm2, ctx2);
    expect(resp2.text).toContain("Rohan Shirt");
    expect(resp2.text).toContain("₹1,200");
  }, 45000);

  test("Scenario 3: Initial Discount Request ('any discounts?')", async () => {
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
    expect(intent3.intent).toBe("PRICE_NEGOTIATION");

    const comm3 = await executeCommerceAction(intent3, ctx3, "any discounts?");
    expect(comm3.type).toBe("COUNTER_OFFER");
    expect(comm3.offer?.offeredPrice).toBe(1080);

    const resp3 = await generateCustomerResponse("any discounts?", intent3, comm3, ctx3);
    const hasDiscount = resp3.text.includes("1080") || resp3.text.includes("1,080");
    expect(hasDiscount).toBe(true);
  }, 45000);

  test("Scenario 4: Countering at Floor Price ('anything less')", async () => {
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
    expect(comm4.type).toBe("COUNTER_OFFER");
    expect(comm4.offer?.offeredPrice).toBe(1080);

    const resp4 = await generateCustomerResponse("anything less", intent4, comm4, ctx4);
    expect(resp4.text).not.toContain("1200 is our best");
    expect(resp4.text).not.toContain("1,200 is our best");
  }, 45000);

  test("Scenario 5: Direct Photo Delivery with Product Switching ('shw me rohan')", async () => {
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
    expect(intent5.isPhotoRequest).toBe(true);

    const comm5 = await executeCommerceAction(intent5, ctx5, "shw me rohan");
    expect(comm5.type).toBe("PHOTO_FOUND");
    expect(comm5.mediaUrlToSend?.startsWith("http")).toBe(true);
    expect(comm5.product?.title.toLowerCase()).toContain("rohan");
    expect(comm5.mediaCaption).toContain("1,200");
    expect(comm5.mediaCaption).not.toContain("23,000");

    const resp5 = await generateCustomerResponse("shw me rohan", intent5, comm5, ctx5);
    expect(resp5.text.toLowerCase()).not.toContain("would you like me to send you its picture");
    expect(Boolean(resp5.mediaUrl)).toBe(true);
  }, 45000);

  test("Scenario 6: Store Inventory Query ('what do u sell at MVPFAST?')", async () => {
    const ctx6 = createMockContext();
    const intent6 = await resolveIntent("what do u sell at MVPFAST?", ctx6);
    expect(intent6.intent).toBe("CATALOG_BROWSE");

    const comm6 = await executeCommerceAction(intent6, ctx6, "what do u sell at MVPFAST?");
    const resp6 = await generateCustomerResponse("what do u sell at MVPFAST?", intent6, comm6, ctx6);
    expect(resp6.text.toLowerCase()).not.toContain("milk");
    expect(resp6.text.toLowerCase()).not.toContain("grocery");
    expect(resp6.text).toContain("Rohan Shirt");
  }, 45000);

  test("Scenario 7: Direct Single-Word Product Query ('rohan')", async () => {
    const ctx7 = createMockContext();
    const intent7 = await resolveIntent("rohan", ctx7);
    expect(intent7.intent).toBe("PRODUCT_SEARCH");
    expect(intent7.referencedProductTitle?.toLowerCase()).toContain("rohan");

    const comm7 = await executeCommerceAction(intent7, ctx7, "rohan");
    const resp7 = await generateCustomerResponse("rohan", intent7, comm7, ctx7);
    const lowerResp = resp7.text.toLowerCase();
    const mentionsRohan = lowerResp.includes("1200") || lowerResp.includes("1,200") || lowerResp.includes("rohan");
    expect(mentionsRohan).toBe(true);
  }, 45000);

  test("Scenario 8: Quantity & Live Stock Query ('how many qty are available')", async () => {
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

    expect(resp8.text.toLowerCase()).not.toContain("plenty");
    const mentionsOne = resp8.text.includes("1 unit") || resp8.text.includes("1 item") || resp8.text.includes("1 available") || resp8.text.includes("1 in stock") || resp8.text.includes("1");
    expect(mentionsOne).toBe(true);
  }, 45000);

  test("Scenario 9: Multi-Quantity Purchase Command ('i want 2' on ₹23,000 item)", async () => {
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
    expect(intent9.intent).toBe("ACCEPT_OFFER");
    expect(intent9.requestedQuantity).toBe(2);

    const comm9 = await executeCommerceAction(intent9, ctx9, "i want 2");
    expect(comm9.type).toBe("PAYMENT_LINK_CREATED");
    expect(comm9.paymentAmount).toBe(46000);
    expect(comm9.quantity).toBe(2);

    const resp9 = await generateCustomerResponse("i want 2", intent9, comm9, ctx9);
    const hasTotal = resp9.text.includes("46,000") || resp9.text.includes("46000");
    expect(hasTotal).toBe(true);
  }, 45000);

  test("Scenario 10: Multi-Turn Focus Retention on Discount ('i would like some discount')", async () => {
    const ctx10 = createMockContext({
      activeProduct: {
        id: "prod_rohan_shirt",
        title: "Rohan Shirt",
        listedPrice: 1200,
        floorPrice: 1080,
        offeredPrice: 1200,
        inventoryAvailable: 10,
        variantId: "var_rohan_001",
      },
      sessionState: "IDLE",
    });

    const intent10 = await resolveIntent("i would like some discount", ctx10);
    expect(intent10.intent).toBe("PRICE_NEGOTIATION");

    const comm10 = await executeCommerceAction(intent10, ctx10, "i would like some discount");
    expect(comm10.type).toBe("COUNTER_OFFER");
    expect(comm10.product?.title.toLowerCase()).toContain("rohan");
    expect(comm10.product?.offeredPrice).toBe(1080);

    const resp10 = await generateCustomerResponse("i would like some discount", intent10, comm10, ctx10);
    const mentionsDiscount = resp10.text.includes("1080") || resp10.text.includes("1,080") || resp10.text.includes("1100");
    expect(mentionsDiscount).toBe(true);
  }, 45000);

  test("Scenario 11: Multi-Turn Quantity Follow-Up ('I will get 2 rohann' -> 'yes')", async () => {
    const ctx11A = createMockContext({
      activeProduct: {
        id: "prod_rohan_shirt",
        title: "rohann",
        listedPrice: 1200,
        floorPrice: 1100,
        offeredPrice: 1100,
        inventoryAvailable: 10,
        variantId: "var_rohan_001",
      },
      currentOffer: {
        productTitle: "rohann",
        variantId: "var_rohan_001",
        offeredPrice: 1100,
        listedPrice: 1200,
        shippingFree: false,
        status: "COUNTER",
      },
      sessionState: "NEGOTIATING",
    });

    const intent11A = await resolveIntent("I will get 2 rohann", ctx11A);
    expect(intent11A.intent).toBe("ACCEPT_OFFER");
    expect(intent11A.requestedQuantity).toBe(2);

    const ctx11B = createMockContext({
      activeProduct: {
        id: "prod_rohan_shirt",
        title: "rohann",
        listedPrice: 1200,
        floorPrice: 1100,
        offeredPrice: 1100,
        inventoryAvailable: 10,
        variantId: "var_rohan_001",
      },
      currentOffer: {
        productTitle: "rohann",
        variantId: "var_rohan_001",
        offeredPrice: 1100,
        listedPrice: 1200,
        shippingFree: false,
        status: "COUNTER",
      },
      requestedQuantity: 2,
      sessionState: "NEGOTIATING",
    });

    const intent11B = await resolveIntent("yes", ctx11B);
    expect(intent11B.intent).toBe("ACCEPT_OFFER");
    expect(intent11B.requestedQuantity).toBe(2);

    const comm11B = await executeCommerceAction(intent11B, ctx11B, "yes");
    expect(comm11B.type).toBe("PAYMENT_LINK_CREATED");
    expect(comm11B.quantity).toBe(2);
    expect(comm11B.paymentAmount).toBe(2200);

    const resp11B = await generateCustomerResponse("yes", intent11B, comm11B, ctx11B);
    const mentionsTotal = resp11B.text.includes("2,200") || resp11B.text.includes("2200");
    expect(mentionsTotal).toBe(true);
  }, 45000);
});

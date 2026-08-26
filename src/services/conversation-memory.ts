import { db } from "../db/migrate.ts";

export interface ChatMessage {
  id: string;
  sender: "customer" | "seller_agent";
  content: string;
  timestamp: string;
  mediaUrl?: string;
}

export interface ConversationState {
  conversationId: string;
  phoneNumber: string;
  customerName?: string;
  sessionState: "IDLE" | "NEGOTIATING" | "AWAITING_PAYMENT" | "COMPLETE";
  activeProduct?: {
    id?: string;
    title: string;
    listedPrice: number;
    floorPrice?: number;
    offeredPrice?: number;
    inventoryAvailable?: number;
    imageUrl?: string;
    sku?: string;
    variantId?: string;
  };
  currentOffer?: {
    productTitle: string;
    variantId: string;
    offeredPrice: number;
    listedPrice: number;
    shippingFree: boolean;
    status: "PROPOSED" | "ACCEPTED" | "COUNTER" | "REJECTED";
  };
  buyerBudget?: number;
  requestedQuantity?: number;
  lastIntent?: string;
  awaitingConfirmation?: "PAYMENT_LINK" | "CATALOG" | "UPSELL" | "PRICE_ACCEPTANCE" | null;
  activeCategory?: string;
  transcript: ChatMessage[];
  productsDiscussed: string[];
}

export async function loadConversation(
  conversationId: string,
  phoneNumber: string
): Promise<ConversationState> {
  const { rows } = await db.query(
    `SELECT * FROM conversations WHERE conversation_id = $1 OR phone_number = $2 LIMIT 1`,
    [conversationId, phoneNumber]
  );

  if (!rows[0]) {
    return {
      conversationId,
      phoneNumber,
      sessionState: "IDLE",
      transcript: [],
      productsDiscussed: [],
    };
  }

  const r = rows[0];
  const ctx = typeof r.context === "string" ? JSON.parse(r.context) : r.context || {};
  const transcript: ChatMessage[] = Array.isArray(ctx.transcript) ? ctx.transcript : [];
  const productsDiscussed: string[] = Array.isArray(r.products_discussed)
    ? r.products_discussed
    : typeof r.products_discussed === "string"
    ? JSON.parse(r.products_discussed)
    : [];

  return {
    conversationId: r.conversation_id || conversationId,
    phoneNumber: r.phone_number || phoneNumber,
    customerName: r.customer_name,
    sessionState: r.session_state || "IDLE",
    activeProduct: ctx.activeProduct,
    currentOffer: ctx.currentOffer,
    buyerBudget: ctx.buyerBudget,
    requestedQuantity: typeof ctx.requestedQuantity === "number" ? ctx.requestedQuantity : undefined,
    lastIntent: ctx.lastIntent,
    awaitingConfirmation: ctx.awaitingConfirmation,
    activeCategory: ctx.activeCategory,
    transcript,
    productsDiscussed,
  };
}

export async function appendMessage(
  conversationId: string,
  phoneNumber: string,
  sender: "customer" | "seller_agent",
  content: string,
  meta?: {
    mediaUrl?: string;
    activeProduct?: any;
    currentOffer?: any;
    buyerBudget?: number;
    requestedQuantity?: number;
    lastIntent?: string;
    awaitingConfirmation?: "PAYMENT_LINK" | "CATALOG" | "UPSELL" | "PRICE_ACCEPTANCE" | null;
    activeCategory?: string;
    sessionState?: string;
  }
): Promise<void> {
  const msgObj: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...(meta?.mediaUrl ? { mediaUrl: meta.mediaUrl } : {}),
  };

  try {
    const existing = await loadConversation(conversationId, phoneNumber);
    const updatedTranscript = [...existing.transcript, msgObj].slice(-20); // keep last 20 messages

    let updatedProducts = [...existing.productsDiscussed];
    if (meta?.activeProduct?.title && !updatedProducts.includes(meta.activeProduct.title)) {
      updatedProducts.push(meta.activeProduct.title);
    }

    const updatedContext = {
      transcript: updatedTranscript,
      activeProduct: meta?.activeProduct !== undefined ? meta.activeProduct : existing.activeProduct,
      currentOffer: meta?.currentOffer !== undefined ? meta.currentOffer : existing.currentOffer,
      buyerBudget: meta?.buyerBudget !== undefined ? meta.buyerBudget : existing.buyerBudget,
      requestedQuantity: meta?.requestedQuantity !== undefined ? meta.requestedQuantity : existing.requestedQuantity,
      lastIntent: meta?.lastIntent !== undefined ? meta.lastIntent : existing.lastIntent,
      awaitingConfirmation: meta?.awaitingConfirmation !== undefined ? meta.awaitingConfirmation : existing.awaitingConfirmation,
      activeCategory: meta?.activeCategory !== undefined ? meta.activeCategory : existing.activeCategory,
      lastUpdated: new Date().toISOString(),
    };

    const sessionState = meta?.sessionState || existing.sessionState;

    await db.query(
      `INSERT INTO conversations (
        conversation_id, phone_number, last_message_id, session_state,
        products_discussed, context, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (conversation_id)
      DO UPDATE SET
        last_message_id = $3,
        session_state = $4,
        products_discussed = $5,
        context = $6,
        updated_at = NOW()`,
      [
        conversationId,
        phoneNumber,
        msgObj.id,
        sessionState,
        JSON.stringify(updatedProducts),
        JSON.stringify(updatedContext),
      ]
    );
  } catch (err) {
    console.error("⚠️ Failed to append conversation message:", err);
  }
}

export async function updateConversationContext(
  conversationId: string,
  phoneNumber: string,
  patch: {
    activeProduct?: any;
    currentOffer?: any;
    buyerBudget?: number;
    requestedQuantity?: number;
    lastIntent?: string;
    awaitingConfirmation?: "PAYMENT_LINK" | "CATALOG" | "UPSELL" | "PRICE_ACCEPTANCE" | null;
    activeCategory?: string;
    sessionState?: "IDLE" | "NEGOTIATING" | "AWAITING_PAYMENT" | "COMPLETE";
    dealAmount?: number;
  }
): Promise<void> {
  try {
    const existing = await loadConversation(conversationId, phoneNumber);
    const updatedContext = {
      transcript: existing.transcript,
      activeProduct: patch.activeProduct !== undefined ? patch.activeProduct : existing.activeProduct,
      currentOffer: patch.currentOffer !== undefined ? patch.currentOffer : existing.currentOffer,
      buyerBudget: patch.buyerBudget !== undefined ? patch.buyerBudget : existing.buyerBudget,
      requestedQuantity: patch.requestedQuantity !== undefined ? patch.requestedQuantity : existing.requestedQuantity,
      lastIntent: patch.lastIntent !== undefined ? patch.lastIntent : existing.lastIntent,
      awaitingConfirmation: patch.awaitingConfirmation !== undefined ? patch.awaitingConfirmation : existing.awaitingConfirmation,
      activeCategory: patch.activeCategory !== undefined ? patch.activeCategory : existing.activeCategory,
      lastUpdated: new Date().toISOString(),
    };

    const sessionState = patch.sessionState || existing.sessionState;

    await db.query(
      `INSERT INTO conversations (
        conversation_id, phone_number, session_state, deal_amount, context, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (conversation_id)
      DO UPDATE SET
        session_state = COALESCE($3, conversations.session_state),
        deal_amount = COALESCE($4, conversations.deal_amount),
        context = $5,
        updated_at = NOW()`,
      [
        conversationId,
        phoneNumber,
        sessionState,
        patch.dealAmount || null,
        JSON.stringify(updatedContext),
      ]
    );
  } catch (err) {
    console.error("⚠️ Failed to update conversation context:", err);
  }
}

import type { ConversationState } from "../services/conversation-memory.ts";
export type { ConversationState };
import type { Product, Store, NegotiationRules, SellerOffer, Mandate } from "../types/index.ts";

export type ConversationIntentType =
  | "PRODUCT_SEARCH"       // Customer looking for specific item / brand / style
  | "CATALOG_BROWSE"       // Asking to view catalog / featured products / "what do you have?"
  | "PRODUCT_QUESTION"     // Question about stock, color, specs, photo, etc.
  | "PRICE_NEGOTIATION"    // Asking for lower price / counter / "any discounts?" / "anything less" / "can you do 3500?"
  | "ACCEPT_OFFER"         // Agreeing to price / "yes" / "ok" / "deal" / "send link" / "buy"
  | "REJECT_OFFER"         // Declining / "too expensive" / "no thanks"
  | "PURCHASE_INTENT"      // Direct purchase command / "buy it"
  | "PAYMENT_REQUEST"      // Requesting payment checkout link directly
  | "PAYMENT_RETRY"        // Retrying a failed payment
  | "CANCELLATION"         // Cancel ongoing flow
  | "PRODUCT_SWITCH"       // Switching focus e.g. "what about adidas?" or "show me socks"
  | "FOLLOW_UP"            // "how much was that again?" / "what colors?"
  | "SMALL_TALK"           // "hi", "hello", "hey", "how are you"
  | "AMBIGUOUS";           // "something good", "for college" - needs clarification

export interface ConversationIntent {
  intent: ConversationIntentType;
  referencedProductTitle?: string;
  referencedVariantId?: string;
  requestedPrice?: number;
  extractedBudget?: number;
  category?: string;
  brand?: string;
  confidence: number;
  isAffirmative?: boolean;
  isNegative?: boolean;
  isPhotoRequest?: boolean;
  rawReasoning?: string;
}

export interface ConversationContext {
  conversationId: string;
  phoneNumber: string;
  state: ConversationState;
  availableProducts: Product[];
  store: Store;
  rules: NegotiationRules;
}

export type CommerceResultType =
  | "GREETING"
  | "CATALOG_LIST"
  | "OFFER_PROPOSED"
  | "OFFER_ACCEPTED"
  | "COUNTER_OFFER"
  | "NO_MATCH"
  | "OFFER_ABOVE_BUDGET"
  | "INVENTORY_LOCKED"
  | "PAYMENT_LINK_CREATED"
  | "INVENTORY_UNAVAILABLE"
  | "PAYMENT_RETRY_READY"
  | "ORDER_CANCELLED"
  | "PHOTO_FOUND"
  | "INFO_ONLY"
  | "CLARIFICATION_NEEDED";

export interface CommerceResult {
  type: CommerceResultType;
  product?: {
    id: string;
    title: string;
    variantId: string;
    listedPrice: number;
    floorPrice: number;
    offeredPrice: number;
    imageUrl?: string;
    sku?: string;
  };
  offer?: SellerOffer;
  mandate?: Mandate;
  paymentUrl?: string;
  paymentAmount?: number;
  orderRef?: string;
  razorpayOrderId?: string;
  clarificationPrompt?: string;
  infoDetails?: string;
  catalogItems?: Array<{ title: string; price: number; sku?: string; inStock: boolean }>;
  mediaUrlToSend?: string;
  mediaCaption?: string;
  errorMessage?: string;
}

export interface GeneratedCustomerResponse {
  text: string;
  mediaUrl?: string;
  mediaCaption?: string;
  isPaymentLink?: boolean;
  paymentAmount?: number;
  paymentUrl?: string;
}

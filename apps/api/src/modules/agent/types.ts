import type { ConversationState } from "../../services/conversation-memory.ts";
export type { ConversationState };
import type { Product, Store, NegotiationRules, SellerOffer, Mandate } from "@zapai/types";

export type ConversationIntentType =
  | "PRODUCT_SEARCH"
  | "CATALOG_BROWSE"
  | "PRODUCT_QUESTION"
  | "PRICE_NEGOTIATION"
  | "ACCEPT_OFFER"
  | "REJECT_OFFER"
  | "PURCHASE_INTENT"
  | "PAYMENT_REQUEST"
  | "PAYMENT_RETRY"
  | "CANCELLATION"
  | "PRODUCT_SWITCH"
  | "FOLLOW_UP"
  | "SMALL_TALK"
  | "AMBIGUOUS";

export interface ConversationIntent {
  intent: ConversationIntentType;
  referencedProductTitle?: string;
  referencedVariantId?: string;
  requestedPrice?: number;
  requestedQuantity?: number;
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
  product?: {
    id: string;
    title: string;
    variantId: string;
    listedPrice: number;
    floorPrice: number;
    offeredPrice: number;
    inventoryAvailable?: number;
    imageUrl?: string;
    sku?: string;
  };
  quantity?: number;
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
  mediaList?: Array<{ mediaUrl: string; caption: string }>;
  invoiceUrl?: string;
  invoiceNumber?: string;
  qrImageUrl?: string;
  upiDeepLink?: string;
  offerApplied?: {
    name: string;
    code?: string;
    discountAmount: number;
    summary: string;
  };
  errorMessage?: string;
  type: CommerceResultType;
}

export interface GeneratedCustomerResponse {
  text: string;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaList?: Array<{ mediaUrl: string; caption: string }>;
  isPaymentLink?: boolean;
  paymentAmount?: number;
  paymentUrl?: string;
  quantity?: number;
  invoiceUrl?: string;
  invoiceNumber?: string;
  qrImageUrl?: string;
  upiDeepLink?: string;
  offerSummary?: string;
}

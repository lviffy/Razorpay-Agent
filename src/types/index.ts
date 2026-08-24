// ─────────────────────────────────────────────────────────────────────────────
// ZapAI — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Inventory ────────────────────────────────────────────────────────────────

export type InventoryState =
  | "AVAILABLE"
  | "RESERVED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "SOLD";

export interface Product {
  id: string;
  storeId: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  sku: string;
  listedPrice: number;
  floorPrice: number;
  inventoryAvailable: number;
  inventoryReserved: number;
  reservationExpiresAt?: Date;
  inventoryState: InventoryState;
  agentSchema: AgentProductSchema;
  updatedAt: Date;
}

export interface AgentProductSchema {
  variantId: string;
  title: string;
  sku: string;
  listedPrice: number;
  floorPrice: number;
  inventoryAvailable: number;
  attributes: Record<string, string>;
}

// ── Stores ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  city: string;
  razorpayAccountId: string;
  currency: string;
  isActive: boolean;
}

export interface NegotiationRules {
  storeId: string;
  maxDiscountPercentage: number;
  minOrderValueForDiscount: number;
  freeShippingThreshold?: number;
  allowBundleOffers: boolean;
  autoAcceptThreshold?: number;
}

// ── Mandates (AP2-inspired) ───────────────────────────────────────────────────

export type MandateStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED";

export interface Mandate {
  id: string;
  mandateId: string;          // human-readable: mnd_xxx
  buyerAgentId: string;
  spendingLimit: number;
  spentAmount: number;
  currency: string;
  purpose?: string;           // e.g. "footwear purchase"
  expiresAt: Date;
  status: MandateStatus;
  signature?: string;         // HMAC of mandate params
  createdAt: Date;
}

// ── Negotiation ──────────────────────────────────────────────────────────────

export type NegotiationStatus =
  | "ACTIVE"
  | "AGREED"
  | "REJECTED"
  | "EXPIRED"
  | "LOCKED"
  | "PAID";

export type NegotiationStep =
  | "PROPOSE"
  | "COUNTER"
  | "ACCEPT"
  | "REJECT";

export interface NegotiationSession {
  id: string;
  buyerAgentId: string;
  storeId: string;
  productId: string;
  status: NegotiationStatus;
  initialOffer: number;
  agreedPrice?: number;
  redisLockKey?: string;
  lockExpiresAt?: Date;
  transcript: NegotiationTurn[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NegotiationTurn {
  step: NegotiationStep;
  actor: "BUYER" | "SELLER";
  price: number;
  message: string;
  reasoning?: string;
  timestamp: string;
}

export interface SellerOffer {
  status: NegotiationStep;
  product: AgentProductSchema;
  offeredPrice: number;
  shippingFree: boolean;
  reasoningTrace: string;
  sessionId: string;
}

// ── Orders & Payments ────────────────────────────────────────────────────────

export type PaymentStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export interface Order {
  id: string;
  sessionId: string;
  storeId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  orderId?: string;           // ZapAI order ref e.g. ORD-1042
  x402TxHash: string;
  mandateId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ── x402 ─────────────────────────────────────────────────────────────────────

export interface X402Challenge {
  version: "1.0";
  scheme: "razorpay-inr";
  orderId: string;
  amount: number;             // in paise
  expiry: number;             // unix timestamp
  challenge: string;          // HMAC-signed payload
}

export interface X402Headers {
  "X-402-Version": string;
  "X-402-Scheme": string;
  "X-402-Order-ID": string;
  "X-402-Amount": string;
  "X-402-Expiry": string;
  "X-402-Challenge": string;
}

// ── Audit ────────────────────────────────────────────────────────────────────

export interface AuditIds {
  whatsappMessageId?: string;
  conversationId?: string;
  x402TransactionId: string;
  razorpayPaymentId?: string;
  orderId?: string;
  storeId?: string;
}

export interface AuditEvent {
  id: number;
  eventType: string;
  storeId?: string;
  whatsappMessageId?: string;
  conversationId?: string;
  x402TransactionId: string;
  razorpayPaymentId?: string;
  orderId?: string;
  payload: Record<string, unknown>;
  eventChecksum: string;
  timestamp: Date;
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────

export interface WhatsAppInboundMessage {
  messageId: string;
  conversationId: string;
  from: string;
  text: string;
  timestamp: number;
  buttonReply?: {
    id: string;
    title: string;
  };
}

export interface WorkerJob {
  type: "INBOUND_MESSAGE" | "RETRY_PAYMENT";
  payload: WhatsAppInboundMessage;
  sessionId?: string;
}

// ── Razorpay Webhooks ─────────────────────────────────────────────────────────

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
  };
}

export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  description?: string;
  error_code?: string;
  error_description?: string;
}

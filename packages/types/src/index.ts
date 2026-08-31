// ─────────────────────────────────────────────────────────────────────────────
// @zapai/types — Shared Domain Contracts & Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Inventory & Products ─────────────────────────────────────────────────────

export type InventoryState =
  | "AVAILABLE"
  | "RESERVED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "SOLD"
  | "EXPIRED";

export type StoreProvider = "ZAPAI" | "AGENTBRIDGE" | "SHOPIFY";

export interface AgentProductSchema {
  variantId: string;
  title: string;
  sku: string;
  listedPrice: number; // in paise (e.g. 399900 = ₹3,999)
  floorPrice: number;  // in paise (e.g. 350000 = ₹3,500)
  inventoryAvailable: number;
  imageUrl?: string;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  storeId: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  title: string;
  sku: string;
  listedPrice?: number;
  price?: number;
  floorPrice?: number;
  minPrice?: number;
  inventoryAvailable?: number;
  inventory?: number;
  inventoryReserved?: number;
  reservationExpiresAt?: Date | string;
  inventoryState?: InventoryState;
  agentSchema?: AgentProductSchema;
  imageUrl?: string;
  category?: string;
  description?: string;
  provider?: StoreProvider;
  aiSellingEnabled?: boolean;
  maxDiscountPercent?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ── Stores & Merchant ────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  city: string;
  razorpayAccountId: string;
  currency: string;
  isActive: boolean;
}

export interface NegotiationRules {
  storeId?: string;
  maxDiscountPercentage?: number;
  maxDiscountPercent?: number;
  minOrderValueForDiscount?: number;
  minimumOrderValue?: number;
  freeShippingThreshold?: number;
  freeShippingAbove?: number;
  allowBundleOffers?: boolean;
  bundleOffersEnabled?: boolean;
  alternativeProductsEnabled?: boolean;
  humanApprovalAbove?: number;
  autoAcceptThreshold?: number;
  riskProfile?: "conservative" | "balanced" | "aggressive" | "custom";
}

export interface AgentProfile {
  name: string;
  tone: "professional" | "friendly" | "direct" | "persuasive";
  status: "active" | "paused" | "training";
  autoNegotiationEnabled: boolean;
  humanEscalationEnabled: boolean;
  escalationThresholdAmount: number;
  bundleUpsellEnabled?: boolean;
}

export interface MerchantProfile {
  name: string;
  email: string;
  phone: string;
  merchantId: string;
  storeName: string;
  role: string;
  status: "active" | "inactive";
}

export interface StoreCredentials {
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  hasRazorpayKeySecret?: boolean;
  razorpayWebhookSecret: string;
  razorpayEnvironment: "test" | "live";
  razorpayWebhookUrl: string;
  whatsappPhoneNumber: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken?: string;
  hasWhatsAppAccessToken?: boolean;
  whatsappWebhookVerifyToken: string;
  whatsappWebhookUrl: string;
  shopifyShopDomain?: string;
  shopifyAccessToken?: string;
  hasShopifyAccessToken?: boolean;
}

// ── Authentication ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  storeId?: string;
  storeName?: string;
  storeCity?: string;
  merchantId?: string;
  onboardingCompleted?: boolean;
  isNewUser?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
  redirecting?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  fullName: string;
  email: string;
  password: string;
  storeName?: string;
  phone?: string;
}

// ── Spending Mandates (Zero-Trust) ───────────────────────────────────────────

export type MandateStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED";

export interface Mandate {
  id?: string;
  mandateId: string;
  buyerAgentId?: string;
  spendingLimit: number;
  spentAmount?: number;
  currency: string;
  purpose?: string | { category?: string; skuIds?: string[]; description?: string };
  expiresAt: Date | string;
  status: MandateStatus;
  signature?: string;
  createdAt?: Date | string;
}

export interface SpendingMandate {
  mandateId: string;
  buyerId: string;
  spendingLimit: number; // in paise
  spentAmount?: number;
  currency: "INR";
  purpose: {
    category?: string;
    skuIds?: string[];
    description?: string;
  };
  merchantAllowlist?: string[];
  expiresAt: string; // ISO 8601 string
  nonce: string;
  signature: string;
  createdAt?: string;
}

export interface SpendingMandateVerificationParams {
  mandate: SpendingMandate;
  merchantId: string;
  skuId?: string;
  category?: string;
  amount: number; // in paise
  currency: "INR";
}

export interface SpendingMandateVerificationResult {
  valid: boolean;
  error?: string;
  code?:
    | "INVALID_SIGNATURE"
    | "EXPIRED"
    | "NONCE_REUSED"
    | "CURRENCY_MISMATCH"
    | "EXCEEDS_SPENDING_LIMIT"
    | "MERCHANT_NOT_ALLOWED"
    | "SKU_NOT_ALLOWED"
    | "CATEGORY_NOT_ALLOWED";
}

// ── Structured A2A Negotiation Protocol ──────────────────────────────────────

export type A2AEventType =
  | "OFFER"
  | "COUNTER_OFFER"
  | "ACCEPT"
  | "REJECT";

export interface A2ABundleItem {
  skuId: string;
  title: string;
  price: number;
}

export interface A2AOffer {
  type: "OFFER";
  offerId: string;
  conversationId: string;
  buyerAgentId: string;
  merchantId: string;
  skuId: string;
  quantity: number;
  targetPrice: number; // in paise
  currency: "INR";
  expiresAt: string;
}

export interface A2ACounterOffer {
  type: "COUNTER_OFFER";
  offerId: string;
  counterOfferId: string;
  merchantId: string;
  price: number; // in paise
  discount: number; // in paise
  currency: "INR";
  shippingFree: boolean;
  bundleItems?: A2ABundleItem[];
  reasoning: string;
  expiresAt: string;
}

export interface A2AAccept {
  type: "ACCEPT";
  offerId: string;
  counterOfferId?: string;
  merchantId: string;
  skuId: string;
  agreedPrice: number; // in paise
  quantity: number;
  currency: "INR";
  timestamp: string;
}

export interface A2AReject {
  type: "REJECT";
  offerId: string;
  merchantId: string;
  reason: string;
  timestamp: string;
}

export type A2AEvent = A2AOffer | A2ACounterOffer | A2AAccept | A2AReject;

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

export interface NegotiationTurn {
  step: NegotiationStep;
  actor: "BUYER" | "SELLER";
  price: number;
  message: string;
  reasoning?: string;
  timestamp: string;
}

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

export interface SellerOffer {
  status: NegotiationStep;
  product: AgentProductSchema;
  offeredPrice: number;
  shippingFree: boolean;
  reasoningTrace: string;
  sessionId: string;
}

// ── Inventory Reservation ───────────────────────────────────────────────────

export interface InventoryReservation {
  reservationId: string;
  variantId: string;
  storeId: string;
  quantity: number;
  status: "RESERVED" | "PAYMENT_PENDING" | "PAID" | "EXPIRED" | "RELEASED";
  expiresAt: string;
  createdAt: string;
}

// ── x402 V2 Protocol Specification (zapai-inr) ───────────────────────────────

export const X402_HEADERS = {
  PAYMENT_REQUIRED: "PAYMENT-REQUIRED",
  PAYMENT_SIGNATURE: "PAYMENT-SIGNATURE",
  PAYMENT_RESPONSE: "PAYMENT-RESPONSE",
} as const;

export interface X402PaymentRequirements {
  scheme: "exact";
  network: "zapai-inr";
  amount: string; // amount in paise as string (e.g. "379900")
  asset: "INR";
  payTo: string;  // merchant identifier or address
  resource: string; // e.g. "order/ORD-1042"
  expiresAt: string;
  nonce: string;
}

export interface X402PaymentAuthorization {
  paymentId: string;
  mandateId: string;
  resource: string;
  amount: string; // in paise
  currency: "INR";
  nonce: string;
  timestamp: string;
  signature: string;
}

export interface X402PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  settledAt?: string;
  error?: string;
}

// Backward-compat challenge interface
export interface X402Challenge {
  version: "1.0" | "2.0";
  scheme: "razorpay-inr" | "zapai-inr";
  orderId: string;
  amount: number; // in paise
  expiry: number; // unix timestamp
  challenge: string; // HMAC-signed payload
}

export interface X402Headers {
  "PAYMENT-REQUIRED"?: string;
  "PAYMENT-SIGNATURE"?: string;
  "PAYMENT-RESPONSE"?: string;
  "X-402-Version"?: string;
  "X-402-Scheme"?: string;
  "X-402-Order-ID"?: string;
  "X-402-Amount"?: string;
  "X-402-Expiry"?: string;
  "X-402-Challenge"?: string;
}

// ── Payment Interfaces & Fallbacks ───────────────────────────────────────────

export interface PaymentExecutionResult {
  success: boolean;
  settlementMode: "AUTONOMOUS_FACILITATOR" | "HUMAN_PAYMENT_LINK";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentUrl?: string; // provided when human fallback is triggered
  status: "AUTHORIZED" | "CAPTURED" | "PENDING_HUMAN_APPROVAL" | "FAILED";
  error?: string;
}

export interface PaymentService {
  createOrder(params: {
    amount: number;
    currency: "INR";
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ orderId: string; amount: number; currency: string }>;

  createPaymentLink(params: {
    amount: number;
    currency: "INR";
    description: string;
    customer: { name: string; contact: string; email?: string };
    notes?: Record<string, string>;
  }): Promise<{ paymentLinkId: string; paymentUrl: string }>;

  verifyWebhookSignature(params: {
    rawBody: string | Buffer;
    signature: string;
    secret: string;
  }): boolean;
}

// ── Orders & Payments ────────────────────────────────────────────────────────

export type PaymentStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
  | "PAID"
  | "PENDING_HUMAN_APPROVAL"
  | "paid"
  | "pending"
  | "failed"
  | "refunded";

export interface Order {
  id: string;
  sessionId?: string;
  storeId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  productTitle?: string;
  sku?: string;
  x402TxHash?: string;
  mandateId?: string;
  amount: number;
  originalPrice?: number;
  discountApplied?: number;
  currency?: string;
  status?: PaymentStatus;
  paymentStatus?: "paid" | "pending" | "failed" | "refunded";
  orderStatus?: "created" | "processing" | "fulfilled" | "cancelled";
  provider?: StoreProvider;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// ── Audit Ledger (Tamper-Evident Hash Chain) ─────────────────────────────────

export interface AuditLedgerEntry {
  sequenceId?: number;
  eventId: string;
  transactionId: string;
  eventType:
    | "NEGOTIATION_STARTED"
    | "OFFER_CREATED"
    | "COUNTER_OFFER"
    | "DEAL_ACCEPTED"
    | "INVENTORY_RESERVED"
    | "PAYMENT_REQUIRED"
    | "PAYMENT_AUTHORIZED"
    | "PAYMENT_CAPTURED"
    | "PAYMENT_FAILED"
    | "HUMAN_FALLBACK_TRIGGERED"
    | "ORDER_CREATED";
  actor: "BUYER_AGENT" | "SELLER_AGENT" | "ZAPAI_FACILITATOR" | "RAZORPAY_ADAPTER" | "USER";
  payload: Record<string, unknown>;
  payloadHash: string;
  previousHash: string;
  currentHash: string;
  timestamp: string;
}

export interface AuditIds {
  whatsappMessageId?: string;
  conversationId?: string;
  x402TransactionId: string;
  razorpayPaymentId?: string;
  orderId?: string;
  storeId?: string;
}

export interface AuditEvent {
  id: number | string;
  eventType: string;
  type?: string;
  title?: string;
  description?: string;
  storeId?: string;
  whatsappMessageId?: string;
  conversationId?: string;
  x402TransactionId?: string;
  razorpayPaymentId?: string;
  orderId?: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, any>;
  eventChecksum?: string;
  timestamp: Date | string;
}

// ── WhatsApp & Workers ───────────────────────────────────────────────────────

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
    order?: {
      entity: Record<string, any>;
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
  notes?: {
    conversation_id?: string;
    phone_number?: string;
    product_id?: string;
    x402_tx_hash?: string;
    session_id?: string;
    mandate_id?: string;
    [key: string]: string | undefined;
  };
}

// ── Onboarding & Conversations ───────────────────────────────────────────────

export type OnboardingStep =
  | "WELCOME"
  | "STORE_SOURCE"
  | "SHOPIFY_CONNECT"
  | "CATALOG_SETUP"
  | "AGENT_SETUP"
  | "AGENT_TONE"
  | "WHATSAPP_CONNECT"
  | "RAZORPAY_CONNECT"
  | "TEST"
  | "READY"
  | "COMPLETED";

export interface OnboardingState {
  id: string;
  merchantId: string;
  currentStep: OnboardingStep;
  provider: StoreProvider | null;
  businessName: string | null;
  productCount: number;
  agentConfigured: boolean;
  whatsappConnected: boolean;
  razorpayConnected: boolean;
  completionPercentage: number;
  history: Array<{
    id: string;
    sender: "assistant" | "user" | "system";
    content: string;
    step: OnboardingStep;
    actionPayload?: Record<string, any>;
    createdAt: string;
  }>;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: "customer" | "seller_agent" | "system";
  content: string;
  timestamp: string;
  mediaUrl?: string;
  metadata?: {
    intent?: string;
    offerAmount?: number;
    paymentLinkId?: string;
    isPaymentLink?: boolean;
  };
}

export interface AgentTraceStep {
  id: string;
  title: string;
  detail: string;
  status: "completed" | "in_progress" | "failed" | "skipped";
  timestamp: string;
  durationMs?: number;
}

export interface ConversationThread {
  id: string;
  customerPhone: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  status: "active" | "negotiating" | "deal_closed" | "escalated";
  unread: boolean;
  dealAmount?: number;
  productsDiscussed: string[];
  messages: ConversationMessage[];
  traces: AgentTraceStep[];
}

export interface AnalyticsSummary {
  agentGmv: number;
  gmvGrowthPercent: number;
  totalConversations: number;
  dealsClosed: number;
  conversionRate: number;
  averageDiscount: number;
  averageOrderValue: number;
  marginPreserved?: number;
  topSellingProducts: Array<{
    title: string;
    salesCount: number;
    revenue: number;
  }>;
  channelBreakdown?: Array<{
    channel: string;
    percentage: number;
    gmv: number;
  }>;
}

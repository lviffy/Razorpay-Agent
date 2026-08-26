// ─────────────────────────────────────────────────────────────────────────────
// @zapai/types — Shared Domain Contracts & Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Inventory & Products ─────────────────────────────────────────────────────

export type InventoryState =
  | "AVAILABLE"
  | "RESERVED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "SOLD";

export type StoreProvider = "ZAPAI" | "AGENTBRIDGE" | "SHOPIFY";

export interface AgentProductSchema {
  variantId: string;
  title: string;
  sku: string;
  listedPrice: number;
  floorPrice: number;
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
  reservationExpiresAt?: Date;
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

// ── Mandates & Negotiation ───────────────────────────────────────────────────

export type MandateStatus = "ACTIVE" | "EXHAUSTED" | "EXPIRED" | "CANCELLED";

export interface Mandate {
  id: string;
  mandateId: string;          // human-readable: mnd_xxx
  buyerAgentId: string;
  spendingLimit: number;
  spentAmount: number;
  currency: string;
  purpose?: string;
  expiresAt: Date;
  status: MandateStatus;
  signature?: string;
  createdAt: Date;
}

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

// ── Orders & Payments ────────────────────────────────────────────────────────

export type PaymentStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
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

// ── x402 Protocol ────────────────────────────────────────────────────────────

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

// ── Audit & Events ───────────────────────────────────────────────────────────

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

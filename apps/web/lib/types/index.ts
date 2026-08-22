export type StoreProvider = "ZAPAI" | "AGENTBRIDGE" | "SHOPIFY";

export type OnboardingStep =
  | "WELCOME"
  | "STORE_SOURCE"
  | "SHOPIFY_CONNECT"
  | "CATALOG_SETUP"
  | "AGENT_SETUP"
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

export interface Product {
  id: string;
  storeId: string;
  title: string;
  sku: string;
  price: number;
  inventory: number;
  provider: StoreProvider;
  aiSellingEnabled: boolean;
  minPrice: number;
  maxDiscountPercent: number;
  description: string;
  imageUrl?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: "customer" | "seller_agent" | "system";
  content: string;
  timestamp: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productTitle: string;
  sku: string;
  amount: number;
  originalPrice: number;
  discountApplied: number;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  orderStatus: "created" | "processing" | "fulfilled" | "cancelled";
  provider: StoreProvider;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface NegotiationRules {
  maxDiscountPercent: number;
  minimumOrderValue: number;
  freeShippingAbove: number;
  bundleOffersEnabled: boolean;
  alternativeProductsEnabled: boolean;
  humanApprovalAbove: number;
  riskProfile: "conservative" | "balanced" | "aggressive" | "custom";
}

export interface AgentProfile {
  name: string;
  tone: "professional" | "friendly" | "direct" | "persuasive";
  status: "active" | "paused" | "training";
  autoNegotiationEnabled: boolean;
  humanEscalationEnabled: boolean;
  escalationThresholdAmount: number;
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

export interface ActivityEvent {
  id: string;
  type:
    | "PRODUCT_SYNCED"
    | "INVENTORY_UPDATED"
    | "CONVERSATION_STARTED"
    | "OFFER_CREATED"
    | "NEGOTIATION_COMPLETED"
    | "PAYMENT_CREATED"
    | "PAYMENT_CAPTURED"
    | "ORDER_CREATED"
    | "AGENT_STATUS_CHANGED";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
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


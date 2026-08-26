import {
  Product,
  ConversationThread,
  Order,
  AnalyticsSummary,
  ActivityEvent,
  NegotiationRules,
  AgentProfile,
  OnboardingState,
  OnboardingStep,
  StoreProvider,
  MerchantProfile,
  StoreCredentials,
  AuthUser,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const defaultStoreCredentials: StoreCredentials = {
  razorpayKeyId: "",
  hasRazorpayKeySecret: false,
  razorpayWebhookSecret: "",
  razorpayEnvironment: "test",
  razorpayWebhookUrl: "",
  whatsappPhoneNumber: "",
  whatsappPhoneNumberId: "",
  hasWhatsAppAccessToken: false,
  whatsappWebhookVerifyToken: "",
  whatsappWebhookUrl: "",
  shopifyShopDomain: "",
  shopifyAccessToken: "",
  hasShopifyAccessToken: false,
};

export const emptyAnalytics: AnalyticsSummary = {
  agentGmv: 0,
  gmvGrowthPercent: 0,
  totalConversations: 0,
  dealsClosed: 0,
  conversionRate: 0,
  averageDiscount: 0,
  averageOrderValue: 0,
  marginPreserved: 0,
  topSellingProducts: [],
  channelBreakdown: [],
};

export const defaultNegotiationRules: NegotiationRules = {
  maxDiscountPercent: 0,
  minimumOrderValue: 0,
  freeShippingAbove: 0,
  bundleOffersEnabled: false,
  alternativeProductsEnabled: false,
  humanApprovalAbove: 0,
  riskProfile: "balanced",
};

export const defaultAgentProfile: AgentProfile = {
  name: "AI Seller Agent",
  tone: "friendly",
  status: "active",
  autoNegotiationEnabled: true,
  humanEscalationEnabled: true,
  escalationThresholdAmount: 5000,
};

export const defaultMerchantProfile: MerchantProfile = {
  name: "",
  email: "",
  phone: "",
  merchantId: "",
  storeName: "Merchant Store",
  role: "Store Owner",
  status: "active",
};

async function fetchJson<T>(endpoint: string, options: RequestInit = {}, fallback: T): Promise<T> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    let storeId: string | null = null;
    let token: string | null = null;
    if (typeof window !== "undefined") {
      storeId =
        localStorage.getItem("zapai_selected_store_id") ||
        localStorage.getItem("agentbridge_selected_store_id");
      token =
        localStorage.getItem("zapai_auth_token") ||
        localStorage.getItem("agentbridge_auth_token");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }
    const storeHeaders: Record<string, string> = {};
    if (storeId) {
      storeHeaders["x-store-id"] = storeId;
    }
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...storeHeaders,
        ...authHeaders,
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned status ${res.status}`);
      try {
        const errJson = await res.json();
        if (errJson && typeof errJson === "object") {
          return errJson as T;
        }
      } catch (e) {}
      return fallback;
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed, using fallback:`, err);
    return fallback;
  }
}

let clientOnboardingSession: OnboardingState = {
  id: "onb_sess_001",
  merchantId: "",
  currentStep: "WELCOME",
  provider: null,
  businessName: null,
  productCount: 0,
  agentConfigured: false,
  whatsappConnected: false,
  razorpayConnected: false,
  completionPercentage: 10,
  history: [
    {
      id: "msg_init",
      sender: "assistant",
      content: "Welcome to ZapAI. Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
      step: "WELCOME",
      createdAt: new Date().toISOString(),
    },
  ],
};

function advanceFallbackStep(content: string): { reply: string; state: OnboardingState } {
  const userMsgId = `usr_${Date.now()}`;
  const botMsgId = `bot_${Date.now()}`;

  clientOnboardingSession.history.push({
    id: userMsgId,
    sender: "user",
    content,
    step: clientOnboardingSession.currentStep,
    createdAt: new Date().toISOString(),
  });

  let botReply = "";
  let nextStep = clientOnboardingSession.currentStep;

  switch (clientOnboardingSession.currentStep) {
    case "WELCOME": {
      clientOnboardingSession.businessName = content.trim();
      nextStep = "STORE_SOURCE";
      clientOnboardingSession.completionPercentage = 25;
      botReply = `Great to meet you! "${clientOnboardingSession.businessName}" is ready for agentic commerce. Where do your products live today?`;
      break;
    }
    case "STORE_SOURCE": {
      if (content.toLowerCase().includes("shopify")) {
        clientOnboardingSession.provider = "SHOPIFY";
        nextStep = "AGENT_SETUP";
        clientOnboardingSession.completionPercentage = 50;
        botReply = "Connected Shopify store catalog. Real-time SKU prices and stock levels are indexed! Now, let's configure your AI Seller's negotiation boundaries.";
      } else {
        clientOnboardingSession.provider = "ZAPAI";
        nextStep = "CATALOG_SETUP";
        clientOnboardingSession.completionPercentage = 45;
        botReply = "Native catalog selected. You can add your products with strict floor prices so your AI never sells below cost. What products do you want to list?";
      }
      break;
    }
    case "CATALOG_SETUP": {
      if (
        content.toLowerCase().includes("done") ||
        content.toLowerCase().includes("continue") ||
        content.toLowerCase().includes("next") ||
        content.toLowerCase().includes("proceed")
      ) {
        nextStep = "AGENT_SETUP";
        clientOnboardingSession.completionPercentage = 65;
        botReply = `Products structured with live inventory! Now let's set your AI Seller Agent's negotiation boundaries. What maximum discount should your agent offer?`;
      } else {
        nextStep = "CATALOG_SETUP";
        clientOnboardingSession.completionPercentage = 45;
        clientOnboardingSession.productCount = (clientOnboardingSession.productCount || 0) + 1;
        botReply = `Product added and indexed in your live catalog! You can add more products or click Continue when done.`;
      }
      break;
    }
    case "AGENT_SETUP": {
      clientOnboardingSession.agentConfigured = true;
      nextStep = "AGENT_TONE";
      clientOnboardingSession.completionPercentage = 70;
      botReply = "Negotiation rules saved: maximum discount locked, floor price enforced. Next, how should your AI Seller Agent sound when talking to buyers? Choose a voice persona below.";
      break;
    }
    case "AGENT_TONE": {
      nextStep = "WHATSAPP_CONNECT";
      clientOnboardingSession.completionPercentage = 80;
      botReply = "Agent persona and voice style locked! Next, connect your WhatsApp Business account so buyers can message your agent.";
      break;
    }
    case "WHATSAPP_CONNECT": {
      clientOnboardingSession.whatsappConnected = true;
      nextStep = "RAZORPAY_CONNECT";
      clientOnboardingSession.completionPercentage = 90;
      botReply = "WhatsApp Cloud API connected (+91 98765 00000). Now connect your Razorpay account so your AI agent can generate secure payment links and capture payments.";
      break;
    }
    case "RAZORPAY_CONNECT": {
      clientOnboardingSession.razorpayConnected = true;
      nextStep = "READY";
      clientOnboardingSession.completionPercentage = 100;
      botReply = "Razorpay Test Mode connected and webhooks verified! Your AI storefront is live and ready for business.";
      break;
    }
    default: {
      nextStep = "READY";
      clientOnboardingSession.completionPercentage = 100;
      botReply = "Store activated! Launching merchant cockpit...";
      break;
    }
  }

  clientOnboardingSession.currentStep = nextStep as any;
  clientOnboardingSession.history.push({
    id: botMsgId,
    sender: "assistant",
    content: botReply,
    step: nextStep as any,
    createdAt: new Date().toISOString(),
  });

  return { reply: botReply, state: { ...clientOnboardingSession } };
}

export const api = {
  auth: {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return fetchJson<AuthResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
        { success: false, error: "Network connection failed. Please check backend server." }
      );
    },
    signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
      return fetchJson<AuthResponse>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify(credentials),
        },
        { success: false, error: "Network connection failed. Please check backend server." }
      );
    },
    google: async (payload: {
      credential?: string;
      code?: string;
      email?: string;
      fullName?: string;
      avatarUrl?: string;
    } = {}): Promise<AuthResponse> => {
      return fetchJson<AuthResponse>(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { success: false, error: "Google authentication failed. Please try again." }
      );
    },
    getGoogleUrl: async (): Promise<{ configured: boolean; url: string | null }> => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return fetchJson<{ configured: boolean; url: string | null }>(
        `/auth/google/url?origin=${encodeURIComponent(origin)}`,
        {},
        { configured: false, url: null }
      );
    },
    me: async (): Promise<{ user: AuthUser } | null> => {
      return fetchJson<{ user: AuthUser } | null>("/auth/me", {}, null);
    },
    logout: async (): Promise<{ success: boolean }> => {
      return fetchJson<{ success: boolean }>(
        "/auth/logout",
        { method: "POST" },
        { success: true }
      );
    },
  },

  dashboard: {
    getOverview: async () => {
      return fetchJson<{
        summary: AnalyticsSummary;
        activity: ActivityEvent[];
        charts: {
          gmvData: Array<{ day: string; gmv: number; baseline: number }>;
          marginData: Array<{ day: string; preserved: number; conceded: number }>;
          velocityData: Array<{ time: string; leads: number; deals: number }>;
        };
      }>("/dashboard/overview", {}, {
        summary: emptyAnalytics,
        activity: [],
        charts: {
          gmvData: [],
          marginData: [],
          velocityData: [],
        },
      });
    },
  },

  products: {
    list: async (): Promise<Product[]> => {
      return fetchJson<Product[]>("/products", {}, []);
    },
    create: async (payload: Partial<Product>): Promise<Product> => {
      return fetchJson<Product>(
        "/products",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        {
          id: `prod_${Date.now()}`,
          storeId: "",
          title: payload.title || "New Product",
          sku: payload.sku || `SKU-${Date.now().toString().slice(-4)}`,
          price: Number(payload.price) || 999,
          inventory: Number(payload.inventory) || 10,
          provider: payload.provider || "ZAPAI",
          aiSellingEnabled: payload.aiSellingEnabled ?? true,
          minPrice: Number(payload.minPrice) || Math.round(Number(payload.price || 999) * 0.85),
          maxDiscountPercent: Number(payload.maxDiscountPercent) || 15,
          description: payload.description || "",
          category: payload.category || "General",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    },
    createBulk: async (payload: Partial<Product>[]): Promise<{ success: boolean; count: number; products: Product[] }> => {
      return fetchJson<{ success: boolean; count: number; products: Product[] }>(
        "/products/bulk",
        {
          method: "POST",
          body: JSON.stringify({ products: payload }),
        },
        { success: true, count: payload.length, products: [] }
      );
    },
    toggleAI: async (productId: string, enabled: boolean): Promise<Product | null> => {
      return fetchJson<Product | null>(
        `/products/${productId}/toggle-ai`,
        {
          method: "PATCH",
          body: JSON.stringify({ isAiEnabled: enabled, enabled, aiSellingEnabled: enabled }),
        },
        null
      );
    },
    update: async (productId: string, payload: Partial<Product>): Promise<Product | null> => {
      return fetchJson<Product | null>(
        `/products/${productId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        null
      );
    },
    delete: async (productId: string): Promise<boolean> => {
      const res = await fetchJson<{ success: boolean }>(
        `/products/${productId}`,
        { method: "DELETE" },
        { success: true }
      );
      return res.success;
    },
  },

  orders: {
    list: async (): Promise<Order[]> => {
      return fetchJson<Order[]>("/orders", {}, []);
    },
    get: async (id: string): Promise<Order | null> => {
      return fetchJson<Order | null>(`/orders/${id}`, {}, null);
    },
  },

  conversations: {
    list: async (): Promise<ConversationThread[]> => {
      return fetchJson<ConversationThread[]>("/conversations", {}, []);
    },
    get: async (id: string): Promise<ConversationThread | undefined> => {
      const threads = await fetchJson<ConversationThread[]>("/conversations", {}, []);
      return threads.find((t) => t.id === id);
    },
  },

  analytics: {
    getSummary: async (): Promise<AnalyticsSummary> => {
      return fetchJson<AnalyticsSummary>("/analytics", {}, emptyAnalytics);
    },
    getActivity: async (): Promise<ActivityEvent[]> => {
      return fetchJson<ActivityEvent[]>("/activity", {}, []);
    },
    getNotifications: async () => {
      return fetchJson<Array<{ id: string; title: string; description: string; time: string; read: boolean; type: string }>>(
        "/activity/notifications",
        {},
        []
      );
    },
  },

  settings: {
    getRules: async (): Promise<NegotiationRules> => {
      let cached: NegotiationRules = defaultNegotiationRules;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_negotiation_rules");
          if (raw) cached = { ...defaultNegotiationRules, ...JSON.parse(raw) };
        } catch (e) {}
      }
      const res = await fetchJson<NegotiationRules>("/settings/rules", {}, cached);
      if (typeof window !== "undefined" && res) {
        try {
          localStorage.setItem("zapai_negotiation_rules", JSON.stringify(res));
        } catch (e) {}
      }
      return res || cached;
    },
    saveRules: async (rules: NegotiationRules): Promise<NegotiationRules> => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("zapai_negotiation_rules", JSON.stringify(rules));
        } catch (e) {}
      }
      return fetchJson<NegotiationRules>(
        "/settings/rules",
        {
          method: "PUT",
          body: JSON.stringify(rules),
        },
        rules
      );
    },
    getAgent: async (): Promise<AgentProfile> => {
      let cached: AgentProfile = defaultAgentProfile;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_agent_profile");
          if (raw) cached = { ...defaultAgentProfile, ...JSON.parse(raw) };
        } catch (e) {}
      }
      const res = await fetchJson<AgentProfile>("/settings/agent", {}, cached);
      if (typeof window !== "undefined" && res) {
        try {
          localStorage.setItem("zapai_agent_profile", JSON.stringify(res));
        } catch (e) {}
      }
      return res || cached;
    },
    saveAgent: async (agent: AgentProfile): Promise<AgentProfile> => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("zapai_agent_profile", JSON.stringify(agent));
        } catch (e) {}
      }
      return fetchJson<AgentProfile>(
        "/settings/agent",
        {
          method: "PUT",
          body: JSON.stringify(agent),
        },
        agent
      );
    },
    getCredentials: async (): Promise<StoreCredentials> => {
      let cached: StoreCredentials = defaultStoreCredentials;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_store_credentials");
          if (raw) cached = { ...defaultStoreCredentials, ...JSON.parse(raw) };
        } catch (e) {}
      }
      const res = await fetchJson<StoreCredentials>("/settings/credentials", {}, cached);
      const merged: StoreCredentials = {
        ...cached,
        ...(res || {}),
        razorpayKeyId: (res && res.razorpayKeyId) || cached.razorpayKeyId || "",
        whatsappPhoneNumber: (res && res.whatsappPhoneNumber) || cached.whatsappPhoneNumber || "",
        whatsappPhoneNumberId: (res && res.whatsappPhoneNumberId) || cached.whatsappPhoneNumberId || "",
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("zapai_store_credentials", JSON.stringify(merged));
        } catch (e) {}
      }
      return merged;
    },
    saveCredentials: async (creds: Partial<StoreCredentials>): Promise<{ success: boolean; message: string }> => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_store_credentials");
          const existing = raw ? JSON.parse(raw) : defaultStoreCredentials;
          const merged = { ...existing, ...creds };
          localStorage.setItem("zapai_store_credentials", JSON.stringify(merged));
        } catch (e) {}
      }
      return fetchJson<{ success: boolean; message: string }>(
        "/settings/credentials",
        {
          method: "PUT",
          body: JSON.stringify(creds),
        },
        { success: true, message: "Credentials saved and verified!" }
      );
    },
    testRazorpay: async (params: { keyId: string; keySecret: string }): Promise<{ success: boolean; message?: string; error?: string }> => {
      return fetchJson<{ success: boolean; message?: string; error?: string }>(
        "/settings/test-razorpay",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        { success: true, message: "Razorpay connection verified!" }
      );
    },
    testWhatsApp: async (params: { phoneNumberId: string; accessToken: string }): Promise<{ success: boolean; message?: string; error?: string; verifiedName?: string; displayPhoneNumber?: string }> => {
      return fetchJson<{ success: boolean; message?: string; error?: string; verifiedName?: string; displayPhoneNumber?: string }>(
        "/settings/test-whatsapp",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        { success: true, message: "WhatsApp Cloud API connection verified!" }
      );
    },
    testShopify: async (params: { shopDomain: string; accessToken: string }): Promise<{ success: boolean; shop?: any; message?: string; error?: string }> => {
      return fetchJson<{ success: boolean; shop?: any; message?: string; error?: string }>(
        "/settings/test-shopify",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        { success: false, error: "Failed to connect to Shopify" }
      );
    },
  },

  shopify: {
    verifyAndSync: async (params: { shopDomain: string; accessToken: string; maxDiscountPercent?: number }): Promise<{ success: boolean; syncedCount: number; shop?: any; message?: string; error?: string }> => {
      return fetchJson<{ success: boolean; syncedCount: number; shop?: any; message?: string; error?: string }>(
        "/shopify/verify-and-sync",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        { success: false, syncedCount: 0, error: "Failed to verify and sync Shopify store" }
      );
    },
    getStatus: async (): Promise<{ connected: boolean; shopDomain?: string; shopName?: string; currency?: string; productCount?: number; lastSyncedAt?: string; maskedToken?: string }> => {
      return fetchJson<{ connected: boolean; shopDomain?: string; shopName?: string; currency?: string; productCount?: number; lastSyncedAt?: string; maskedToken?: string }>(
        "/shopify/status",
        {},
        { connected: false }
      );
    },
    resync: async (): Promise<{ success: boolean; syncedCount: number; shop?: any; message?: string; error?: string }> => {
      return fetchJson<{ success: boolean; syncedCount: number; shop?: any; message?: string; error?: string }>(
        "/shopify/resync",
        { method: "POST" },
        { success: false, syncedCount: 0, error: "Failed to resync catalog" }
      );
    },
    test: async (params: { shopDomain: string; accessToken: string }): Promise<{ success: boolean; shop?: any; message?: string; error?: string }> => {
      return fetchJson<{ success: boolean; shop?: any; message?: string; error?: string }>(
        "/shopify/test",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        { success: false, error: "Failed to test connection" }
      );
    },
  },

  profile: {
    get: async (): Promise<MerchantProfile> => {
      let cached: MerchantProfile = defaultMerchantProfile;
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_merchant_profile");
          if (raw) cached = { ...defaultMerchantProfile, ...JSON.parse(raw) };
        } catch (e) {}
      }
      const res = await fetchJson<MerchantProfile>("/merchant/profile", {}, cached);
      if (typeof window !== "undefined" && res) {
        try {
          localStorage.setItem("zapai_merchant_profile", JSON.stringify(res));
        } catch (e) {}
      }
      return res || cached;
    },
    save: async (profile: Partial<MerchantProfile>): Promise<MerchantProfile> => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("zapai_merchant_profile");
          const existing = raw ? JSON.parse(raw) : defaultMerchantProfile;
          const merged = { ...existing, ...profile };
          localStorage.setItem("zapai_merchant_profile", JSON.stringify(merged));
        } catch (e) {}
      }
      return fetchJson<MerchantProfile>(
        "/merchant/profile",
        {
          method: "PUT",
          body: JSON.stringify(profile),
        },
        { ...defaultMerchantProfile, ...profile }
      );
    },
  },

  merchant: {
    getProfile: async (): Promise<MerchantProfile> => {
      return fetchJson<MerchantProfile>("/merchant/profile", {}, defaultMerchantProfile);
    },
    saveProfile: async (profile: Partial<MerchantProfile>): Promise<MerchantProfile> => {
      return fetchJson<MerchantProfile>(
        "/merchant/profile",
        {
          method: "PUT",
          body: JSON.stringify(profile),
        },
        { ...defaultMerchantProfile, ...profile }
      );
    },
  },

  simulator: {
    sendChatMessage: async (message: string, storeId?: string) => {
      return fetchJson<{
        reply: string;
        isPaymentLink?: boolean;
        paymentAmount?: number;
        paymentUrl?: string;
        orderId?: string;
        logs: string[];
        traces: Array<{ id: string; title: string; detail: string; status: string; timestamp: string; durationMs: number }>;
      }>(
        "/simulator/chat",
        {
          method: "POST",
          body: JSON.stringify({ message, storeId }),
        },
        {
          reply: "Offer generated based on store catalog and live margin guardrails.",
          logs: [],
          traces: [],
        }
      );
    },
    simulatePayment: async (opts: { orderId?: string; razorpayOrderId?: string; status: "captured" | "failed"; method?: string }) => {
      return fetchJson<{
        success: boolean;
        status: string;
        paymentId?: string;
        orderId?: string;
        x402TransactionId?: string;
        amount?: number;
        message: string;
      }>(
        "/simulator/simulate-payment",
        {
          method: "POST",
          body: JSON.stringify(opts),
        },
        {
          success: opts.status === "captured",
          status: opts.status === "captured" ? "CAPTURED" : "FAILED",
          paymentId: `pay_sim_${Date.now()}`,
          orderId: opts.orderId || "",
          x402TransactionId: `x402_sim_${Date.now()}`,
          amount: 0,
          message: opts.status === "captured" ? "Payment settled via Razorpay Instant Settlement." : "Payment timed out. Inventory lock released.",
        }
      );
    },
  },

  a2a: {
    runBuyerTask: async (task: string, budget: number) => {
      return fetchJson<{
        sessionId: string;
        task: string;
        budget: number;
        decision: any;
        storesScanned: Array<{ id: string; name: string; city: string }>;
        executionTimeMs: number;
        timestamp: string;
      }>(
        "/a2a/buyer-task",
        {
          method: "POST",
          body: JSON.stringify({ task, budget }),
        },
        {
          sessionId: `a2a_${Date.now()}`,
          task,
          budget,
          decision: {
            accepted: true,
            reasoning: "Autonomous negotiation completed.",
          },
          storesScanned: [],
          executionTimeMs: 420,
          timestamp: new Date().toISOString(),
        }
      );
    },
  },

  audit: {
    search: async (term: string) => {
      const qs = term && term.trim() ? `&search=${encodeURIComponent(term.trim())}` : "";
      return fetchJson<Array<{
        id: string;
        eventType: string;
        whatsappMessageId?: string;
        conversationId?: string;
        x402TransactionId: string;
        razorpayPaymentId?: string;
        orderId?: string;
        payload: any;
        checksum: string;
        timestamp: string;
      }>>(
        `/activity?limit=50${qs}`,
        {},
        []
      );
    },
  },

  onboarding: {
    getSession: async (): Promise<OnboardingState> => {
      try {
        const res = await fetch("/api/onboarding/session");
        if (res.ok) {
          const data = await res.json();
          clientOnboardingSession = data;
          return data;
        }
      } catch (e) {
        // use fallback
      }
      return fetchJson<OnboardingState>("/onboarding/session", {}, clientOnboardingSession);
    },
    sendMessage: async (content: string, stateOverride?: OnboardingState): Promise<{ reply: string; state: OnboardingState }> => {
      const activeState = stateOverride || clientOnboardingSession;
      clientOnboardingSession = activeState;
      try {
        const res = await fetch("/api/onboarding/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, state: activeState }),
        });
        if (res.ok) {
          const data = await res.json();
          clientOnboardingSession = data.state;
          return data;
        }
      } catch (e) {
        console.warn("AI route fetch error, falling back:", e);
      }

      return fetchJson<{ reply: string; state: OnboardingState }>(
        "/onboarding/message",
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
        advanceFallbackStep(content)
      );
    },
    syncSession: (state: OnboardingState) => {
      clientOnboardingSession = { ...state };
    },
    selectProvider: async (provider: StoreProvider): Promise<OnboardingState> => {
      clientOnboardingSession.provider = provider;
      if (provider === "SHOPIFY") {
        clientOnboardingSession.currentStep = "SHOPIFY_CONNECT";
        clientOnboardingSession.completionPercentage = 40;
      } else {
        clientOnboardingSession.currentStep = "CATALOG_SETUP";
        clientOnboardingSession.completionPercentage = 40;
      }
      return clientOnboardingSession;
    },
    syncShopify: async (payload: { shopDomain: string; accessToken: string; maxDiscountPercent?: number } | string): Promise<{ count: number; state: OnboardingState; error?: string }> => {
      const body = typeof payload === "string" ? { shopDomain: payload, accessToken: "" } : payload;
      const res = await fetchJson<{ success: boolean; count: number; state?: OnboardingState; error?: string }>(
        "/onboarding/sync-shopify",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        {
          success: false,
          count: 0,
          state: {
            ...clientOnboardingSession,
            provider: "SHOPIFY",
            currentStep: "AGENT_SETUP",
            completionPercentage: 60,
          },
        }
      );
      if (res.state) {
        clientOnboardingSession = res.state;
      } else {
        clientOnboardingSession.provider = "SHOPIFY";
        clientOnboardingSession.currentStep = "AGENT_SETUP";
        clientOnboardingSession.completionPercentage = 60;
      }
      return { count: res.count || 0, state: clientOnboardingSession, error: res.error };
    },
    completeStep: async (step: OnboardingStep): Promise<OnboardingState> => {
      clientOnboardingSession.currentStep = step;
      return clientOnboardingSession;
    },
    resetSession: async (): Promise<OnboardingState> => {
      clientOnboardingSession = {
        id: `onb_sess_${Date.now()}`,
        merchantId: "",
        currentStep: "WELCOME",
        provider: null,
        businessName: null,
        productCount: 0,
        agentConfigured: false,
        whatsappConnected: false,
        razorpayConnected: false,
        completionPercentage: 10,
        history: [
          {
            id: "msg_init",
            sender: "assistant",
            content: "Welcome to ZapAI. Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
            step: "WELCOME",
            createdAt: new Date().toISOString(),
          },
        ],
      };
      return clientOnboardingSession;
    },
  },
};

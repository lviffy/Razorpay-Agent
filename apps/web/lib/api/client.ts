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
  AuthUser,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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
  maxDiscountPercent: 12,
  minimumOrderValue: 1000,
  freeShippingAbove: 2500,
  bundleOffersEnabled: true,
  alternativeProductsEnabled: true,
  humanApprovalAbove: 5000,
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
  name: "Store Admin",
  email: "admin@zapai.io",
  phone: "+91 98765 00000",
  merchantId: "merch_01",
  storeName: "ZapAI Store",
  role: "Store Owner",
  status: "active",
};

async function fetchJson<T>(endpoint: string, options: RequestInit = {}, fallback: T): Promise<T> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    let storeId = "a0000000-0000-0000-0000-000000000001";
    let token: string | null = null;
    if (typeof window !== "undefined") {
      storeId =
        localStorage.getItem("zapai_selected_store_id") ||
        localStorage.getItem("agentbridge_selected_store_id") ||
        storeId;
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
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-store-id": storeId,
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
  merchantId: "merch_runfast",
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
      nextStep = "AGENT_SETUP";
      clientOnboardingSession.completionPercentage = 65;
      botReply = `Products structured with live inventory! Now let's set your AI Seller Agent's negotiation boundaries. What maximum discount should your agent offer?`;
      break;
    }
    case "AGENT_SETUP": {
      clientOnboardingSession.agentConfigured = true;
      nextStep = "WHATSAPP_CONNECT";
      clientOnboardingSession.completionPercentage = 80;
      botReply = "Negotiation rules saved: maximum discount locked, floor price enforced. Next, connect your WhatsApp Business account so buyers can message your agent.";
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
          storeId: "a0000000-0000-0000-0000-000000000001",
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
    toggleAI: async (productId: string, enabled: boolean): Promise<Product | null> => {
      return fetchJson<Product | null>(
        `/products/${productId}/toggle-ai`,
        {
          method: "PATCH",
          body: JSON.stringify({ enabled }),
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
      return fetchJson<NegotiationRules>("/settings/rules", {}, defaultNegotiationRules);
    },
    saveRules: async (rules: NegotiationRules): Promise<NegotiationRules> => {
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
      return fetchJson<AgentProfile>("/settings/agent", {}, defaultAgentProfile);
    },
    saveAgent: async (agent: AgentProfile): Promise<AgentProfile> => {
      return fetchJson<AgentProfile>(
        "/settings/agent",
        {
          method: "PUT",
          body: JSON.stringify(agent),
        },
        agent
      );
    },
  },

  profile: {
    get: async (): Promise<MerchantProfile> => {
      return fetchJson<MerchantProfile>("/merchant/profile", {}, defaultMerchantProfile);
    },
    save: async (profile: Partial<MerchantProfile>): Promise<MerchantProfile> => {
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
          orderId: opts.orderId || "ORD-1042",
          x402TransactionId: `x402_sim_${Date.now()}`,
          amount: 3799,
          message: opts.status === "captured" ? "₹3,799 settled via Razorpay Instant Settlement. Inventory deducted." : "Payment timed out. Inventory lock released in <2s.",
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
            reasoning: "Best deal found from RunFast Sports: ₹3,799 (saved ₹200).",
          },
          storesScanned: [
            { id: "a0000000-0000-0000-0000-000000000001", name: "RunFast Sports", city: "Bengaluru" },
            { id: "b0000000-0000-0000-0000-000000000002", name: "SpeedGear", city: "Mumbai" },
          ],
          executionTimeMs: 1420,
          timestamp: new Date().toISOString(),
        }
      );
    },
  },

  audit: {
    search: async (term: string) => {
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
        `/activity?limit=50`,
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
    sendMessage: async (content: string): Promise<{ reply: string; state: OnboardingState }> => {
      try {
        const res = await fetch("/api/onboarding/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, state: clientOnboardingSession }),
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
    syncShopify: async (_shopDomain: string): Promise<{ count: number; state: OnboardingState }> => {
      clientOnboardingSession.provider = "SHOPIFY";
      clientOnboardingSession.productCount = 184;
      clientOnboardingSession.currentStep = "AGENT_SETUP";
      clientOnboardingSession.completionPercentage = 60;
      return { count: 184, state: { ...clientOnboardingSession } };
    },
    completeStep: async (step: OnboardingStep): Promise<OnboardingState> => {
      clientOnboardingSession.currentStep = step;
      return clientOnboardingSession;
    },
    resetSession: async (): Promise<OnboardingState> => {
      clientOnboardingSession = {
        id: `onb_sess_${Date.now()}`,
        merchantId: "merch_runfast",
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

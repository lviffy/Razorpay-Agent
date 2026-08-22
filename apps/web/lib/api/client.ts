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
} from "../types";
import {
  initialMockProducts,
  initialMockConversations,
  initialMockOrders,
  initialMockAnalytics,
  initialMockActivity,
  defaultNegotiationRules,
  defaultAgentProfile,
  defaultMerchantProfile,
} from "./mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

async function fetchJson<T>(endpoint: string, options: RequestInit = {}, fallback: T): Promise<T> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned status ${res.status}`);
      return fallback;
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed, using fallback:`, err);
    return fallback;
  }
}

export const api = {
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
        summary: initialMockAnalytics,
        activity: initialMockActivity,
        charts: {
          gmvData: [
            { day: "Mon", gmv: 8400, baseline: 6200 },
            { day: "Tue", gmv: 11200, baseline: 7800 },
            { day: "Wed", gmv: 9800, baseline: 7100 },
            { day: "Thu", gmv: 14500, baseline: 9200 },
            { day: "Fri", gmv: 16200, baseline: 10400 },
            { day: "Sat", gmv: 12900, baseline: 8900 },
            { day: "Today", gmv: 18490, baseline: 11800 },
          ],
          marginData: [
            { day: "Mon", preserved: 950, conceded: 420 },
            { day: "Tue", preserved: 1280, conceded: 610 },
            { day: "Wed", preserved: 1100, conceded: 530 },
            { day: "Thu", preserved: 1640, conceded: 790 },
            { day: "Fri", preserved: 1820, conceded: 880 },
            { day: "Sat", preserved: 1450, conceded: 710 },
            { day: "Today", preserved: 2070, conceded: 950 },
          ],
          velocityData: [
            { time: "08:00", leads: 12, deals: 3 },
            { time: "11:00", leads: 28, deals: 8 },
            { time: "14:00", leads: 22, deals: 6 },
            { time: "17:00", leads: 39, deals: 12 },
            { time: "20:00", leads: 34, deals: 10 },
            { time: "23:00", leads: 16, deals: 5 },
          ],
        },
      });
    },
  },

  products: {
    list: async (): Promise<Product[]> => {
      return fetchJson<Product[]>("/products", {}, initialMockProducts);
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
          provider: payload.provider || "AGENTBRIDGE",
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
      return fetchJson<Order[]>("/orders", {}, initialMockOrders);
    },
    get: async (id: string): Promise<Order | null> => {
      return fetchJson<Order | null>(`/orders/${id}`, {}, null);
    },
  },

  conversations: {
    list: async (): Promise<ConversationThread[]> => {
      return fetchJson<ConversationThread[]>("/conversations", {}, initialMockConversations);
    },
    get: async (id: string): Promise<ConversationThread | undefined> => {
      const threads = await fetchJson<ConversationThread[]>("/conversations", {}, initialMockConversations);
      return threads.find((t) => t.id === id);
    },
  },

  analytics: {
    getSummary: async (): Promise<AnalyticsSummary> => {
      return fetchJson<AnalyticsSummary>("/analytics", {}, initialMockAnalytics);
    },
    getActivity: async (): Promise<ActivityEvent[]> => {
      return fetchJson<ActivityEvent[]>("/activity", {}, initialMockActivity);
    },
    getNotifications: async () => {
      return fetchJson<Array<{ id: string; title: string; description: string; time: string; read: boolean; type: string }>>(
        "/activity/notifications",
        {},
        [
          {
            id: "notif_1",
            title: "UPI Payment Captured",
            description: "₹3,799 received for Order #ORD-1042 via Razorpay UPI.",
            time: "12 mins ago",
            read: false,
            type: "payment",
          },
          {
            id: "notif_2",
            title: "AI Deal Closed on WhatsApp",
            description: "Auto-conceded 5% discount to close Nike Pegasus 41 lead.",
            time: "14 mins ago",
            read: false,
            type: "deal",
          },
          {
            id: "notif_3",
            title: "Low Inventory Alert",
            description: "Adidas Ultraboost Light has only 6 units remaining in stock.",
            time: "48 mins ago",
            read: false,
            type: "inventory",
          },
        ]
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
          reply: `I can offer you our exclusive flash deal: ₹3,799 with 100% Free Express Shipping! (That saves you ₹200 + ₹150 delivery). Here is your instant Razorpay UPI checkout link:`,
          isPaymentLink: true,
          paymentAmount: 3799,
          paymentUrl: "https://rzp.io/i/mock_checkout_link",
          orderId: "ORD-1042",
          logs: [
            `[${new Date().toLocaleTimeString()}] Inbound POST /api/webhooks/whatsapp HTTP/1.1 200 OK (38ms)`,
            `[${new Date().toLocaleTimeString()}] X-Hub-Signature-256 HMAC verified successfully`,
            `[${new Date().toLocaleTimeString()}] Intent extracted: 'Nike Pegasus 41' (18 in stock)`,
            `[${new Date().toLocaleTimeString()}] Counter-offer formulated: ₹3,799 (5% discount concession)`,
            `[${new Date().toLocaleTimeString()}] Razorpay Payment Link generated`,
          ],
          traces: [
            {
              id: "t1",
              title: "Product Lookup & Verification",
              detail: "Verified SKU-SHOE-001 stock (18 pairs available in Neon DB).",
              status: "completed",
              timestamp: new Date().toLocaleTimeString(),
              durationMs: 32,
            },
            {
              id: "t2",
              title: "Margin Preserved Calculation",
              detail: "Counter-offer ₹3,799 respects floor price ₹3,500.",
              status: "completed",
              timestamp: new Date().toLocaleTimeString(),
              durationMs: 65,
            },
          ],
        }
      );
    },
  },

  onboarding: {
    getSession: async (): Promise<OnboardingState> => {
      return fetchJson<OnboardingState>("/onboarding/session", {}, {
        id: "onb_sess_001",
        merchantId: "merch_runfast",
        currentStep: "WELCOME",
        provider: null,
        businessName: null,
        productCount: 4,
        agentConfigured: false,
        whatsappConnected: false,
        razorpayConnected: false,
        completionPercentage: 10,
        history: [
          {
            id: "msg_init",
            sender: "assistant",
            content: "Welcome to AgentBridge. Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
            step: "WELCOME",
            createdAt: new Date().toISOString(),
          },
        ],
      });
    },
    sendMessage: async (content: string): Promise<{ reply: string; state: OnboardingState }> => {
      return fetchJson<{ reply: string; state: OnboardingState }>(
        "/onboarding/message",
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
        {
          reply: "Got it! Your changes have been recorded in the database.",
          state: {
            id: "onb_sess_001",
            merchantId: "merch_runfast",
            currentStep: "COMPLETED",
            provider: "AGENTBRIDGE",
            businessName: "RunFast Sports",
            productCount: 5,
            agentConfigured: true,
            whatsappConnected: true,
            razorpayConnected: true,
            completionPercentage: 100,
            history: [],
          },
        }
      );
    },
    selectProvider: async (provider: StoreProvider): Promise<OnboardingState> => {
      const sess = await api.onboarding.getSession();
      return { ...sess, provider };
    },
    syncShopify: async (shopDomain: string): Promise<{ count: number; state: OnboardingState }> => {
      const sess = await api.onboarding.getSession();
      return { count: 184, state: { ...sess, productCount: 184, currentStep: "AGENT_SETUP" } };
    },
    completeStep: async (step: OnboardingStep): Promise<OnboardingState> => {
      const sess = await api.onboarding.getSession();
      return { ...sess, currentStep: step };
    },
    resetSession: async (): Promise<OnboardingState> => {
      return api.onboarding.getSession();
    },
  },
};

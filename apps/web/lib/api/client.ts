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
} from "../types";
import {
  initialMockProducts,
  initialMockConversations,
  initialMockOrders,
  initialMockAnalytics,
  initialMockActivity,
  defaultNegotiationRules,
  defaultAgentProfile,
} from "./mock-data";

// In-browser state store for smooth simulation across refresh
class LocalStateStore {
  private get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const data = localStorage.getItem(`agentbridge_${key}`);
      if (!data || data.trim() === "" || data === "undefined" || data === "null") {
        return fallback;
      }
      return JSON.parse(data);
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`agentbridge_${key}`, JSON.stringify(value));
    } catch {}
  }

  getOnboardingState(): OnboardingState {
    return this.get<OnboardingState>("onboarding_session", {
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
          content: "Welcome to AgentBridge. Let's get your AI-native storefront ready in 3 minutes. What is your business called?",
          step: "WELCOME",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  saveOnboardingState(state: OnboardingState): void {
    this.set("onboarding_session", state);
  }

  getProducts(): Product[] {
    return this.get<Product[]>("products", initialMockProducts);
  }

  saveProducts(products: Product[]): void {
    this.set("products", products);
  }

  getConversations(): ConversationThread[] {
    return this.get<ConversationThread[]>("conversations", initialMockConversations);
  }

  saveConversations(conversations: ConversationThread[]): void {
    this.set("conversations", conversations);
  }

  getOrders(): Order[] {
    return this.get<Order[]>("orders", initialMockOrders);
  }

  saveOrders(orders: Order[]): void {
    this.set("orders", orders);
  }

  getRules(): NegotiationRules {
    return this.get<NegotiationRules>("rules", defaultNegotiationRules);
  }

  saveRules(rules: NegotiationRules): void {
    this.set("rules", rules);
  }

  getAgent(): AgentProfile {
    return this.get<AgentProfile>("agent_profile", defaultAgentProfile);
  }

  saveAgent(agent: AgentProfile): void {
    this.set("agent_profile", agent);
  }

  getAnalytics(): AnalyticsSummary {
    return this.get<AnalyticsSummary>("analytics", initialMockAnalytics);
  }

  getActivity(): ActivityEvent[] {
    return this.get<ActivityEvent[]>("activity", initialMockActivity);
  }
}

export const localStore = new LocalStateStore();

// Typed API modules
export const api = {
  onboarding: {
    getSession: async (): Promise<OnboardingState> => {
      return localStore.getOnboardingState();
    },

    sendMessage: async (content: string): Promise<{ reply: string; state: OnboardingState }> => {
      const state = localStore.getOnboardingState();
      const userMsgId = `usr_${Date.now()}`;
      const botMsgId = `bot_${Date.now()}`;

      state.history.push({
        id: userMsgId,
        sender: "user",
        content,
        step: state.currentStep,
        createdAt: new Date().toISOString(),
      });

      let botReply = "";
      let nextStep: OnboardingStep = state.currentStep;

      // Conversational state transitions
      switch (state.currentStep) {
        case "WELCOME": {
          state.businessName = content.trim();
          nextStep = "STORE_SOURCE";
          state.completionPercentage = 25;
          botReply = `Great to meet you! "${state.businessName}" is an ideal fit for AgentBridge. Where do your products live today?`;
          break;
        }
        case "STORE_SOURCE": {
          if (content.toLowerCase().includes("shopify")) {
            state.provider = "SHOPIFY";
            nextStep = "SHOPIFY_CONNECT";
            state.completionPercentage = 40;
            botReply = "Connecting with Shopify gives your AI agent direct access to real-time inventory and pricing. Enter your Shopify store domain below:";
          } else {
            state.provider = "AGENTBRIDGE";
            nextStep = "CATALOG_SETUP";
            state.completionPercentage = 40;
            botReply = "Awesome! The native AgentBridge catalog gives you instant control. You can describe your products, add them manually, or import a CSV.";
          }
          break;
        }
        case "CATALOG_SETUP": {
          // If natural language product description
          const isNike = content.toLowerCase().includes("nike") || content.toLowerCase().includes("shoe");
          const createdProduct: Product = {
            id: `prod_${Date.now()}`,
            storeId: "store_user",
            title: isNike ? "Nike Pegasus Running Shoes" : content.split(",")[0] || "Featured Product",
            sku: isNike ? "NK-PEG-RUN" : "SKU-PROD-01",
            price: 3999,
            inventory: 10,
            provider: "AGENTBRIDGE",
            aiSellingEnabled: true,
            minPrice: 3500,
            maxDiscountPercent: 12,
            description: content,
            category: "General",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const products = localStore.getProducts();
          products.unshift(createdProduct);
          localStore.saveProducts(products);

          state.productCount = products.length;
          nextStep = "AGENT_SETUP";
          state.completionPercentage = 60;
          botReply = `Got it! I structured that into "${createdProduct.title}" at ₹${createdProduct.price} with 10 units in stock. Now let's set your AI Seller Agent's negotiation boundaries. How flexible should it be on discounts?`;
          break;
        }
        case "AGENT_SETUP": {
          state.agentConfigured = true;
          nextStep = "WHATSAPP_CONNECT";
          state.completionPercentage = 75;
          botReply = "Negotiation rules saved: maximum discount 12%, floor price enforced, and bundle suggestions active. Next, connect your WhatsApp Business account so buyers can message your agent.";
          break;
        }
        case "WHATSAPP_CONNECT": {
          state.whatsappConnected = true;
          nextStep = "RAZORPAY_CONNECT";
          state.completionPercentage = 85;
          botReply = "WhatsApp Cloud API connected (+91 98765 00000). Now connect your Razorpay account so your AI agent can generate secure payment links and capture payments.";
          break;
        }
        case "RAZORPAY_CONNECT": {
          state.razorpayConnected = true;
          nextStep = "TEST";
          state.completionPercentage = 95;
          botReply = "Razorpay Test Mode connected and webhooks verified! Everything is ready. Let's run an interactive simulation to test your AI storefront.";
          break;
        }
        case "TEST": {
          nextStep = "READY";
          state.completionPercentage = 100;
          botReply = "Simulation complete! Deal negotiated and test payment link generated successfully. You are ready to launch your live store!";
          break;
        }
        case "READY":
        case "COMPLETED": {
          nextStep = "COMPLETED";
          state.completionPercentage = 100;
          botReply = "Store activated! Redirecting you to your merchant dashboard...";
          break;
        }
      }

      state.currentStep = nextStep;
      state.history.push({
        id: botMsgId,
        sender: "assistant",
        content: botReply,
        step: nextStep,
        createdAt: new Date().toISOString(),
      });

      localStore.saveOnboardingState(state);
      return { reply: botReply, state };
    },

    selectProvider: async (provider: StoreProvider): Promise<OnboardingState> => {
      const state = localStore.getOnboardingState();
      state.provider = provider;
      state.currentStep = provider === "SHOPIFY" ? "SHOPIFY_CONNECT" : "CATALOG_SETUP";
      state.completionPercentage = 40;
      state.history.push({
        id: `sel_${Date.now()}`,
        sender: "assistant",
        content: provider === "SHOPIFY" 
          ? "Connect your Shopify store by entering your store domain below. We'll automatically import your catalog and inventory."
          : "You chose the native AgentBridge catalog. Add your first product or describe your inventory to begin.",
        step: state.currentStep,
        createdAt: new Date().toISOString(),
      });
      localStore.saveOnboardingState(state);
      return state;
    },

    syncShopify: async (shopDomain: string): Promise<{ count: number; state: OnboardingState }> => {
      const state = localStore.getOnboardingState();
      state.productCount = 184;
      state.currentStep = "AGENT_SETUP";
      state.completionPercentage = 60;
      state.history.push({
        id: `sync_${Date.now()}`,
        sender: "assistant",
        content: `Successfully synchronized 184 products from ${shopDomain}! Now let's configure your AI Seller's negotiation parameters.`,
        step: "AGENT_SETUP",
        createdAt: new Date().toISOString(),
      });
      localStore.saveOnboardingState(state);
      return { count: 184, state };
    },

    completeStep: async (step: OnboardingStep): Promise<OnboardingState> => {
      const state = localStore.getOnboardingState();
      state.currentStep = step;
      localStore.saveOnboardingState(state);
      return state;
    },

    resetSession: async (): Promise<OnboardingState> => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("agentbridge_onboarding_session");
      }
      return localStore.getOnboardingState();
    },
  },

  products: {
    list: async (): Promise<Product[]> => {
      return localStore.getProducts();
    },
    create: async (payload: Partial<Product>): Promise<Product> => {
      const products = localStore.getProducts();
      const newProd: Product = {
        id: `prod_${Date.now()}`,
        storeId: "store_runfast",
        title: payload.title || "New Product",
        sku: payload.sku || `SKU-${Date.now().toString().slice(-4)}`,
        price: Number(payload.price) || 999,
        inventory: Number(payload.inventory) || 10,
        provider: payload.provider || "AGENTBRIDGE",
        aiSellingEnabled: payload.aiSellingEnabled ?? true,
        minPrice: Number(payload.minPrice) || Number(payload.price) * 0.85,
        maxDiscountPercent: Number(payload.maxDiscountPercent) || 15,
        description: payload.description || "",
        category: payload.category || "General",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.unshift(newProd);
      localStore.saveProducts(products);
      return newProd;
    },
    toggleAI: async (productId: string, enabled: boolean): Promise<Product | null> => {
      const products = localStore.getProducts();
      const item = products.find((p) => p.id === productId);
      if (item) {
        item.aiSellingEnabled = enabled;
        item.updatedAt = new Date().toISOString();
        localStore.saveProducts(products);
      }
      return item || null;
    },
  },

  conversations: {
    list: async (): Promise<ConversationThread[]> => {
      return localStore.getConversations();
    },
    get: async (id: string): Promise<ConversationThread | undefined> => {
      return localStore.getConversations().find((c) => c.id === id);
    },
  },

  orders: {
    list: async (): Promise<Order[]> => {
      return localStore.getOrders();
    },
  },

  analytics: {
    getSummary: async (): Promise<AnalyticsSummary> => {
      return localStore.getAnalytics();
    },
    getActivity: async (): Promise<ActivityEvent[]> => {
      return localStore.getActivity();
    },
  },

  settings: {
    getRules: async (): Promise<NegotiationRules> => localStore.getRules(),
    saveRules: async (rules: NegotiationRules): Promise<NegotiationRules> => {
      localStore.saveRules(rules);
      return rules;
    },
    getAgent: async (): Promise<AgentProfile> => localStore.getAgent(),
    saveAgent: async (agent: AgentProfile): Promise<AgentProfile> => {
      localStore.saveAgent(agent);
      return agent;
    },
  },
};

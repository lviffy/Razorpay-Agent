"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { OnboardingState, StoreProvider } from "@/lib/types";
import { ChatMessage } from "@/components/onboarding/chat-message";
import { ActionCard } from "@/components/onboarding/action-card";
import { LiveStorePreview } from "@/components/onboarding/live-store-preview";
import { NativeProductModal } from "@/components/onboarding/native-product-modal";
import { ShopifySyncCard } from "@/components/onboarding/shopify-sync-card";
import { SimulatorModal } from "@/components/onboarding/simulator-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Store,
  Layers,
  ShieldCheck,
  Check,
  ArrowRight,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.history, loading]);

  const loadSession = async () => {
    const s = await api.onboarding.getSession();
    setState(s);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setInputValue("");
    try {
      const res = await api.onboarding.sendMessage(textToSend);
      setState(res.state);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvider = async (provider: StoreProvider) => {
    setLoading(true);
    const updated = await api.onboarding.selectProvider(provider);
    setState(updated);
    setLoading(false);
  };

  const handleSaveNativeProduct = async (productData: any) => {
    setLoading(true);
    await api.products.create(productData);
    const updated = await api.onboarding.sendMessage(
      `Added ${productData.title} at ₹${productData.price} (Floor: ₹${productData.minPrice}, 10 units)`
    );
    setState(updated.state);
    setLoading(false);
  };

  const handleShopifySyncComplete = async (shopDomain: string) => {
    setLoading(true);
    const res = await api.onboarding.syncShopify(shopDomain);
    setState(res.state);
    setLoading(false);
  };

  const handleReset = async () => {
    if (confirm("Reset onboarding session back to the beginning?")) {
      const fresh = await api.onboarding.resetSession();
      setState(fresh);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center text-xs text-surface-500 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          <span>Loading AgentBridge Setup Assistant...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      {/* Onboarding Header */}
      <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-500 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shadow-glow-blue">
              A
            </div>
            <span className="font-display font-extrabold text-base text-surface-900">
              Agent<span className="text-brand-600">Bridge</span>
            </span>
          </Link>
          <span className="text-surface-300">/</span>
          <span className="text-xs font-semibold text-surface-600 font-mono">Store Setup Assistant</span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="brand">CONVERSATIONAL SETUP</Badge>
          <button
            onClick={handleReset}
            className="text-surface-400 hover:text-surface-600 p-2 rounded-lg hover:bg-surface-100 transition-colors"
            title="Reset Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main 2-Panel Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Conversational Assistant (60%) */}
        <div className="lg:col-span-7 bg-white border border-surface-200 rounded-2xl flex flex-col h-[calc(100vh-7.5rem)] overflow-hidden shadow-card">
          {/* Assistant Sub-Header */}
          <div className="px-5 py-3.5 border-b border-surface-100 flex items-center justify-between bg-surface-50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-surface-800 font-display">AgentBridge AI Assistant</span>
            </div>
            <span className="text-[11px] text-surface-500 font-mono font-semibold">Step: {state.currentStep}</span>
          </div>

          {/* Chat Stream */}
          <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
            {state.history.map((msg, index) => {
              const isLastAssistantMessage =
                msg.sender === "assistant" && index === state.history.length - 1;

              return (
                <ChatMessage key={msg.id} sender={msg.sender} content={msg.content}>
                  {/* Step-specific inline widgets attached to the current state */}
                  {isLastAssistantMessage && (
                    <div className="mt-2 space-y-3">
                      {/* Step: STORE_SOURCE */}
                      {state.currentStep === "STORE_SOURCE" && (
                        <ActionCard
                          title="Choose your catalog source:"
                          options={[
                            {
                              id: "native",
                              label: "Create my catalog here",
                              description: "Native AgentBridge catalog with instant price floor rules.",
                              badge: "Recommended",
                              icon: <Store className="w-4 h-4" />,
                              onClick: () => handleSelectProvider("AGENTBRIDGE"),
                            },
                            {
                              id: "shopify",
                              label: "Connect Shopify Store",
                              description: "Import products, live inventory, and variants from Shopify.",
                              badge: "Optional",
                              icon: <ShoppingBag className="w-4 h-4" />,
                              onClick: () => handleSelectProvider("SHOPIFY"),
                            },
                          ]}
                        />
                      )}

                      {/* Step: SHOPIFY_CONNECT */}
                      {state.currentStep === "SHOPIFY_CONNECT" && (
                        <ShopifySyncCard onSyncComplete={handleShopifySyncComplete} />
                      )}

                      {/* Step: CATALOG_SETUP (Native) */}
                      {state.currentStep === "CATALOG_SETUP" && (
                        <ActionCard
                          title="Add products to native catalog:"
                          options={[
                            {
                              id: "add_modal",
                              label: "Add Product Manually",
                              description: "Set price, SKU, inventory, and floor price in clean modal.",
                              icon: <Layers className="w-4 h-4" />,
                              onClick: () => setNativeModalOpen(true),
                            },
                            {
                              id: "quick_text",
                              label: "Use Example: Nike Pegasus (₹3,999)",
                              description: "AI automatically structures product & discount limits.",
                              icon: <Sparkles className="w-4 h-4" />,
                              onClick: () =>
                                handleSendMessage(
                                  "Nike Air Zoom Pegasus 40 running shoes, ₹3999, 18 units, minimum price ₹3500"
                                ),
                            },
                          ]}
                        />
                      )}

                      {/* Step: AGENT_SETUP */}
                      {state.currentStep === "AGENT_SETUP" && (
                        <ActionCard
                          title="Select AI Negotiation Risk Profile:"
                          options={[
                            {
                              id: "conservative",
                              label: "Conservative (Max 8% off)",
                              description: "Firm pricing, protects gross margin aggressively.",
                              onClick: () => handleSendMessage("Conservative profile (max 8% discount)"),
                            },
                            {
                              id: "balanced",
                              label: "Balanced (Max 12% off)",
                              description: "Recommended: balances closing rate with margins.",
                              badge: "Optimal",
                              onClick: () => handleSendMessage("Balanced profile (max 12% discount)"),
                            },
                            {
                              id: "aggressive",
                              label: "Aggressive (Max 18% off)",
                              description: "Maximizes deal volume and immediate conversion.",
                              onClick: () => handleSendMessage("Aggressive profile (max 18% discount)"),
                            },
                          ]}
                        />
                      )}

                      {/* Step: WHATSAPP_CONNECT */}
                      {state.currentStep === "WHATSAPP_CONNECT" && (
                        <div className="p-4 bg-white border border-surface-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-surface-900">
                                WhatsApp Cloud API Configuration
                              </p>
                              <p className="text-[11px] text-surface-500">
                                Dedicated business channel for AI customer conversations
                              </p>
                            </div>
                            <Badge variant="brand">TEST WEBHOOK</Badge>
                          </div>
                          <Button
                            onClick={() => handleSendMessage("Connect WhatsApp Business Number +91 98765 00000")}
                            className="w-full text-xs font-bold rounded-xl"
                          >
                            Connect Business Number (+91 98765 00000)
                          </Button>
                        </div>
                      )}

                      {/* Step: RAZORPAY_CONNECT */}
                      {state.currentStep === "RAZORPAY_CONNECT" && (
                        <div className="p-4 bg-white border border-surface-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-surface-900">
                                Razorpay Payment Links & Checkout
                              </p>
                              <p className="text-[11px] text-surface-500">
                                Autonomous payment link generation with automated webhooks
                              </p>
                            </div>
                            <Badge variant="brand">TEST MODE</Badge>
                          </div>
                          <Button
                            onClick={() => handleSendMessage("Connect Razorpay API Keys in Test Mode")}
                            className="w-full text-xs font-bold rounded-xl"
                          >
                            Connect Razorpay Test Credentials (rzp_test_xxxx)
                          </Button>
                        </div>
                      )}

                      {/* Step: TEST */}
                      {state.currentStep === "TEST" && (
                        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-blue-950">
                                Ready for Storefront Verification
                              </p>
                              <p className="text-[11px] text-blue-800">
                                Test how your AI Seller Agent negotiates and issues Razorpay links.
                              </p>
                            </div>
                            <Badge variant="brand">PRE-LAUNCH</Badge>
                          </div>
                          <Button
                            onClick={() => setSimulatorOpen(true)}
                            className="w-full text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white"
                          >
                            Run Interactive Storefront Simulation
                          </Button>
                        </div>
                      )}

                      {/* Step: READY / COMPLETED */}
                      {(state.currentStep === "READY" || state.currentStep === "COMPLETED") && (
                        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3 shadow-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="text-xs font-bold text-emerald-950">
                                Store Activation Complete!
                              </p>
                              <p className="text-[11px] text-emerald-800">
                                Your AI seller is active on WhatsApp with real Razorpay links.
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push("/dashboard")}
                            variant="success"
                            className="w-full text-xs gap-2 font-bold rounded-xl"
                          >
                            <span>Open Merchant Dashboard</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ChatMessage>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-surface-500 pl-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span>AgentBridge AI is structuring your store...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-surface-200 flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your reply or describe a product... (e.g. 'RunFast Sports')"
              disabled={loading}
              className="rounded-xl"
            />
            <Button type="submit" size="md" disabled={!inputValue.trim() || loading} className="rounded-xl">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Right Panel: Real-Time Live Store Preview (40%) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <LiveStorePreview state={state} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <NativeProductModal
        open={nativeModalOpen}
        onOpenChange={setNativeModalOpen}
        onSave={handleSaveNativeProduct}
      />

      <SimulatorModal
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        onSuccess={() => handleSendMessage("Simulation completed and verified")}
      />
    </div>
  );
}


"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { OnboardingState, StoreProvider } from "@/lib/types";
import { ChatMessage } from "@/components/onboarding/chat-message";
import { ActionCard } from "@/components/onboarding/action-card";
import { LiveStorePreview, OnboardingStatusCapsule } from "@/components/onboarding/live-store-preview";
import { NativeProductModal } from "@/components/onboarding/native-product-modal";
import { ShopifySyncCard } from "@/components/onboarding/shopify-sync-card";
import { Button } from "@/components/ui/button";
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
  Sliders,
  Smartphone,
  CreditCard,
  Zap,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
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
      setTimeout(() => inputRef.current?.focus(), 100);
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
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
          <span className="font-medium text-zinc-700">Connecting to ZapAI Setup Assistant...</span>
        </div>
      </div>
    );
  }

  const stepList = [
    { key: "WELCOME", label: "Identity" },
    { key: "STORE_SOURCE", label: "Catalog" },
    { key: "AGENT_SETUP", label: "Mandate" },
    { key: "WHATSAPP_CONNECT", label: "Channel" },
    { key: "RAZORPAY_CONNECT", label: "Razorpay" },
    { key: "READY", label: "Launch" },
  ];

  return (
    <div className="min-h-screen apple-canvas flex flex-col relative text-zinc-900 selection:bg-brand-500 selection:text-white">
      {/* ── Top Floating Navigation Bar ── */}
      <header className="h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200/70">
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs group-hover:bg-brand-600 transition-colors">
              A
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900">
              Agent<span className="text-brand-600">Bridge</span>
            </span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-xs font-semibold text-zinc-600 tracking-tight">Store Setup Assistant</span>
        </div>

        {/* Center: Live Store Readiness Capsule */}
        <div className="hidden md:flex items-center gap-2">
          <OnboardingStatusCapsule state={state} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Store HUD</span>
          </button>

          <button
            onClick={handleReset}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-full hover:bg-zinc-100 transition-colors"
            title="Reset Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Centered Conversational Stage ── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-28 flex flex-col items-center">
        {/* Step Progress Pills in the Middle */}
        <div className="w-full mb-8 flex justify-center">
          <div className="flex items-center gap-0.5 sm:gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-medium text-zinc-500 overflow-x-auto no-scrollbar max-w-full shadow-2xs">
            {stepList.map((st, idx) => {
              const isCurrent = state.currentStep === st.key;
              const isPassed = state.completionPercentage > (idx * 15);
              return (
                <div key={st.key} className="flex items-center shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                      isCurrent
                        ? "bg-white text-zinc-900 font-semibold shadow-2xs border border-zinc-200/70"
                        : isPassed
                        ? "text-zinc-700 font-medium hover:text-zinc-900"
                        : "text-zinc-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isCurrent
                          ? "bg-brand-600 ring-2 ring-brand-200"
                          : isPassed
                          ? "bg-emerald-500"
                          : "bg-zinc-300"
                      }`}
                    />
                    <span>{st.label}</span>
                  </div>
                  {idx < stepList.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-zinc-300 mx-0.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversational Stream - Centered, Breathable, No Outer Box */}
        <div ref={scrollRef} className="w-full space-y-6 flex-1">
          {state.history.map((msg, index) => {
            const isLastAssistantMessage =
              msg.sender === "assistant" && index === state.history.length - 1;

            return (
              <ChatMessage key={msg.id} sender={msg.sender} content={msg.content}>
                {/* Step-specific inline widgets attached directly in the middle of the chat */}
                {isLastAssistantMessage && (
                  <div className="mt-4 space-y-3 w-full">
                    {/* Step: WELCOME (Quick Business Name Preset Chips in Middle) */}
                    {state.currentStep === "WELCOME" && (
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider pl-0.5">
                          Quick Select or Type Below:
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {[
                            { name: "RunFast Sports", icon: "👟", cat: "Athletic Shoes & Apparel" },
                            { name: "RoastLab Coffee", icon: "☕", cat: "Specialty Beans & Gear" },
                            { name: "Volt Audio", icon: "⚡", cat: "Hi-Fi Headphones" },
                            { name: "Luxe Wardrobe", icon: "👗", cat: "Designer Fashion" },
                            { name: "Glow Botanics", icon: "✨", cat: "Organic Skincare & Serums" },
                            { name: "Chronos Watches", icon: "⌚", cat: "Minimalist Timepieces" },
                            { name: "Aura Home Living", icon: "🕯️", cat: "Artisanal Decor & Scents" },
                            { name: "CyberByte Tech", icon: "🎮", cat: "Mechanical Keyboards & Gear" },
                            { name: "Matcha Bloom", icon: "🍵", cat: "Ceremonial Grade Tea" },
                            { name: "Nomad Carry", icon: "🎒", cat: "Modular Travel Packs" },
                            { name: "Urban Kicks", icon: "🛹", cat: "Streetwear & Sneakers" },
                            { name: "Optix Studio", icon: "👓", cat: "Eyewear & Sunframes" },
                          ].map((brand) => (
                            <motion.button
                              key={brand.name}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSendMessage(brand.name)}
                              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white border border-zinc-200/90 hover:border-brand-500 hover:bg-brand-50/40 text-xs font-medium text-zinc-800 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0"
                            >
                              <span className="text-xs sm:text-sm">{brand.icon}</span>
                              <span className="font-semibold text-zinc-900 group-hover:text-brand-700">
                                {brand.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-normal hidden xs:inline">
                                • {brand.cat}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step: STORE_SOURCE (Catalog Provider Choice) */}
                    {state.currentStep === "STORE_SOURCE" && (
                      <ActionCard
                        title="Select Catalog Origin:"
                        options={[
                          {
                            id: "native",
                            label: "Create Native Catalog",
                            description: "Fast in-browser setup with instant price floor & discount mandates.",
                            badge: "Recommended",
                            icon: <Store className="w-4 h-4" />,
                            onClick: () => handleSelectProvider("ZAPAI"),
                          },
                          {
                            id: "shopify",
                            label: "Sync Shopify Store",
                            description: "Connect store domain to auto-import live products, inventory & variants.",
                            badge: "Instant Import",
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

                    {/* Step: CATALOG_SETUP (Native Catalog Primitives) */}
                    {state.currentStep === "CATALOG_SETUP" && (
                      <div className="space-y-3 pt-1">
                        <ActionCard
                          title="Add Products to AI Index:"
                          options={[
                            {
                              id: "add_modal",
                              label: "Add Product Manually",
                              description: "Custom price, SKU, inventory, and floor price barrier.",
                              badge: "Modal Editor",
                              icon: <Layers className="w-4 h-4" />,
                              onClick: () => setNativeModalOpen(true),
                            },
                            {
                              id: "quick_nike",
                              label: "Use Example: Nike Pegasus 40 (₹3,999)",
                              description: "AI automatically structures product with floor price ₹3,500 (18 units).",
                              badge: "1-Click Preset",
                              icon: <Sparkles className="w-4 h-4" />,
                              onClick: () =>
                                handleSendMessage(
                                  "Nike Air Zoom Pegasus 40 running shoes, ₹3999, 18 units, minimum price ₹3500"
                                ),
                            },
                          ]}
                        />
                      </div>
                    )}

                    {/* Step: AGENT_SETUP (Interactive Segmented Risk Profile in Middle) */}
                    {state.currentStep === "AGENT_SETUP" && (
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider pl-0.5">
                          Choose Negotiation Risk Policy:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {[
                            {
                              id: "conservative",
                              title: "Conservative",
                              discount: "Max 8% Off",
                              desc: "Strict gross margin defense. Holds firm on prices.",
                              tag: "High Margin",
                              onClick: () => handleSendMessage("Conservative profile (max 8% discount)"),
                            },
                            {
                              id: "balanced",
                              title: "Balanced",
                              discount: "Max 12% Off",
                              desc: "Optimal balance between closure rate and profit.",
                              tag: "Recommended",
                              isRecommended: true,
                              onClick: () => handleSendMessage("Balanced profile (max 12% discount)"),
                            },
                            {
                              id: "aggressive",
                              title: "Aggressive",
                              discount: "Max 18% Off",
                              desc: "Maximizes deal volume and immediate conversions.",
                              tag: "High Velocity",
                              onClick: () => handleSendMessage("Aggressive profile (max 18% discount)"),
                            },
                          ].map((profile) => (
                            <motion.button
                              key={profile.id}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={profile.onClick}
                              className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                                profile.isRecommended
                                  ? "bg-brand-50/40 border-brand-300 ring-1 ring-brand-200/60 shadow-xs"
                                  : "bg-white border-zinc-200/80 hover:border-zinc-300 shadow-2xs"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-900">{profile.title}</span>
                                  <span
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                      profile.isRecommended
                                        ? "bg-brand-500 text-white"
                                        : "bg-zinc-100 text-zinc-600"
                                    }`}
                                  >
                                    {profile.tag}
                                  </span>
                                </div>
                                <p className="text-xs font-mono font-bold text-brand-600">{profile.discount}</p>
                                <p className="text-[11px] text-zinc-500 leading-snug pt-1">{profile.desc}</p>
                              </div>
                              <div className="pt-3 flex items-center justify-between text-[10px] font-medium text-zinc-400 border-t border-zinc-100 mt-2">
                                <span>Click to set</span>
                                <ArrowRight className="w-3 h-3 text-brand-600" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step: WHATSAPP_CONNECT */}
                    {state.currentStep === "WHATSAPP_CONNECT" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">
                                WhatsApp Cloud API Channel
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Autonomous 24/7 customer chat on WhatsApp
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                            WEBHOOK VERIFIED
                          </span>
                        </div>

                        <Button
                          onClick={() => handleSendMessage("Connect WhatsApp Business Number +91 98765 00000")}
                          className="w-full text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white h-10 gap-2"
                        >
                          <span>Connect Business Number (+91 98765 00000)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    )}

                    {/* Step: RAZORPAY_CONNECT */}
                    {state.currentStep === "RAZORPAY_CONNECT" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">
                                Razorpay Instant Checkout Engine
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Autonomous payment link generation & webhook settlement
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-medium">
                            TEST MODE
                          </span>
                        </div>

                        <Button
                          onClick={() => handleSendMessage("Connect Razorpay API Keys in Test Mode")}
                          className="w-full text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white h-10 gap-2"
                        >
                          <span>Connect Razorpay Test Credentials (rzp_test_xxxx)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    )}

                    {/* Step: TEST */}


                    {/* Step: READY / COMPLETED */}
                    {(state.currentStep === "READY" || state.currentStep === "COMPLETED") && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-950">
                              Store Activation Complete!
                            </p>
                            <p className="text-xs text-emerald-800">
                              Your AI Seller Agent is active on WhatsApp with live Razorpay settlements.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={async () => {
                            try {
                              const token = typeof window !== "undefined"
                                ? localStorage.getItem("zapai_auth_token") || localStorage.getItem("agentbridge_auth_token")
                                : null;
                              const headers: Record<string, string> = { "Content-Type": "application/json" };
                              if (token) {
                                headers["Authorization"] = `Bearer ${token}`;
                              }
                              const res = await fetch("/api/v1/onboarding/complete", {
                                method: "POST",
                                headers,
                                body: JSON.stringify({
                                  businessName: state.businessName || "ZapAI Store",
                                  provider: state.provider || "ZAPAI",
                                }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.storeId && typeof window !== "undefined") {
                                  localStorage.setItem("zapai_selected_store_id", data.storeId);
                                }
                              }
                            } catch (e) {}
                            router.push("/dashboard");
                          }}
                          className="w-full text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11 gap-2 shadow-xs cursor-pointer"
                        >
                          <span>Open Merchant Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </ChatMessage>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-zinc-500 pl-11 py-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              <span className="font-mono">ZapAI is configuring parameters...</span>
            </div>
          )}
        </div>
      </main>

      {/* ── Centered Floating Capsule Composer (Bottom) ── */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-3 sm:px-4 z-30 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pointer-events-auto w-full bg-white/90 backdrop-blur-xl border border-zinc-200/90 shadow-lg rounded-full p-1 sm:p-1.5 pl-3.5 sm:pl-5 flex items-center gap-1.5 sm:gap-2 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your reply or product name..."
            disabled={loading}
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none border-none"
          />

          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || loading}
            className="w-8 sm:w-9 h-8 sm:h-9 p-0 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs flex-shrink-0 disabled:opacity-40 transition-transform active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>

      {/* ── Slide-Over Store HUD Companion Drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white shadow-2xl z-50 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <div className="space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900">Live Store Telemetry</h3>
                  <button
                    onClick={() => setShowDrawer(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <LiveStorePreview state={state} />
              </div>

              <div className="pt-5 sm:pt-6 border-t border-zinc-100">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="w-full text-xs font-semibold rounded-xl gap-1.5"
                >
                  <span>Skip to Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <NativeProductModal
        open={nativeModalOpen}
        onOpenChange={setNativeModalOpen}
        onSave={handleSaveNativeProduct}
      />
    </div>
  );
}



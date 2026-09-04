"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { OnboardingState, OnboardingStep, StoreProvider, NegotiationRules } from "@/lib/types";
import Logo from "@/components/logo";
import { ChatMessage } from "@/components/onboarding/chat-message";
import { ActionCard } from "@/components/onboarding/action-card";
import { LiveStorePreview, OnboardingStatusCapsule } from "@/components/onboarding/live-store-preview";
import { NativeProductModal } from "@/components/onboarding/native-product-modal";
import { ShopifySyncCard } from "@/components/onboarding/shopify-sync-card";
import { CSVImportModal } from "@/components/products/csv-import-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";
import {
  Send,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Store,
  Layers,
  Plus,
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
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertCircle,
  Key,
  Lock,
  RefreshCw,
  Upload,
  Smile,
  Briefcase,
  Flame,
  Bot,
  MessageSquare,
  Volume2,
  Languages,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/context/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/signup?redirect=/onboarding");
    }
  }, [authLoading, isAuthenticated, router]);

  // WhatsApp Credentials State (must be filled by user)
  const [waPhone, setWaPhone] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waVerifying, setWaVerifying] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [waSuccess, setWaSuccess] = useState<string | null>(null);
  const [showWaToken, setShowWaToken] = useState(false);
  const [copiedWaUrl, setCopiedWaUrl] = useState(false);
  const [copiedWaToken, setCopiedWaToken] = useState(false);

  // Razorpay Credentials State (must be filled by user)
  const [rzpKeyId, setRzpKeyId] = useState("");
  const [rzpKeySecret, setRzpKeySecret] = useState("");
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState("");
  const [rzpVerifying, setRzpVerifying] = useState(false);
  const [rzpError, setRzpError] = useState<string | null>(null);
  const [rzpSuccess, setRzpSuccess] = useState<string | null>(null);
  const [showRzpSecret, setShowRzpSecret] = useState(false);
  const [copiedRzpUrl, setCopiedRzpUrl] = useState(false);

  // Negotiation Rules State
  const [negotiationRules, setNegotiationRules] = useState<NegotiationRules>({
    maxDiscountPercent: 12,
    minimumOrderValue: 2000,
    freeShippingAbove: 3000,
    humanApprovalAbove: 5000,
    riskProfile: "balanced",
    bundleOffersEnabled: true,
    alternativeProductsEnabled: true,
  });

  // Custom Requirements Fine-Tuning State
  const [agentSetupMode, setAgentSetupMode] = useState<"presets" | "custom">("presets");
  const [customDiscount, setCustomDiscount] = useState<number>(12);
  const [customMinOrder, setCustomMinOrder] = useState<number>(1500);
  const [customFreeShipping, setCustomFreeShipping] = useState<number>(3000);
  const [customEscalation, setCustomEscalation] = useState<number>(5000);
  const [customTone, setCustomTone] = useState<"friendly" | "professional" | "persuasive">("friendly");
  const [customUpsell, setCustomUpsell] = useState<boolean>(true);
  const [selectedTone, setSelectedTone] = useState<"friendly" | "professional" | "persuasive" | "hinglish">("friendly");
  const [savingCustomRules, setSavingCustomRules] = useState<boolean>(false);
  const [savingTone, setSavingTone] = useState<boolean>(false);
  const [completingOnboarding, setCompletingOnboarding] = useState<boolean>(false);

  // Track products added during onboarding
  const [createdProducts, setCreatedProducts] = useState<any[]>([]);

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
      const res = await api.onboarding.sendMessage(textToSend, state || undefined);
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
    const addedList = Array.isArray(productData) ? productData : [productData];
    setCreatedProducts((prev) => [...prev, ...addedList]);

    if (Array.isArray(productData)) {
      await api.products.createBulk(productData);
      const summaryTitles = productData.map((p: any) => p.title).join(", ");
      const updated = await api.onboarding.sendMessage(
        `Added ${productData.length} products to catalog: ${summaryTitles}`
      );
      setState({
        ...updated.state,
        currentStep: "CATALOG_SETUP",
        productCount: (state?.productCount || 0) + productData.length,
        completionPercentage: 45,
      });
    } else {
      await api.products.create(productData);
      const updated = await api.onboarding.sendMessage(
        `Added ${productData.title} at ₹${productData.price} (Floor: ₹${productData.minPrice || Math.round(productData.price * 0.88)}, ${productData.inventory || 10} units)`
      );
      setState({
        ...updated.state,
        currentStep: "CATALOG_SETUP",
        productCount: (state?.productCount || 0) + 1,
        completionPercentage: 45,
      });
    }
    setLoading(false);
  };

  const handleShopifySyncComplete = async (shopDomain: string, accessToken?: string) => {
    setLoading(true);
    const res = await api.onboarding.syncShopify({ shopDomain, accessToken: accessToken || "" });
    if (res.state) {
      setState(res.state);
    }
    setLoading(false);
  };

  const handleConnectWhatsApp = async () => {
    const cleanPhone = waPhone.trim();
    const cleanPhoneId = waPhoneId.trim();
    const cleanToken = waToken.trim();

    if (!cleanPhone || cleanPhone === "+91") {
      setWaError("Please enter your WhatsApp Business Phone number (e.g. +91 98765 43210).");
      return;
    }
    if (!cleanPhoneId) {
      setWaError("Please enter your Meta Phone Number ID from the Meta Developer Portal.");
      return;
    }
    if (!cleanToken) {
      setWaError("Please enter your Meta Graph API Access Token.");
      return;
    }

    setWaVerifying(true);
    setWaError(null);
    setWaSuccess(null);

    try {
      const testRes = await api.settings.testWhatsApp({
        phoneNumberId: cleanPhoneId,
        accessToken: cleanToken,
      });
      if (!testRes.success) {
        setWaError(testRes.error || "Failed to verify credentials with Meta Cloud API.");
        setWaVerifying(false);
        return;
      }

      await api.settings.saveCredentials({
        whatsappPhoneNumber: cleanPhone,
        whatsappPhoneNumberId: cleanPhoneId,
        whatsappAccessToken: cleanToken,
      });

      setWaSuccess("WhatsApp Channel verified & connected!");
      setLoading(true);
      const updated = await api.onboarding.sendMessage(
        `Connected real WhatsApp Business number ${cleanPhone} (Meta Phone ID: ${cleanPhoneId})`
      );
      setState(updated.state);
    } catch (err: any) {
      setWaError(err.message || "Failed to connect WhatsApp channel.");
    } finally {
      setWaVerifying(false);
      setLoading(false);
    }
  };

  const handleConnectRazorpay = async () => {
    const cleanKeyId = rzpKeyId.trim();
    const cleanKeySecret = rzpKeySecret.trim();

    if (!cleanKeyId) {
      setRzpError("Please enter your Razorpay Key ID (e.g. rzp_test_... or rzp_live_...).");
      return;
    }
    if (!cleanKeySecret) {
      setRzpError("Please enter your Razorpay Key Secret from your Razorpay Dashboard.");
      return;
    }

    setRzpVerifying(true);
    setRzpError(null);
    setRzpSuccess(null);

    try {
      const testRes = await api.settings.testRazorpay({
        keyId: cleanKeyId,
        keySecret: cleanKeySecret,
      });

      if (!testRes.success) {
        setRzpError(testRes.error || "Invalid Razorpay Key ID or Key Secret. Please check your credentials.");
        setRzpVerifying(false);
        return;
      }

      await api.settings.saveCredentials({
        razorpayKeyId: cleanKeyId,
        razorpayKeySecret: cleanKeySecret,
        razorpayWebhookSecret: rzpWebhookSecret.trim() || undefined,
      });

      const isLive = cleanKeyId.startsWith("rzp_live");
      setRzpSuccess(`Connected Razorpay ${isLive ? "Live Production" : "Test Sandbox"}!`);
      setLoading(true);
      const updated = await api.onboarding.sendMessage(
        `Connected real Razorpay API keys: ${cleanKeyId} (${isLive ? "Live Mode" : "Test Mode"}) with instant settlement webhooks.`
      );
      setState(updated.state);
    } catch (err: any) {
      setRzpError(err.message || "Failed to verify Razorpay credentials.");
    } finally {
      setRzpVerifying(false);
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset onboarding session back to the beginning?")) {
      const fresh = await api.onboarding.resetSession();
      setState(fresh);
    }
  };

  const handleGoToStep = (targetStep: OnboardingStep) => {
    if (!state) return;

    const stepProgress: Record<OnboardingStep, number> = {
      WELCOME: 15,
      STORE_SOURCE: 30,
      SHOPIFY_CONNECT: 35,
      CATALOG_SETUP: 40,
      AGENT_SETUP: 55,
      AGENT_TONE: 70,
      WHATSAPP_CONNECT: 80,
      RAZORPAY_CONNECT: 90,
      TEST: 95,
      READY: 100,
      COMPLETED: 100,
    };

    const stepMessages: Record<OnboardingStep, string> = {
      WELCOME: "Returned to Identity step. Enter or update your store business name below.",
      STORE_SOURCE: "Returned to Catalog selection. Choose whether to use a Native catalog, CSV upload, or Shopify sync.",
      SHOPIFY_CONNECT: "Returned to Shopify connection. Enter your domain (e.g. rohanm.in or brand.myshopify.com) and token.",
      CATALOG_SETUP: "Returned to Native Catalog setup. You can add product details, CSV, and floor prices.",
      AGENT_SETUP: "Returned to Agent Mandate step. Adjust your maximum discount caps or risk profile.",
      AGENT_TONE: "Returned to Agent Voice & Persona step. Choose how your AI Seller sounds to customers on WhatsApp.",
      WHATSAPP_CONNECT: "Returned to WhatsApp Channel step. Update your WhatsApp Business number or Meta credentials.",
      RAZORPAY_CONNECT: "Returned to Razorpay payment setup. Enter your Key ID and Secret for live settlements.",
      TEST: "Returned to verification test.",
      READY: "Setup completed! Click 'Open Merchant Dashboard' to launch.",
      COMPLETED: "Setup completed!",
    };

    const nextState: OnboardingState = {
      ...state,
      currentStep: targetStep,
      completionPercentage: stepProgress[targetStep] || state.completionPercentage,
      history: [
        ...state.history,
        {
          id: `bot_step_${Date.now()}`,
          sender: "assistant",
          content: stepMessages[targetStep] || `Navigated to ${targetStep}.`,
          step: targetStep,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setState(nextState);
    api.onboarding.syncSession(nextState);
  };

  if (authLoading || !isAuthenticated || !state) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-900" />
          <p className="text-xs text-zinc-500 font-medium tracking-tight">
            {!isAuthenticated && !authLoading ? "Redirecting to Sign Up..." : "Loading ZapAI Setup Assistant..."}
          </p>
        </div>
      </div>
    );
  }

  const stepList: Array<{ key: OnboardingStep; label: string }> = [
    { key: "WELCOME", label: "Identity" },
    { key: "STORE_SOURCE", label: "Catalog" },
    { key: "AGENT_SETUP", label: "Mandate" },
    { key: "AGENT_TONE", label: "Voice" },
    { key: "WHATSAPP_CONNECT", label: "Channel" },
    { key: "RAZORPAY_CONNECT", label: "Razorpay" },
    { key: "READY", label: "Launch" },
  ];

  return (
    <div className="min-h-screen apple-canvas flex flex-col relative text-zinc-900 selection:bg-brand-500 selection:text-white">
      {/* ── Top Floating Navigation Bar ── */}
      <header className="h-16 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200/70">
        <div className="flex items-center gap-3.5">
          <Logo size="sm" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Store HUD</span>
          </button>

          <button
            onClick={handleReset}
            className="text-zinc-400 hover:text-zinc-700 p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Reset Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Centered Conversational Stage ── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-28 flex flex-col items-center">
        {/* Step Progress Pills in the Middle (Clickable) */}
        <div className="w-full mb-8 flex justify-center">
          <div className="flex items-center gap-0.5 sm:gap-1 px-2.5 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-medium text-zinc-500 overflow-x-auto no-scrollbar max-w-full shadow-2xs">
            {stepList.map((st, idx) => {
              const isCurrent =
                state.currentStep === st.key ||
                (st.key === "STORE_SOURCE" &&
                  (state.currentStep === "SHOPIFY_CONNECT" || state.currentStep === "CATALOG_SETUP"));
              const isPassed = state.completionPercentage > (idx * 16);
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => handleGoToStep(st.key)}
                  title={`Jump to ${st.label} step`}
                  className="flex items-center shrink-0 cursor-pointer outline-none group"
                >
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                      isCurrent
                        ? "bg-white text-zinc-900 font-semibold shadow-2xs border border-zinc-200/70 ring-1 ring-brand-500/20"
                        : isPassed
                        ? "text-zinc-700 font-medium hover:bg-white/80 hover:text-zinc-900"
                        : "text-zinc-400 hover:text-zinc-600"
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
                    <ChevronRight className="w-3 h-3 text-zinc-300 mx-0.5 shrink-0 group-hover:text-zinc-400" />
                  )}
                </button>
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
                    {/* Step: WELCOME */}
                    {state.currentStep === "WELCOME" && (
                      <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600">
                        <p className="font-semibold text-zinc-900 mb-0.5">Enter Your Business Name</p>
                        Type your real store or brand name in the chat below to begin.
                      </div>
                    )}

                    {/* Step: STORE_SOURCE (Catalog Provider Choice) */}
                    {state.currentStep === "STORE_SOURCE" && (
                      <div className="space-y-3">
                        <ActionCard
                          title="Select Catalog Origin:"
                          options={[
                            {
                              id: "native",
                              label: "Create Native Catalog",
                              description: "Fast in-browser setup with instant price floor & discount mandates.",
                              badge: "Manual / Batch",
                              icon: <Store className="w-4 h-4" />,
                              onClick: () => handleSelectProvider("ZAPAI"),
                            },
                            {
                              id: "csv",
                              label: "Import from CSV File",
                              description: "Upload spreadsheet to bulk-index SKUs, stock levels, and price floors.",
                              badge: "Bulk Import",
                              icon: <Upload className="w-4 h-4" />,
                              onClick: () => {
                                handleSelectProvider("ZAPAI");
                                setCsvModalOpen(true);
                              },
                            },
                            {
                              id: "shopify",
                              label: "Sync Shopify Store",
                              description: "Connect Admin API to auto-import live products, inventory & variants.",
                              badge: "Shopify Sync",
                              icon: <ShoppingBag className="w-4 h-4" />,
                              onClick: () => handleSelectProvider("SHOPIFY"),
                            },
                          ]}
                        />
                        <div className="pt-1 flex items-center justify-start">
                          <button
                            type="button"
                            onClick={() => handleGoToStep("WELCOME")}
                            className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <span>← Change store name ({state.businessName || "My Store"})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step: SHOPIFY_CONNECT */}
                    {state.currentStep === "SHOPIFY_CONNECT" && (
                      <ShopifySyncCard
                        onSyncComplete={handleShopifySyncComplete}
                        onBack={() => handleGoToStep("STORE_SOURCE")}
                      />
                    )}

                    {/* Step: CATALOG_SETUP (Native Catalog Primitives) */}
                    {state.currentStep === "CATALOG_SETUP" && (
                      <div className="space-y-3 pt-1">
                        {createdProducts.length > 0 ? (
                          <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <h4 className="text-xs font-bold text-zinc-900">
                                  {createdProducts.length} {createdProducts.length === 1 ? "Product" : "Products"} Indexed in Catalog
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setNativeModalOpen(true)}
                                  className="text-xs h-7 px-2.5 font-semibold text-brand-700 bg-brand-50/60 hover:bg-brand-100/70 border-brand-200 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add More Items
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCsvModalOpen(true)}
                                  className="text-xs h-7 px-2.5 font-semibold text-zinc-600 hover:text-zinc-900 border-zinc-200 cursor-pointer"
                                >
                                  <Upload className="w-3 h-3 mr-1" />
                                  CSV
                                </Button>
                              </div>
                            </div>

                            {/* Product List Items */}
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {createdProducts.map((p, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-zinc-900 truncate">{p.title}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                                      <span className="font-medium text-zinc-800">₹{p.price}</span>
                                      <span>•</span>
                                      <span>Floor: ₹{p.minPrice || Math.round(Number(p.price) * 0.88)}</span>
                                      <span>•</span>
                                      <span>{p.inventory || 10} in stock</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600">
                                    {p.sku || `SKU-${idx + 1}`}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                              <button
                                type="button"
                                onClick={() => handleGoToStep("STORE_SOURCE")}
                                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>← Back to Catalog Options</span>
                              </button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleGoToStep("AGENT_SETUP")}
                                className="w-full sm:w-auto text-xs h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl cursor-pointer shadow-xs gap-1.5"
                              >
                                <span>Continue to Mandate ({createdProducts.length} added)</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ActionCard
                              title="Add Products to AI Index:"
                              options={[
                                {
                                  id: "add_modal",
                                  label: "Add Product Details",
                                  description: "Enter your product title, listed price, SKU, stock inventory, and negotiation floor.",
                                  badge: "Product Form",
                                  icon: <Layers className="w-4 h-4" />,
                                  onClick: () => setNativeModalOpen(true),
                                },
                                {
                                  id: "csv_modal",
                                  label: "Upload CSV Spreadsheet",
                                  description: "Bulk import multiple products from .csv file with auto-calculated price floors.",
                                  badge: "Spreadsheet",
                                  icon: <Upload className="w-4 h-4" />,
                                  onClick: () => setCsvModalOpen(true),
                                },
                              ]}
                            />
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleGoToStep("STORE_SOURCE")}
                                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>← Back to Catalog Options (Shopify / CSV)</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Step: AGENT_SETUP (Interactive Risk Profile & Custom Requirements) */}
                    {state.currentStep === "AGENT_SETUP" && (
                      <div className="space-y-4 pt-1">
                        {/* Mode Switcher */}
                        <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                            Configure AI Seller Policy:
                          </p>
                          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-xs">
                            <button
                              type="button"
                              onClick={() => setAgentSetupMode("presets")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                agentSetupMode === "presets"
                                  ? "bg-white text-zinc-900 shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Quick Presets
                            </button>
                            <button
                              type="button"
                              onClick={() => setAgentSetupMode("custom")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                agentSetupMode === "custom"
                                  ? "bg-white text-zinc-900 shadow-2xs"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Fine-Tune Specifics
                            </button>
                          </div>
                        </div>

                        {agentSetupMode === "presets" ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {[
                                {
                                  id: "conservative",
                                  title: "Conservative",
                                  discount: "Max 8% Off",
                                  desc: "Strict gross margin defense. Holds firm on prices.",
                                  tag: "High Margin",
                                  onClick: () => {
                                    const newRules: NegotiationRules = {
                                      maxDiscountPercent: 8,
                                      minimumOrderValue: 2000,
                                      freeShippingAbove: 4000,
                                      humanApprovalAbove: 6000,
                                      riskProfile: "conservative",
                                      bundleOffersEnabled: true,
                                      alternativeProductsEnabled: true,
                                    };
                                    setNegotiationRules(newRules);
                                    api.settings.saveRules(newRules);
                                    handleSendMessage("Conservative profile (max 8% discount)");
                                  },
                                },
                                {
                                  id: "balanced",
                                  title: "Balanced",
                                  discount: "Max 12% Off",
                                  desc: "Optimal balance between closure rate and profit.",
                                  tag: "Recommended",
                                  isRecommended: true,
                                  onClick: () => {
                                    const newRules: NegotiationRules = {
                                      maxDiscountPercent: 12,
                                      minimumOrderValue: 2000,
                                      freeShippingAbove: 3000,
                                      humanApprovalAbove: 5000,
                                      riskProfile: "balanced",
                                      bundleOffersEnabled: true,
                                      alternativeProductsEnabled: true,
                                    };
                                    setNegotiationRules(newRules);
                                    api.settings.saveRules(newRules);
                                    handleSendMessage("Balanced profile (max 12% discount)");
                                  },
                                },
                                {
                                  id: "aggressive",
                                  title: "Aggressive",
                                  discount: "Max 18% Off",
                                  desc: "Maximizes deal volume and immediate conversions.",
                                  tag: "High Velocity",
                                  onClick: () => {
                                    const newRules: NegotiationRules = {
                                      maxDiscountPercent: 18,
                                      minimumOrderValue: 2000,
                                      freeShippingAbove: 2500,
                                      humanApprovalAbove: 4000,
                                      riskProfile: "aggressive",
                                      bundleOffersEnabled: true,
                                      alternativeProductsEnabled: true,
                                    };
                                    setNegotiationRules(newRules);
                                    api.settings.saveRules(newRules);
                                    handleSendMessage("Aggressive profile (max 18% discount)");
                                  },
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

                            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                              <button
                                type="button"
                                onClick={() => handleGoToStep("STORE_SOURCE")}
                                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>← Back to Catalog Step</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAgentSetupMode("custom")}
                                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Customize exact caps & shipping rules</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Fine-Tune Requirements Interactive Builder */
                          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Max Discount Slider */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="font-semibold text-zinc-800">
                                    Max Discount Allowance:
                                  </label>
                                  <Badge variant="outline" className="font-mono text-xs font-bold text-brand-600 bg-brand-50 border-brand-200">
                                    {customDiscount}% Max
                                  </Badge>
                                </div>
                                <input
                                  type="range"
                                  min="2"
                                  max="25"
                                  step="1"
                                  value={customDiscount}
                                  onChange={(e) => setCustomDiscount(Number(e.target.value))}
                                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                />
                                <p className="text-[11px] text-zinc-400">
                                  The AI will negotiate between 0% and {customDiscount}% off, never selling below this floor.
                                </p>
                              </div>

                              {/* Free Shipping Upsell */}
                              <div className="space-y-1.5">
                                <label className="font-semibold text-zinc-800">
                                  Free Shipping Threshold:
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">₹</span>
                                  <Input
                                    type="number"
                                    value={customFreeShipping}
                                    onChange={(e) => setCustomFreeShipping(Number(e.target.value))}
                                    className="pl-6 font-mono text-xs h-8 bg-zinc-50 border-zinc-200"
                                    placeholder="3000"
                                  />
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                  AI proactively suggests add-ons when cart value is near ₹{customFreeShipping}.
                                </p>
                              </div>

                              {/* Minimum Order for Discount */}
                              <div className="space-y-1.5">
                                <label className="font-semibold text-zinc-800">
                                  Min Order for Concession:
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">₹</span>
                                  <Input
                                    type="number"
                                    value={customMinOrder}
                                    onChange={(e) => setCustomMinOrder(Number(e.target.value))}
                                    className="pl-6 font-mono text-xs h-8 bg-zinc-50 border-zinc-200"
                                    placeholder="1500"
                                  />
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                  Items below ₹{customMinOrder} are held strictly at full retail price.
                                </p>
                              </div>

                              {/* Human Escalation Threshold */}
                              <div className="space-y-1.5">
                                <label className="font-semibold text-zinc-800">
                                  Human Approval Required Above:
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">₹</span>
                                  <Input
                                    type="number"
                                    value={customEscalation}
                                    onChange={(e) => setCustomEscalation(Number(e.target.value))}
                                    className="pl-6 font-mono text-xs h-8 bg-zinc-50 border-zinc-200"
                                    placeholder="5000"
                                  />
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                  Orders above ₹{customEscalation} trigger a notification to your WhatsApp.
                                </p>
                              </div>
                            </div>

                            {/* Conversation Persona Tone */}
                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                              <label className="font-semibold text-zinc-800 block">
                                AI Seller Persona Voice:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                  {
                                    id: "friendly",
                                    title: "Friendly & Warm",
                                    icon: Smile,
                                    preview: "Hey there! 👋 Happy to help check stock and get you the best price!",
                                  },
                                  {
                                    id: "professional",
                                    title: "Professional & Precise",
                                    icon: Briefcase,
                                    preview: "Hello. Live stock confirmed. Here are the specifications and checkout details.",
                                  },
                                  {
                                    id: "persuasive",
                                    title: "High-Energy Closer",
                                    icon: Flame,
                                    preview: "High-demand item with limited stock! 🔥 I can lock in special savings right now.",
                                  },
                                ].map((t) => {
                                  const Icon = t.icon;
                                  const isSel = customTone === t.id;
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => setCustomTone(t.id as any)}
                                      className={`p-3 rounded-xl text-left border transition-all ${
                                        isSel
                                          ? "bg-brand-50/50 border-brand-400 ring-1 ring-brand-300 shadow-2xs"
                                          : "bg-zinc-50/60 border-zinc-200 hover:border-zinc-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                                        <Icon className={`w-3.5 h-3.5 ${isSel ? "text-brand-600" : "text-zinc-500"}`} />
                                        <span>{t.title}</span>
                                      </div>
                                      <p className="text-[11px] text-zinc-500 mt-1 italic leading-snug">
                                        &ldquo;{t.preview}&rdquo;
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Live Margin Calculation Shield */}
                            <div className="p-3 bg-zinc-900 text-white rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <span className="font-semibold text-zinc-200">Margin Guard Active: </span>
                                  <span className="text-zinc-400 text-[11px]">
                                    On a ₹4,000 product, AI counters at <strong className="text-emerald-400 font-mono">{formatINR(Math.round(4000 * (1 - customDiscount / 100)))}</strong> ({customDiscount}% off), protecting <strong className="text-zinc-200 font-mono">{formatINR(Math.round(4000 * (customDiscount / 100)))}</strong> dealer margin.
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Apply Button */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleGoToStep("STORE_SOURCE")}
                                className="text-xs text-zinc-500 hover:text-zinc-800 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>← Back to Catalog</span>
                              </button>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAgentSetupMode("presets")}
                                  className="text-xs h-8"
                                >
                                  Back to Presets
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={savingCustomRules || loading}
                                  onClick={async () => {
                                    setSavingCustomRules(true);
                                    try {
                                      const customRulesObj: NegotiationRules = {
                                        maxDiscountPercent: customDiscount,
                                        minimumOrderValue: customMinOrder,
                                        freeShippingAbove: customFreeShipping,
                                        humanApprovalAbove: customEscalation,
                                        riskProfile: customDiscount <= 10 ? "conservative" : customDiscount <= 15 ? "balanced" : "aggressive",
                                        bundleOffersEnabled: customUpsell,
                                        alternativeProductsEnabled: true,
                                      };
                                      setNegotiationRules(customRulesObj);
                                      await api.settings.saveRules(customRulesObj);
                                      await api.settings.saveAgent({
                                        name: "ZapAI Concierge",
                                        tone: customTone,
                                        status: "active",
                                        autoNegotiationEnabled: true,
                                        humanEscalationEnabled: true,
                                        escalationThresholdAmount: customEscalation,
                                        bundleUpsellEnabled: customUpsell,
                                      });
                                      handleSendMessage(
                                        `Configured custom mandates: Max ${customDiscount}% discount, Free shipping above ₹${customFreeShipping}, ${customTone} tone.`
                                      );
                                    } finally {
                                      setSavingCustomRules(false);
                                    }
                                  }}
                                  className="text-xs h-8 px-4 bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-xs gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                  {savingCustomRules ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Saving Requirements...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Save & Activate Custom Requirements</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step: AGENT_TONE (Voice, Persona & Conversational Style) */}
                    {state.currentStep === "AGENT_TONE" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                              <Volume2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">
                                AI Seller Voice & Communication Style
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Select how your agent talks, greets, and negotiates with shoppers on WhatsApp
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
                            Persona Engine
                          </span>
                        </div>

                        {/* Persona Selector Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            {
                              id: "friendly",
                              title: "Friendly & Warm",
                              tag: "High Retention",
                              badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
                              icon: <Smile className="w-4 h-4 text-amber-500" />,
                              desc: "Welcoming, polite, empathetic. Great for boutique, lifestyle & everyday shopping.",
                            },
                            {
                              id: "professional",
                              title: "Professional & Direct",
                              tag: "Luxury / B2B",
                              badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                              icon: <Briefcase className="w-4 h-4 text-blue-500" />,
                              desc: "Concise, precise, and authoritative. Clear numerical terms without unnecessary fluff.",
                            },
                            {
                              id: "persuasive",
                              title: "Persuasive & Sales-Driven",
                              tag: "High Velocity",
                              badgeColor: "bg-red-50 text-red-700 border-red-200",
                              icon: <Flame className="w-4 h-4 text-red-500" />,
                              desc: "Enthusiastic deal closer. Creates urgency, recommends bundles, and closes fast.",
                            },
                            {
                              id: "hinglish",
                              title: "Hinglish & Local Merchant",
                              tag: "Desi Vibe",
                              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
                              desc: "Modern Indian merchant tone blending English and conversational Hindi/Hinglish.",
                            },
                          ].map((persona) => {
                            const isSelected = selectedTone === persona.id;
                            return (
                              <div
                                key={persona.id}
                                onClick={() => setSelectedTone(persona.id as any)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? "bg-zinc-50 border-zinc-900 ring-2 ring-zinc-900/10 shadow-xs"
                                    : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {persona.icon}
                                      <span className="text-xs font-bold text-zinc-900">{persona.title}</span>
                                    </div>
                                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${persona.badgeColor}`}>
                                      {persona.tag}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 leading-snug">{persona.desc}</p>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                                  <span className="text-[10px] font-medium text-zinc-400">
                                    {isSelected ? "✓ Active Tone" : "Click to select"}
                                  </span>
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"}`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Live Dialogue Simulation Preview */}
                        <div className="p-3.5 rounded-xl bg-zinc-950 text-white space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] font-semibold text-zinc-200">
                                Live WhatsApp Conversation Preview
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                              Voice: {selectedTone.toUpperCase()}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            {/* Mock Customer Bubble */}
                            <div className="flex justify-start">
                              <div className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-xl rounded-tl-xs max-w-[85%]">
                                <p className="text-[10px] font-bold text-zinc-400 mb-0.5">Shopper on WhatsApp</p>
                                <p>
                                  {selectedTone === "hinglish"
                                    ? "Bhai thoda discount milega kya is product pe?"
                                    : selectedTone === "professional"
                                    ? "What is the best offer on this?"
                                    : selectedTone === "persuasive"
                                    ? "Is ₹1200 the final price?"
                                    : "Can I get a discount if I buy today?"}
                                </p>
                              </div>
                            </div>

                            {/* Mock AI Agent Bubble */}
                            <div className="flex justify-end">
                              <div className="bg-emerald-700 text-white px-3 py-2 rounded-xl rounded-tr-xs max-w-[88%] shadow-xs">
                                <p className="text-[10px] font-bold text-emerald-200 mb-0.5 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{state.businessName || "Your Store"} AI Seller</span>
                                </p>
                                <p className="leading-relaxed">
                                  {selectedTone === "friendly" &&
                                    "Hey there! 😊 Absolutely, I'd love to help! I can apply our special discount for you right away. Shall I generate your 1-Tap UPI link?"}
                                  {selectedTone === "professional" &&
                                    "Greetings. We can extend a preferential rate of ₹1,056 with complimentary insured dispatch. Would you like to proceed with payment?"}
                                  {selectedTone === "persuasive" &&
                                    "Great pick! That's actually flying off the shelves today. If you grab it now, I'll lock in our exclusive 12% discount at ₹1,056 before stock runs out!"}
                                  {selectedTone === "hinglish" &&
                                    "Namaste! Bilkul, aapke liye main best ₹1,056 ka special discount price apply kar raha hoon. 1-Tap UPI link send karun?"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleGoToStep("AGENT_SETUP")}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl h-10 px-3.5 text-zinc-600 hover:text-zinc-900 border-zinc-200 cursor-pointer"
                          >
                            ← Back to Discount Mandate
                          </Button>

                          <Button
                            type="button"
                            disabled={savingTone || loading}
                            onClick={async () => {
                              setSavingTone(true);
                              try {
                                await api.settings.saveAgent({
                                  name: `${state.businessName || "Store"} AI Concierge`,
                                  tone: selectedTone === "hinglish" ? "friendly" : selectedTone,
                                  status: "active",
                                  autoNegotiationEnabled: true,
                                  humanEscalationEnabled: true,
                                  escalationThresholdAmount: customEscalation,
                                  bundleUpsellEnabled: true,
                                });
                                handleGoToStep("WHATSAPP_CONNECT");
                              } finally {
                                setSavingTone(false);
                              }
                            }}
                            className="w-full sm:w-auto text-xs font-bold rounded-xl h-10 px-5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs gap-1.5 cursor-pointer disabled:opacity-60"
                          >
                            {savingTone ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving Voice...</span>
                              </>
                            ) : (
                              <>
                                <span>Lock Voice & Continue to WhatsApp</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step: WHATSAPP_CONNECT */}
                    {state.currentStep === "WHATSAPP_CONNECT" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">
                                Connect WhatsApp Business Cloud API
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Connect your Meta WhatsApp number for autonomous 24/7 AI selling
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                            Meta Graph v19.0
                          </span>
                        </div>

                        {/* WhatsApp Inputs */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                              <span>WhatsApp Business Phone Number</span>
                              <span className="text-[10px] text-zinc-400 font-normal">With country code</span>
                            </label>
                            <Input
                              type="tel"
                              value={waPhone}
                              onChange={(e) => setWaPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="text-xs font-mono"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                                <span>Meta Phone Number ID</span>
                              </label>
                              <Input
                                value={waPhoneId}
                                onChange={(e) => setWaPhoneId(e.target.value)}
                                placeholder="Enter Meta Phone Number ID"
                                className="text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                                <span>Meta Access Token</span>
                              </label>
                              <div className="relative">
                                <Input
                                  type={showWaToken ? "text" : "password"}
                                  value={waToken}
                                  onChange={(e) => setWaToken(e.target.value)}
                                  placeholder="Enter Meta Graph API Token"
                                  className="text-xs font-mono pr-8"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowWaToken(!showWaToken)}
                                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700"
                                >
                                  {showWaToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Meta Webhook Endpoint Box */}
                          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
                            <p className="text-[11px] font-semibold text-zinc-700">Meta Webhook Configuration (for Meta App Settings):</p>
                            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-mono text-zinc-600">
                              <span className="truncate mr-2">https://razorpay-agent-production.up.railway.app/webhooks/whatsapp</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("https://razorpay-agent-production.up.railway.app/webhooks/whatsapp");
                                  setCopiedWaUrl(true);
                                  setTimeout(() => setCopiedWaUrl(false), 2000);
                                }}
                                className="text-zinc-500 hover:text-zinc-900 shrink-0 font-sans text-[10px] font-semibold flex items-center gap-1"
                              >
                                {copiedWaUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                {copiedWaUrl ? "Copied" : "Copy URL"}
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                              <span>Verify Token: <span className="text-zinc-800 font-bold">zapai_meta_webhook_secret_2026</span></span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("zapai_meta_webhook_secret_2026");
                                  setCopiedWaToken(true);
                                  setTimeout(() => setCopiedWaToken(false), 2000);
                                }}
                                className="text-brand-600 hover:underline font-sans text-[10px]"
                              >
                                {copiedWaToken ? "Copied!" : "Copy Token"}
                              </button>
                            </div>
                          </div>

                          {waError && (
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{waError}</span>
                            </div>
                          )}

                          {waSuccess && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>{waSuccess}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleGoToStep("AGENT_TONE")}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl h-10 px-3.5 text-zinc-600 hover:text-zinc-900 border-zinc-200 cursor-pointer"
                          >
                            ← Back to Agent Voice
                          </Button>

                          <Button
                            type="button"
                            onClick={handleConnectWhatsApp}
                            disabled={waVerifying || loading}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white h-10 px-5 gap-2 cursor-pointer shadow-xs"
                          >
                            {waVerifying ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifying Meta Cloud API...</span>
                              </>
                            ) : (
                              <>
                                <span>Verify & Connect WhatsApp Channel</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step: RAZORPAY_CONNECT */}
                    {state.currentStep === "RAZORPAY_CONNECT" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-900">
                                Connect Razorpay Payment Gateway
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                Enter your real Key ID & Secret for autonomous UPI link creation & webhooks
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${rzpKeyId.startsWith("rzp_live") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200/60"}`}>
                            {rzpKeyId.startsWith("rzp_live") ? "LIVE PRODUCTION" : "TEST / LIVE MODE"}
                          </span>
                        </div>

                        {/* Razorpay Inputs */}
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                              <span>Razorpay Key ID</span>
                              <span className="text-[10px] text-zinc-400 font-normal">rzp_test_... or rzp_live_...</span>
                            </label>
                            <Input
                              value={rzpKeyId}
                              onChange={(e) => setRzpKeyId(e.target.value)}
                              placeholder="Enter your Razorpay Key ID"
                              className="text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                              <span>Razorpay Key Secret</span>
                              <span className="text-[10px] text-zinc-400 font-normal">From Razorpay Dashboard API Keys</span>
                            </label>
                            <div className="relative">
                              <Input
                                type={showRzpSecret ? "text" : "password"}
                                value={rzpKeySecret}
                                onChange={(e) => setRzpKeySecret(e.target.value)}
                                placeholder="Enter Razorpay Key Secret"
                                className="text-xs font-mono pr-8"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRzpSecret(!showRzpSecret)}
                                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700"
                              >
                                {showRzpSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                              <span>Razorpay Webhook Secret</span>
                              <span className="text-[10px] text-zinc-400 font-normal">Optional / HMAC verification</span>
                            </label>
                            <Input
                              value={rzpWebhookSecret}
                              onChange={(e) => setRzpWebhookSecret(e.target.value)}
                              placeholder="Enter Webhook Secret (optional)"
                              className="text-xs font-mono"
                            />
                          </div>

                          {/* Razorpay Webhook Endpoint Box */}
                          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
                            <p className="text-[11px] font-semibold text-zinc-700">Webhook Endpoint URL (configure in Razorpay Dashboard):</p>
                            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-mono text-zinc-600">
                              <span className="truncate mr-2">https://razorpay-agent-production.up.railway.app/webhooks/razorpay</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("https://razorpay-agent-production.up.railway.app/webhooks/razorpay");
                                  setCopiedRzpUrl(true);
                                  setTimeout(() => setCopiedRzpUrl(false), 2000);
                                }}
                                className="text-zinc-500 hover:text-zinc-900 shrink-0 font-sans text-[10px] font-semibold flex items-center gap-1"
                              >
                                {copiedRzpUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                {copiedRzpUrl ? "Copied" : "Copy URL"}
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                              Events to subscribe: <span className="font-mono text-zinc-700">payment.captured</span>, <span className="font-mono text-zinc-700">payment.failed</span>, <span className="font-mono text-zinc-700">order.paid</span>
                            </p>
                          </div>

                          {rzpError && (
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{rzpError}</span>
                            </div>
                          )}

                          {rzpSuccess && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>{rzpSuccess}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleGoToStep("WHATSAPP_CONNECT")}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl h-10 px-3.5 text-zinc-600 hover:text-zinc-900 border-zinc-200 cursor-pointer"
                          >
                            ← Back to WhatsApp
                          </Button>

                          <Button
                            type="button"
                            onClick={handleConnectRazorpay}
                            disabled={rzpVerifying || loading}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white h-10 px-5 gap-2 cursor-pointer shadow-xs"
                          >
                            {rzpVerifying ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Validating with Razorpay API...</span>
                              </>
                            ) : (
                              <>
                                <span>Verify & Connect Razorpay Credentials</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}

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

                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleGoToStep("AGENT_SETUP")}
                            className="w-full sm:w-auto text-xs font-semibold rounded-xl h-11 px-4 text-zinc-700 hover:text-zinc-900 border-zinc-200 cursor-pointer"
                          >
                            ← Edit Rules & Mandates
                          </Button>

                          <Button
                            disabled={completingOnboarding}
                            onClick={async () => {
                              setCompletingOnboarding(true);
                              try {
                                const token = typeof window !== "undefined"
                                  ? localStorage.getItem("zapai_auth_token") || localStorage.getItem("agentbridge_auth_token")
                                  : null;
                                const headers: Record<string, string> = { "Content-Type": "application/json" };
                                if (token) {
                                  headers["Authorization"] = `Bearer ${token}`;
                                }
                                const payload = {
                                  businessName: state?.businessName || "ZapAI Store",
                                  provider: state?.provider || "ZAPAI",
                                  phone: waPhone || "+91 98765 00000",
                                  whatsappPhoneNumber: waPhone,
                                  whatsappPhoneNumberId: waPhoneId,
                                  whatsappAccessToken: waToken,
                                  whatsappWebhookVerifyToken: "zapai_meta_webhook_secret_2026",
                                  razorpayKeyId: rzpKeyId,
                                  razorpayKeySecret: rzpKeySecret,
                                  razorpayWebhookSecret: rzpWebhookSecret,
                                  maxDiscountPercent: negotiationRules.maxDiscountPercent,
                                  minimumOrderValue: negotiationRules.minimumOrderValue,
                                  freeShippingAbove: negotiationRules.freeShippingAbove,
                                  humanApprovalAbove: negotiationRules.humanApprovalAbove,
                                  riskProfile: negotiationRules.riskProfile,
                                  products: createdProducts,
                                };
                                const res = await fetch("/api/v1/onboarding/complete", {
                                  method: "POST",
                                  headers,
                                  body: JSON.stringify(payload),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  if (data.token && typeof window !== "undefined") {
                                    localStorage.setItem("zapai_auth_token", data.token);
                                    document.cookie = `zapai_auth_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
                                  }
                                  if (data.storeId && typeof window !== "undefined") {
                                    localStorage.setItem("zapai_selected_store_id", data.storeId);
                                  }
                                  await Promise.all([
                                    api.settings.saveRules(negotiationRules),
                                    api.profile.save({ storeName: state?.businessName || "ZapAI Store", phone: waPhone }),
                                    api.settings.saveCredentials({
                                      razorpayKeyId: rzpKeyId,
                                      razorpayKeySecret: rzpKeySecret,
                                      razorpayWebhookSecret: rzpWebhookSecret,
                                      whatsappPhoneNumber: waPhone,
                                      whatsappPhoneNumberId: waPhoneId,
                                      whatsappAccessToken: waToken,
                                      whatsappWebhookVerifyToken: "zapai_meta_webhook_secret_2026",
                                    }),
                                  ]);
                                  await refreshUser();
                                  router.replace("/dashboard");
                                } else {
                                  console.error("Onboarding complete failed:", res.status);
                                }
                              } catch (e) {
                                console.error("Onboarding complete error:", e);
                              } finally {
                                setCompletingOnboarding(false);
                              }
                            }}
                            className="w-full sm:flex-1 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-11 gap-2 shadow-xs cursor-pointer disabled:opacity-70"
                          >
                            {completingOnboarding ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Launching Merchant Dashboard...</span>
                              </>
                            ) : (
                              <>
                                <span>Open Merchant Dashboard</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </ChatMessage>
            );
          })}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex gap-3 items-center pl-1 py-1"
            >
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                Z
              </div>
              <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs text-zinc-600">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-700" />
                <span className="text-[11.5px] font-medium text-zinc-600">ZapAI is configuring...</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── Centered Floating Capsule Composer with Context Chips (Bottom) ── */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-3 sm:px-4 z-30 pointer-events-none pb-[env(safe-area-inset-bottom)] space-y-2">
        {/* Quick Context Prompt Chips */}
        <div className="pointer-events-auto flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { label: "💡 What is ZapAI?", query: "What is ZapAI and how does it work?" },
            { label: "🛡️ How does negotiation work?", query: "How does the AI margin negotiation engine work?" },
            { label: "⚡ Razorpay settlements?", query: "How do instant Razorpay settlements work?" },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip.query)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-zinc-200/90 text-zinc-600 hover:text-zinc-900 hover:border-brand-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

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
            placeholder="Ask anything about ZapAI or type your response..."
            disabled={loading}
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none border-none"
          />

          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim() || loading}
            className="w-8 sm:w-9 h-8 sm:h-9 p-0 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs flex-shrink-0 disabled:opacity-40 transition-transform active:scale-95 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
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
                  onClick={async () => {
                    try {
                      const token = typeof window !== "undefined"
                        ? localStorage.getItem("zapai_auth_token") || localStorage.getItem("agentbridge_auth_token")
                        : null;
                      const headers: Record<string, string> = { "Content-Type": "application/json" };
                      if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                      }
                      const payload = {
                        businessName: state?.businessName || "ZapAI Store",
                        provider: state?.provider || "ZAPAI",
                        phone: waPhone || "+91 98765 00000",
                        whatsappPhoneNumber: waPhone,
                        whatsappPhoneNumberId: waPhoneId,
                        whatsappAccessToken: waToken,
                        whatsappWebhookVerifyToken: "zapai_meta_webhook_secret_2026",
                        razorpayKeyId: rzpKeyId,
                        razorpayKeySecret: rzpKeySecret,
                        razorpayWebhookSecret: rzpWebhookSecret,
                        maxDiscountPercent: negotiationRules.maxDiscountPercent,
                        minimumOrderValue: negotiationRules.minimumOrderValue,
                        freeShippingAbove: negotiationRules.freeShippingAbove,
                        humanApprovalAbove: negotiationRules.humanApprovalAbove,
                        riskProfile: negotiationRules.riskProfile,
                        products: createdProducts,
                      };
                      const res = await fetch("/api/v1/onboarding/complete", {
                        method: "POST",
                        headers,
                        body: JSON.stringify(payload),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.token && typeof window !== "undefined") {
                          localStorage.setItem("zapai_auth_token", data.token);
                          document.cookie = `zapai_auth_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
                        }
                        if (data.storeId && typeof window !== "undefined") {
                          localStorage.setItem("zapai_selected_store_id", data.storeId);
                        }
                        await Promise.all([
                          api.settings.saveRules(negotiationRules),
                          api.profile.save({ storeName: state?.businessName || "ZapAI Store", phone: waPhone }),
                          api.settings.saveCredentials({
                            razorpayKeyId: rzpKeyId,
                            razorpayKeySecret: rzpKeySecret,
                            razorpayWebhookSecret: rzpWebhookSecret,
                            whatsappPhoneNumber: waPhone,
                            whatsappPhoneNumberId: waPhoneId,
                            whatsappAccessToken: waToken,
                            whatsappWebhookVerifyToken: "zapai_meta_webhook_secret_2026",
                          }),
                        ]);
                        await refreshUser();
                      }
                    } catch (e) {}
                    router.replace("/dashboard");
                  }}
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

      <CSVImportModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        onImportComplete={handleSaveNativeProduct}
      />
    </div>
  );
}



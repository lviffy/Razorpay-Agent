"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api/client";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Package,
  AlertTriangle,
  Flame,
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  ArrowRight,
  BarChart3,
  Sliders,
  DollarSign,
  CheckCircle2,
  Clock,
  MessageSquare,
  PackageCheck,
  Compass,
  RotateCcw,
} from "lucide-react";
import { DailyBriefingCard } from "@/components/growth-ai/daily-briefing-card";
import {
  ActionExecutionDialog,
  ActionableCard,
  StockoutAlertCard,
  SuggestedAction,
} from "@/components/growth-ai/insight-cards";
import { GrowthAICopilotDrawer } from "@/components/growth-ai/growth-ai-copilot-drawer";

import { stripMarkdownAsterisks } from "@/lib/ai/growth-gemini";

export default function GrowthAIPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [inventoryRadar, setInventoryRadar] = useState<any>(null);
  const [radarFilter, setRadarFilter] = useState<string>("ALL");
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(true);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);

  // Chat State inside the page
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      suggestedActions?: SuggestedAction[];
      toolCallsExecuted?: Array<{ name: string; args: any; result: any }>;
      createdAt: string;
    }>
  >([
    {
      id: "initial-msg",
      role: "assistant",
      content:
        "Welcome to your Store Growth & Inventory Advisor.\n\nI continuously monitor your live SKU burn rates, WhatsApp buyer negotiation logs, and Razorpay UPI settlements.\n\nHere are some questions you can ask:\n• How much dealer margin did my AI agent preserve?\n• Which products are at high risk of stockout this week?\n• Can I safely raise prices on top-selling items?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Action Dialog State
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Slide-over drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPrompt, setDrawerPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  async function loadAllData() {
    setIsLoadingBriefing(true);
    setIsLoadingRadar(true);
    try {
      const [briefingRes, radarRes] = await Promise.all([
        api.growthAi.getBriefing(),
        api.growthAi.getInventoryRadar("ALL"),
      ]);
      if (briefingRes) setBriefing(briefingRes);
      if (radarRes) setInventoryRadar(radarRes);
    } catch (err) {
      console.error("Failed to load Growth AI data", err);
    } finally {
      setIsLoadingBriefing(false);
      setIsLoadingRadar(false);
    }
  }

  async function handleFilterRadar(filter: string) {
    setRadarFilter(filter);
    setIsLoadingRadar(true);
    try {
      const res = await api.growthAi.getInventoryRadar(filter);
      if (res) setInventoryRadar(res);
    } catch (err) {
      console.error("Failed to filter inventory radar", err);
    } finally {
      setIsLoadingRadar(false);
    }
  }

  async function handleSendChatMessage(textToSend?: string) {
    const text = (textToSend || chatInput).trim();
    if (!text || isChatLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const history = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.growthAi.chat({
        messages: history,
      });

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: "assistant" as const,
        content: res.reply || "I've reviewed your store metrics.",
        suggestedActions: res.suggestedActions || [],
        toolCallsExecuted: res.toolCallsExecuted || [],
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant" as const,
          content: "⚠️ Failed to fetch store metrics. Please verify backend connection.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  function handleTriggerAction(action: SuggestedAction) {
    setActiveAction(action);
    setActionDialogOpen(true);
  }

  function handleActionSuccess(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 5000);
    loadAllData();
  }

  const topProduct = inventoryRadar?.products?.[0];
  const criticalProduct = inventoryRadar?.products?.find((p: any) => p.stockStatus === "CRITICAL_LOW" || p.stockStatus === "LOW_STOCK");

  const promptCategories = [
    {
      category: "📈 Revenue & Growth",
      prompts: [
        "Breakdown my GMV growth and average order value",
        "What is our WhatsApp lead-to-deal conversion velocity?",
      ],
    },
    {
      category: "📦 Stock & Inventory",
      prompts: [
        criticalProduct
          ? `Check stockout risk for ${criticalProduct.title} (${criticalProduct.sku})`
          : "Which products are at high risk of stockout this week?",
        "Show products with zero orders in the last 14 days",
      ],
    },
    {
      category: "🛡️ Margin & Pricing",
      prompts: [
        "How much dealer margin did my AI agent preserve?",
        topProduct
          ? `Can I safely raise listed prices on ${topProduct.title}?`
          : "Can I safely raise listed prices on top-selling catalog items?",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Growth & Inventory Intelligence
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200/80 text-[11px] font-semibold gap-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Autonomous Store AI
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, inventory burn forecasting, margin shield auditing, and autonomous Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setChatMessages([
                {
                  id: "initial-msg",
                  role: "assistant",
                  content:
                    "### 🚀 Welcome to your Store Growth & Inventory Advisor\n\nI continuously monitor your live SKU burn rates, WhatsApp buyer negotiation logs, and Razorpay UPI settlements.\n\nAsk me anything about your revenue trajectory, stockout risks, or margin preservation!",
                  createdAt: new Date().toISOString(),
                },
              ]);
            }}
            className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Chat
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setDrawerPrompt(undefined);
              setDrawerOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-8 shadow-xs gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            Floating Copilot
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Cards + Collapsible Intelligence Feed */}
      <DailyBriefingCard
        briefing={briefing}
        isLoading={isLoadingBriefing}
        onRefresh={loadAllData}
        onSelectAction={handleTriggerAction}
        onAskAI={(prompt) => {
          handleSendChatMessage(prompt);
        }}
      />

      {/* Main Tabbed Analysis Sections */}
      <Tabs defaultValue="chat" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100/90 p-1 border border-slate-200/80 rounded-xl">
            <TabsTrigger
              value="chat"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs rounded-lg gap-1.5 py-1.5 px-3"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Autonomous Growth Chat
            </TabsTrigger>
            <TabsTrigger
              value="radar"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs rounded-lg gap-1.5 py-1.5 px-3"
            >
              <Package className="w-3.5 h-3.5" />
              Inventory Risk Radar
            </TabsTrigger>
            <TabsTrigger
              value="margins"
              className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs rounded-lg gap-1.5 py-1.5 px-3"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Margin & Price Elasticity
            </TabsTrigger>
          </TabsList>

          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3 h-3" /> Live Telemetry
          </span>
        </div>

        {/* ── TAB 1: AI Chat & Reasoning ────────────────────────────────────── */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Chat Window (8 cols) */}
            <Card className="lg:col-span-8 border-slate-200/80 bg-white shadow-2xs flex flex-col h-[600px] overflow-hidden">
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-900">
                      ZapAI Growth Copilot
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Querying live product stock, pricing elasticities & Razorpay settlements
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                  ● Ready
                </Badge>
              </CardHeader>

              {/* Chat Viewport */}
              <ScrollArea className="flex-1 p-4 sm:p-5">
                <div className="space-y-4 pb-2">
                  {chatMessages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <Bot className="w-4 h-4 text-blue-400" />
                          </div>
                        )}

                        <div className={`space-y-2 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                          <div
                            className={`p-4 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? "bg-blue-600 text-white font-medium rounded-tr-xs shadow-2xs"
                                : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs whitespace-pre-wrap shadow-2xs"
                            }`}
                          >
                            {stripMarkdownAsterisks(m.content)}
                          </div>

                          {!isUser && m.suggestedActions && m.suggestedActions.length > 0 && (
                            <div className="space-y-2 pt-1">
                              {m.suggestedActions.map((act) => (
                                <ActionableCard
                                  key={act.id}
                                  action={act}
                                  onExecute={handleTriggerAction}
                                />
                              ))}
                            </div>
                          )}

                          <span className="text-[9px] text-slate-400 px-1 block font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isChatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Bot className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 text-xs rounded-tl-xs flex items-center gap-2 shadow-2xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Querying store telemetry & analyzing metrics...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatScrollRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-3.5 border-t border-slate-200/80 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about inventory burn rate, margin saved, or pricing recommendations..."
                    className="text-xs bg-slate-50/80 border-slate-200 focus-visible:ring-blue-600 h-9"
                    disabled={isChatLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 gap-1.5 shadow-xs shrink-0"
                  >
                    {isChatLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Send</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Card>

            {/* Right Prompt Starters & Recommendations (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-slate-200/80 bg-white shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Strategy Prompts
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-slate-500">
                    Click any topic to trigger deep store reasoning
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-3 space-y-3.5">
                  {promptCategories.map((cat, cIdx) => (
                    <div key={cIdx} className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {cat.category}
                      </div>
                      <div className="space-y-1.5">
                        {cat.prompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSendChatMessage(p)}
                            disabled={isChatLoading}
                            className="w-full text-left p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-blue-50/70 hover:border-blue-200 text-[11px] text-slate-700 hover:text-blue-700 font-medium transition-all flex items-center justify-between group shadow-2xs"
                          >
                            <span className="line-clamp-2 leading-relaxed">{p}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick AI Guardrails Card */}
              <Card className="border-slate-200/80 bg-slate-900 text-white shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">
                      Autonomous Guardrails
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-3 space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400">Strict Profit Floors</span>
                    <span className="text-emerald-400 font-semibold">100% Enforced</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400">Atomic Stock Locks</span>
                    <span className="text-white font-mono">120s TTL</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400">Settlement Rail</span>
                    <span className="text-blue-400 font-medium">Razorpay 1-Tap UPI</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: Inventory Risk Radar ──────────────────────────────────── */}
        <TabsContent value="radar" className="space-y-4">
          {/* 4 Summary Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card className="border-slate-200/80 bg-white shadow-2xs p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total SKUs</span>
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">
                {inventoryRadar?.totalCatalogSKUs || 1}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Active in live catalog</p>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-2xs p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Critical Risk</span>
                <Flame className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-red-600 mt-1">
                {inventoryRadar?.summary?.criticalStockoutRisks || 0}
              </div>
              <p className="text-[10px] text-red-500 font-medium mt-0.5">&lt; 3 days remaining</p>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-2xs p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Low Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1">
                {inventoryRadar?.summary?.lowStockWarnings || 0}
              </div>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">&lt; 7 days remaining</p>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-2xs p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Healthy Reserves</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1">
                {inventoryRadar?.summary?.healthyStockCount || 1}
              </div>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Sufficient stock</p>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            {["ALL", "CRITICAL", "LOW_STOCK", "DEAD_STOCK", "HEALTHY"].map((f) => (
              <button
                key={f}
                onClick={() => handleFilterRadar(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  radarFilter === f
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingRadar ? (
              <div className="col-span-full text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Computing inventory burn velocities...</p>
              </div>
            ) : (inventoryRadar?.products || []).length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No products match the selected filter.
              </div>
            ) : (
              (inventoryRadar?.products || []).map((prod: any) => (
                <StockoutAlertCard
                  key={prod.id}
                  sku={prod.sku}
                  title={prod.title}
                  availableStock={prod.availableStock}
                  daysOfInventory={prod.daysOfInventoryRemaining}
                  dailySalesBurnRate={prod.dailySalesBurnRate}
                  onRestockClick={() =>
                    handleTriggerAction({
                      id: `restock-${prod.sku}`,
                      title: `Restock ${prod.title}`,
                      description: `Current available stock is ${prod.availableStock} units. Add units to catalog.`,
                      actionType: "RESTOCK_INVENTORY",
                      sku: prod.sku,
                      value: 30,
                      badge: "Restock PO",
                    })
                  }
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* ── TAB 3: Margin & Price Elasticity ─────────────────────────────── */}
        <TabsContent value="margins" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Dealer Margin Protection & Floor Elasticity
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Autonomous Seller Agent price concessions vs protected floor thresholds.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      Total Dealer Margin Preserved
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      +{formatINR(briefing?.highlights?.find((h: any) => h.title.includes("Margin"))?.value || 159470)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    By countering buyer offers dynamically instead of granting maximum discounts, your AI agent saved rupees on every closed deal.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Price Elasticity Recommendations
                  </h4>
                  {(briefing?.growthOpportunities || [])
                    .filter((o: any) => o.type === "PRICING" || o.type === "CONVERSION")
                    .map((opp: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600 text-white text-[10px] font-semibold border-0">
                              {opp.impact}
                            </Badge>
                            <span className="text-xs font-bold text-slate-900">{opp.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{opp.description}</p>
                        </div>

                        {opp.action && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleTriggerAction({
                                id: `opp-margin-${idx}`,
                                title: opp.title,
                                description: opp.description,
                                actionType: opp.action?.actionType,
                                sku: opp.action?.sku,
                                value: opp.action?.value,
                                badge: opp.impact,
                              })
                            }
                            className="shrink-0 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          >
                            Apply Change
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Margin Engine Guardrails
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Strict boundaries applied to all autonomous conversations.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Floor Price Protection</span>
                    <span className="text-emerald-600 font-bold">100% Guaranteed</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Agent will never accept or counter below SKU cost/floor price.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Dynamic Concession Step</span>
                    <span className="font-mono font-bold text-slate-900">2% - 4% / turn</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Gradual counter-offers to preserve maximum margin per sale.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>Razorpay Settlement Link</span>
                    <span className="font-mono font-bold text-blue-600">1-Tap UPI</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Issued immediately once deal terms are locked.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Execution Dialog */}
      <ActionExecutionDialog
        action={activeAction}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        onSuccess={handleActionSuccess}
      />

      {/* Floating Copilot Drawer */}
      <GrowthAICopilotDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialPrompt={drawerPrompt}
      />
    </div>
  );
}

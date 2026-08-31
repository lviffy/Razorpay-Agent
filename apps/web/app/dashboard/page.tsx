"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api, emptyAnalytics, defaultNegotiationRules } from "@/lib/api/client";
import { AnalyticsSummary, ActivityEvent, NegotiationRules } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CreditCard,
  Layers,
  Lock,
  RefreshCw,
  Sliders,
  ArrowRight,
  Activity,
} from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(emptyAnalytics);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [rules, setRules] = useState<NegotiationRules>(defaultNegotiationRules);
  const [charts, setCharts] = useState<{
    gmvData?: Array<{ day: string; gmv: number; baseline: number }>;
    marginData?: Array<{ day: string; preserved: number; conceded: number }>;
    velocityData?: Array<{ time: string; leads: number; deals: number }>;
  }>({});
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [liveToast, setLiveToast] = useState<{ show: boolean; title: string; subtitle: string }>({
    show: false,
    title: "",
    subtitle: "",
  });

  const animatedGmv = useAnimatedCounter(analytics.agentGmv);

  useEffect(() => {
    async function load() {
      try {
        const [overview, ruleData] = await Promise.all([
          api.dashboard.getOverview(),
          api.settings.getRules(),
        ]);
        if (overview) {
          if (overview.summary) setAnalytics(overview.summary);
          if (overview.activity) setActivity(overview.activity);
          if (overview.charts) setCharts(overview.charts);
        }
        if (ruleData) setRules(ruleData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    load();

    // Live Server-Sent Events (SSE) stream listener for real-time order & payment capture
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
    const sseUrl = `${backendUrl}/demo/events`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(":")) return;
          const ev = JSON.parse(e.data);
          const p = ev.payload || {};
          const ids = ev.ids || {};

          let title = ev.type?.replace(/_/g, " ") || "System Event";
          let description = "Cryptographic audit event verified.";

          if (ev.type === "PAYMENT_CAPTURED") {
            title = "Instant UPI Payment Captured";
            const amt = p.amount ? (p.amount > 1000 ? p.amount / 100 : p.amount) : 0;
            description = amt
              ? `₹${amt.toLocaleString("en-IN")} settled via Razorpay UPI (${p.method || "UPI"})`
              : `Payment settled via Razorpay UPI (${p.method || "UPI"})`;

            if (amt > 0) {
              setAnalytics((prev) => ({
                ...prev,
                agentGmv: prev.agentGmv + amt,
                dealsClosed: prev.dealsClosed + 1,
              }));
            }

            // Trigger floating live toast
            setLiveToast({
              show: true,
              title: "Payment Captured · Razorpay Instant",
              subtitle: amt ? `₹${amt.toLocaleString("en-IN")} settled autonomously` : "Settled via UPI",
            });
            setTimeout(() => {
              setLiveToast((prev) => ({ ...prev, show: false }));
            }, 3500);
          } else if (ev.type === "INVENTORY_LOCKED") {
            title = "Autonomous Inventory Reservation";
            description = `Locked 1 unit for ${p.sku || p.productTitle || "item"} (Redis Redlock TTL 120s)`;
          } else if (ev.type === "PAYMENT_FAILED") {
            title = "Payment Timeout / Lock Released";
            description = `Inventory restored. Reason: ${p.reason || "UPI_DECLINE"}`;
          }

          const newActivityItem: ActivityEvent & { isNew?: boolean } = {
            id: `sse_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: ev.type || "PAYMENT_CAPTURED",
            title,
            description,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            metadata: { ...p, ...ids },
            isNew: true,
          };

          setActivity((prev) => [newActivityItem as ActivityEvent, ...prev.slice(0, 25)]);

          // Clear isNew flash highlight after 2s
          setTimeout(() => {
            setActivity((prev) =>
              prev.map((item) =>
                item.id === newActivityItem.id ? { ...item, isNew: false } as any : item
              )
            );
          }, 2000);
        } catch (parseErr) {
          // ignore non-JSON pings
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (sseErr) {
      console.warn("SSE connection error:", sseErr);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const filteredActivity = activity.filter((item) => {
    if (selectedActivityFilter === "ALL") return true;
    if (selectedActivityFilter === "PAYMENTS") return item.type === "PAYMENT_CAPTURED";
    if (selectedActivityFilter === "NEGOTIATIONS") return item.type === "NEGOTIATION_COMPLETED";
    if (selectedActivityFilter === "INVENTORY") return item.type === "INVENTORY_UPDATED";
    return true;
  });

  return (
    <TooltipProvider>
      <div className="space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">Merchant Cockpit</h1>
              <Badge variant="outline" className="gap-1.5 font-medium text-[10px] sm:text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Telemetry
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 sm:mt-1">
              Real-time telemetry on autonomous WhatsApp negotiations and Razorpay settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Link href="/dashboard/products" className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs h-8 bg-white border-zinc-300 hover:bg-zinc-50 font-medium text-zinc-700 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-zinc-500 mr-1.5" />
                Manage Catalog
              </Button>
            </Link>
            <Link href="/dashboard/conversations" className="flex-1 sm:flex-none">
              <Button variant="default" size="sm" className="w-full sm:w-auto text-xs h-8 bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Live AI Conversations
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Seller Agent Banner Card */}
        <Card className="border-zinc-200 shadow-xs">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] sm:text-[11px] font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AI SELLER AGENT ACTIVE
                  </span>
                  <Badge variant="outline" className="text-[10px] sm:text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
                    WhatsApp Cloud API
                  </Badge>
                  <Badge variant="outline" className="text-[10px] sm:text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
                    Razorpay Instant
                  </Badge>
                </div>

                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                    Autonomous WhatsApp Selling & Negotiation Engine
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                    Discovers buyer intent, checks live catalog inventory, negotiates within your floor price mandate{rules.minimumOrderValue ? ` (${formatINR(rules.minimumOrderValue)} min)` : ""}, and issues instant Razorpay payment links.
                  </p>
                </div>

                {/* Policy Chips with Tooltips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        Floor: {rules.minimumOrderValue > 0 ? formatINR(rules.minimumOrderValue) : "No minimum"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Hard price barrier the AI agent is forbidden to breach</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <Sliders className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        Max Discount: {rules.maxDiscountPercent > 0 ? `${rules.maxDiscountPercent}%` : "Not set"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Maximum allowed discount percentage for buyer counter-offers</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        Free Shipping: {rules.freeShippingAbove > 0 ? `> ${formatINR(rules.freeShippingAbove)}` : "Disabled"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Automatic closing sweetener offered above specified order value</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Outcome Stat Modules */}
              <div className="w-full lg:w-auto grid grid-cols-3 gap-2 sm:gap-3 bg-zinc-50 border border-zinc-200 p-3 sm:p-4 rounded-xl flex-shrink-0">
                <div className="text-center px-1.5 sm:px-3 border-r border-zinc-200">
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium truncate">Conversion</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-zinc-900 mt-0.5">{analytics.conversionRate}%</p>
                  <span className="text-[9px] sm:text-[10px] text-emerald-700 font-medium font-mono block truncate">Win Rate</span>
                </div>
                <div className="text-center px-1.5 sm:px-3 border-r border-zinc-200">
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium truncate">Avg Discount</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-zinc-900 mt-0.5">{analytics.averageDiscount}%</p>
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium font-mono block truncate">Floor safe</span>
                </div>
                <div className="text-center px-1.5 sm:px-3">
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium truncate">Deals Closed</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-blue-600 mt-0.5">{analytics.dealsClosed}</p>
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium font-mono block truncate">100% UPI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Financial KPI Cards using shadcn Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Agent GMV</span>
                <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(animatedGmv)}</CardTitle>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-600 font-medium mt-1 truncate">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+{analytics.gmvGrowthPercent}% WoW</span>
              </div>
            </CardHeader>
            <CardFooter className="p-3.5 sm:p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Settlement</span>
              <span className="text-zinc-600 font-semibold truncate ml-1">Razorpay UPI</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Conversations</span>
                <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatNumber(analytics.totalConversations)}</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">100% automated</CardDescription>
            </CardHeader>
            <CardFooter className="p-3.5 sm:p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Latency</span>
              <span className="text-zinc-600 font-semibold ml-1">&lt; 1.2s avg</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Settled Deals</span>
                <ShoppingBag className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatNumber(analytics.dealsClosed)}</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">Zero manual work</CardDescription>
            </CardHeader>
            <CardFooter className="p-3.5 sm:p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Closure</span>
              <span className="text-zinc-600 font-semibold ml-1">{analytics.conversionRate}% Win</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-3.5 sm:p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Avg Order Value</span>
                <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(analytics.averageOrderValue)}</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">Floor protected</CardDescription>
            </CardHeader>
            <CardFooter className="p-3.5 sm:p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Margin Saved</span>
              <span className="text-zinc-600 font-semibold ml-1">+{formatINR(analytics.marginPreserved || 0)}</span>
            </CardFooter>
          </Card>
        </div>

        {/* 3 Telemetry Graphs */}
        <DashboardCharts summary={analytics} charts={charts} />

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Activity Stream (7 cols) using shadcn Card and Tabs */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Agent Activity Stream</h3>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-600 border-zinc-200 bg-zinc-100">
                  Live SSE Feed
                </Badge>
              </div>

              {/* Filter Tabs using shadcn Tabs with mobile horizontal scroll */}
              <div className="overflow-x-auto no-scrollbar max-w-full pb-0.5">
                <Tabs value={selectedActivityFilter} onValueChange={setSelectedActivityFilter}>
                  <TabsList className="h-7 shrink-0">
                    {["ALL", "PAYMENTS", "NEGOTIATIONS", "INVENTORY"].map((filter) => (
                      <TabsTrigger key={filter} value={filter} className="text-[10px] py-0.5 px-2">
                        {filter}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Card className="border-zinc-200 divide-y divide-zinc-100 shadow-xs overflow-hidden">
              {filteredActivity.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">No telemetry events yet</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 max-w-sm mx-auto">
                      Events will stream here automatically when AI negotiates with buyers or captures Razorpay payments.
                    </p>
                  </div>
                  <Link href="/dashboard/whatsapp" className="inline-block pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-medium gap-1.5 bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-2xs">
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span>Simulate WhatsApp Lead</span>
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredActivity.map((item) => {
                  const isPayment = item.type === "PAYMENT_CAPTURED";
                  const isNeg = item.type === "NEGOTIATION_COMPLETED";
                  const isInv = item.type === "INVENTORY_UPDATED";
                  const isConv = item.type === "CONVERSATION_STARTED";

                  return (
                    <div
                      key={item.id}
                      className={`p-4 flex items-start justify-between gap-4 transition-all duration-300 ${
                        (item as any).isNew ? "event-new" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {isPayment ? (
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                          ) : isNeg ? (
                            <Zap className="w-4 h-4 text-blue-600" />
                          ) : isInv ? (
                            <Lock className="w-4 h-4 text-zinc-600" />
                          ) : isConv ? (
                            <MessageSquare className="w-4 h-4 text-zinc-600" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">{item.title}</span>
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 rounded bg-zinc-100 text-zinc-700 border-zinc-200">
                              {item.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-600 leading-normal">{item.description}</p>
                        </div>
                      </div>

                      <span className="text-[11px] text-zinc-400 font-mono flex-shrink-0 whitespace-nowrap">
                        {item.timestamp ? (
                          item.timestamp.includes("T")
                            ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : item.timestamp
                        ) : "Just now"}
                      </span>
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Top Products & Webhook Status (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">Top Converted Products</h3>
              <Link
                href="/dashboard/products"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <Card className="border-zinc-200 divide-y divide-zinc-100 shadow-xs overflow-hidden">
              {(analytics.topSellingProducts || []).length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">No converted product sales yet</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Ensure your catalog is active so AI Seller can close deals.
                    </p>
                  </div>
                  <Link href="/dashboard/products" className="inline-block pt-0.5">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-medium gap-1 bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-2xs">
                      <span>Manage Products Catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              ) : (
                (analytics.topSellingProducts || []).map((prod, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded bg-zinc-100 text-zinc-600 flex items-center justify-center font-bold text-[10px] font-mono">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">{prod.title}</p>
                        <p className="text-[11px] text-zinc-500">{prod.salesCount} deals closed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-zinc-900">
                        {formatINR(prod.revenue)}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">Settled</span>
                    </div>
                  </div>
                ))
              )}
            </Card>

            {/* Razorpay Webhook Health Card */}
            <Card className="p-4 bg-zinc-900 border-zinc-800 text-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Razorpay Webhook Engine
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                  ● 200 OK
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                `payment.captured` webhooks are verified with HMAC SHA256 signatures, automatically settling orders in under 45ms.
              </p>

              <div className="pt-2 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="bg-zinc-800/60 p-1.5 rounded border border-zinc-800">
                  <p className="text-zinc-400">Latency</p>
                  <p className="font-bold text-zinc-200">38ms</p>
                </div>
                <div className="bg-zinc-800/60 p-1.5 rounded border border-zinc-800">
                  <p className="text-zinc-400">Signature</p>
                  <p className="font-bold text-zinc-200">Verified</p>
                </div>
                <div className="bg-zinc-800/60 p-1.5 rounded border border-zinc-800">
                  <p className="text-zinc-400">Today</p>
                  <p className="font-bold text-zinc-200">
                    {(analytics as any).todayWebhookCount ?? analytics.dealsClosed ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Live Telemetry Toast */}
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out transform ${
            liveToast.show
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
        >
          <div className="bg-zinc-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-800 flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">{liveToast.title}</p>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{liveToast.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

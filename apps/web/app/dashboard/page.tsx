"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api, emptyAnalytics } from "@/lib/api/client";
import { AnalyticsSummary, ActivityEvent } from "@/lib/types";
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
  CheckCircle2,
  Sliders,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(emptyAnalytics);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const a = await api.analytics.getSummary();
        const act = await api.analytics.getActivity();
        if (a) setAnalytics(a);
        if (act) setActivity(act);
      } catch (err) {
        console.error("Failed to load analytics", err);
      }
    }
    load();
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
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Merchant Cockpit</h1>
              <Badge variant="outline" className="gap-1.5 font-medium text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Telemetry
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Real-time telemetry on autonomous WhatsApp negotiations and Razorpay settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-white border-zinc-300 hover:bg-zinc-50 font-medium text-zinc-700 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-zinc-500 mr-1.5" />
                Manage Catalog
              </Button>
            </Link>
            <Link href="/dashboard/conversations">
              <Button variant="default" size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Live AI Conversations
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Seller Agent Banner Card */}
        <Card className="border-zinc-200 shadow-xs">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 text-white text-[11px] font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AI SELLER AGENT ACTIVE
                  </span>
                  <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
                    WhatsApp Cloud API
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
                    Razorpay Instant
                  </Badge>
                </div>

                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Autonomous WhatsApp Selling & Negotiation Engine
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                    Discovers buyer intent, checks inventory across Native & Shopify, negotiates within your floor price mandate (₹3,500 min), and issues instant Razorpay payment links.
                  </p>
                </div>

                {/* Policy Chips with Tooltips */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                        Floor: ₹3,500
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Hard price barrier the AI agent is forbidden to breach</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                        Max Discount: 12%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Maximum allowed discount percentage for buyer counter-offers</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-600" />
                        Free Shipping &gt; ₹3,000
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Automatic closing sweetener offered above ₹3,000 order value</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Outcome Stat Modules */}
              <div className="w-full lg:w-auto grid grid-cols-3 gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex-shrink-0">
                <div className="text-center px-3 border-r border-zinc-200">
                  <p className="text-[11px] text-zinc-500 font-medium">Conversion</p>
                  <p className="text-xl font-bold font-mono text-zinc-900">{analytics.conversionRate}%</p>
                  <span className="text-[10px] text-emerald-700 font-medium font-mono">+4.2% vs manual</span>
                </div>
                <div className="text-center px-3 border-r border-zinc-200">
                  <p className="text-[11px] text-zinc-500 font-medium">Avg Discount</p>
                  <p className="text-xl font-bold font-mono text-zinc-900">{analytics.averageDiscount}%</p>
                  <span className="text-[10px] text-zinc-500 font-medium font-mono">Floor protected</span>
                </div>
                <div className="text-center px-3">
                  <p className="text-[11px] text-zinc-500 font-medium">Deals Closed</p>
                  <p className="text-xl font-bold font-mono text-blue-600">{analytics.dealsClosed}</p>
                  <span className="text-[10px] text-zinc-500 font-medium font-mono">100% UPI settled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 Financial KPI Cards using shadcn Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Agent GMV</span>
                <CreditCard className="w-4 h-4 text-zinc-400" />
              </div>
              <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(analytics.agentGmv)}</CardTitle>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{analytics.gmvGrowthPercent}% vs last week</span>
              </div>
            </CardHeader>
            <CardFooter className="p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Settlement Gateway</span>
              <span className="text-zinc-600 font-semibold">Razorpay UPI</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">AI Conversations</span>
                <MessageSquare className="w-4 h-4 text-zinc-400" />
              </div>
              <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatNumber(analytics.totalConversations)}</CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">100% automated via WhatsApp</CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Response Time</span>
              <span className="text-zinc-600 font-semibold">&lt; 1.2s avg</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Settled Deals</span>
                <ShoppingBag className="w-4 h-4 text-zinc-400" />
              </div>
              <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatNumber(analytics.dealsClosed)}</CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">Zero human intervention</CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Closure Rate</span>
              <span className="text-zinc-600 font-semibold">91.2% Success</span>
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-xs">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[11px]">Average Order Value</span>
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
              </div>
              <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(analytics.averageOrderValue)}</CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">Protected by price floor</CardDescription>
            </CardHeader>
            <CardFooter className="p-5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>Margin Saved</span>
              <span className="text-zinc-600 font-semibold">+₹9,310</span>
            </CardFooter>
          </Card>
        </div>

        {/* 3 Telemetry Graphs */}
        <DashboardCharts />

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

              {/* Filter Tabs using shadcn Tabs */}
              <Tabs value={selectedActivityFilter} onValueChange={setSelectedActivityFilter}>
                <TabsList className="h-7">
                  {["ALL", "PAYMENTS", "NEGOTIATIONS", "INVENTORY"].map((filter) => (
                    <TabsTrigger key={filter} value={filter} className="text-[10px] py-0.5 px-2">
                      {filter}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <Card className="border-zinc-200 divide-y divide-zinc-100 shadow-xs overflow-hidden">
              {filteredActivity.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No activity matching this filter.
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
                      className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors"
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
                        {item.timestamp}
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
              {(analytics.topSellingProducts || []).map((prod, i) => (
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
              ))}
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
                  <p className="font-bold text-zinc-200">128</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}


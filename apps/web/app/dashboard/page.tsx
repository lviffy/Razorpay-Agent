"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { AnalyticsSummary, ActivityEvent } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [activeChartMetric, setActiveChartMetric] = useState<"gmv" | "margin" | "deals">("gmv");

  useEffect(() => {
    async function load() {
      const a = await api.analytics.getSummary();
      const act = await api.analytics.getActivity();
      setAnalytics(a);
      setActivity(act);
    }
    load();
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-xs text-zinc-500 font-mono">Loading metrics...</p>
      </div>
    );
  }

  const filteredActivity = activity.filter((item) => {
    if (selectedActivityFilter === "ALL") return true;
    if (selectedActivityFilter === "PAYMENTS") return item.type === "PAYMENT_CAPTURED";
    if (selectedActivityFilter === "NEGOTIATIONS") return item.type === "NEGOTIATION_COMPLETED";
    if (selectedActivityFilter === "INVENTORY") return item.type === "INVENTORY_UPDATED";
    return true;
  });

  const chartPoints = [
    { day: "Mon", gmv: 8400, margin: 950, deals: 4 },
    { day: "Tue", gmv: 11200, margin: 1280, deals: 5 },
    { day: "Wed", gmv: 9800, margin: 1100, deals: 4 },
    { day: "Thu", gmv: 14500, margin: 1640, deals: 7 },
    { day: "Fri", gmv: 16200, margin: 1820, deals: 8 },
    { day: "Sat", gmv: 12900, margin: 1450, deals: 6 },
    { day: "Today", gmv: 18490, margin: 2070, deals: 9 },
  ];

  const maxVal = Math.max(...chartPoints.map((p) => p[activeChartMetric]));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Merchant Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time telemetry on autonomous WhatsApp negotiations and Razorpay settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm" className="text-xs h-8 bg-white border-zinc-300 hover:bg-zinc-50 font-medium text-zinc-700">
              <Layers className="w-3.5 h-3.5 text-zinc-500 mr-1.5" />
              Manage Catalog
            </Button>
          </Link>
          <Link href="/dashboard/conversations">
            <Button variant="primary" size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Live AI Conversations
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Seller Agent Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 text-white text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                AI SELLER AGENT ACTIVE
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono">
                WhatsApp Cloud API
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono">
                Razorpay Instant
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Autonomous WhatsApp Selling & Negotiation Engine
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed mt-0.5">
                Discovers buyer intent, checks inventory across Native & Shopify, negotiates within your floor price mandate (₹3,500 min), and issues instant Razorpay payment links.
              </p>
            </div>

            {/* Policy Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                Floor: ₹3,500
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                Max Discount: 12%
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-mono">
                <ShoppingBag className="w-3.5 h-3.5 text-zinc-600" />
                Free Shipping &gt; ₹3,000
              </span>
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
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Agent GMV</span>
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900">{formatINR(analytics.agentGmv)}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{analytics.gmvGrowthPercent}% vs last week</span>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>Settlement Gateway</span>
            <span className="text-zinc-600 font-semibold">Razorpay UPI</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">AI Conversations</span>
            <MessageSquare className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900">{formatNumber(analytics.totalConversations)}</div>
            <p className="text-xs text-zinc-500 mt-1">100% automated via WhatsApp</p>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>Response Time</span>
            <span className="text-zinc-600 font-semibold">&lt; 1.2s avg</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Settled Deals</span>
            <ShoppingBag className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900">{formatNumber(analytics.dealsClosed)}</div>
            <p className="text-xs text-zinc-500 mt-1">Zero human intervention</p>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>Closure Rate</span>
            <span className="text-zinc-600 font-semibold">91.2% Success</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Average Order Value</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-zinc-900">{formatINR(analytics.averageOrderValue)}</div>
            <p className="text-xs text-zinc-500 mt-1">Protected by price floor</p>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>Margin Saved</span>
            <span className="text-zinc-600 font-semibold">+₹9,310</span>
          </div>
        </div>
      </div>

      {/* Telemetry Chart Section */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Settlement Velocity & Margin Protection</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daily volume of automated checkouts and preserved dealer margin.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button
              onClick={() => setActiveChartMetric("gmv")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                activeChartMetric === "gmv"
                  ? "bg-zinc-900 text-white font-medium shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              GMV Revenue
            </button>
            <button
              onClick={() => setActiveChartMetric("margin")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                activeChartMetric === "margin"
                  ? "bg-zinc-900 text-white font-medium shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Margin Saved
            </button>
            <button
              onClick={() => setActiveChartMetric("deals")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                activeChartMetric === "deals"
                  ? "bg-zinc-900 text-white font-medium shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Deals Count
            </button>
          </div>
        </div>

        {/* Clean Bar Telemetry */}
        <div className="grid grid-cols-7 gap-3 pt-4 pb-2 items-end min-h-[140px]">
          {chartPoints.map((item, idx) => {
            const val = item[activeChartMetric];
            const heightPercent = Math.max(15, Math.round((val / maxVal) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {activeChartMetric === "deals" ? val : `₹${val.toLocaleString("en-IN")}`}
                </div>
                <div className="w-full bg-zinc-100 rounded-md h-28 flex items-end p-0.5 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-sm bg-zinc-900 group-hover:bg-blue-600 transition-colors"
                  />
                </div>
                <span className="text-[11px] font-medium text-zinc-500">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Agent Activity Stream</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                Live SSE Feed
              </span>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 text-[11px]">
              {["ALL", "PAYMENTS", "NEGOTIATIONS", "INVENTORY"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedActivityFilter(filter)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedActivityFilter === filter
                      ? "bg-zinc-900 text-white font-medium"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 shadow-xs overflow-hidden">
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
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {item.type.replace("_", " ")}
                          </span>
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
          </div>
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

          <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 shadow-xs overflow-hidden">
            {analytics.topSellingProducts.map((prod, i) => (
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
          </div>

          {/* Razorpay Webhook Health */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white space-y-3 shadow-xs">
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
          </div>
        </div>
      </div>
    </div>
  );
}

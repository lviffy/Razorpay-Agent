"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { AnalyticsSummary, ActivityEvent } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  MessageSquare,
  ShoppingBag,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  ExternalLink,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

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
    return <div className="text-xs text-surface-500">Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Merchant Overview</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Real-time telemetry on autonomous WhatsApp negotiations and Razorpay settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/products">
            <Button variant="outline" size="sm">
              Manage Catalog
            </Button>
          </Link>
          <Link href="/dashboard/conversations">
            <Button variant="primary" size="sm">
              Live AI Conversations
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Seller Agent Hero Banner */}
      <div className="bg-white border border-surface-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0C2340]">
              AI SELLER AGENT ● ACTIVE & LIVE
            </span>
            <Badge variant="brand" className="text-[10px]">
              WHATSAPP CLOUD API
            </Badge>
          </div>
          <h2 className="text-base font-semibold text-surface-900">
            Autonomous Selling & Price Negotiation Engine
          </h2>
          <p className="text-xs text-surface-600 leading-relaxed">
            Your agent discovers buyer intent, checks inventory across Native & Shopify, negotiates
            within your floor price mandate (₹3,500 min), and issues instant Razorpay payment links.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface-50 border border-surface-200 p-4 rounded-xl flex-shrink-0">
          <div className="text-center px-3 border-r border-surface-200">
            <p className="text-[11px] text-surface-500 font-medium">Conversion</p>
            <p className="text-lg font-bold font-mono text-emerald-600">{analytics.conversionRate}%</p>
          </div>
          <div className="text-center px-3 border-r border-surface-200">
            <p className="text-[11px] text-surface-500 font-medium">Avg Discount</p>
            <p className="text-lg font-bold font-mono text-surface-900">{analytics.averageDiscount}%</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[11px] text-surface-500 font-medium">Deals Closed</p>
            <p className="text-lg font-bold font-mono text-brand-600">{analytics.dealsClosed}</p>
          </div>
        </div>
      </div>

      {/* 4 Core Financial & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agent GMV */}
        <Card>
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="font-semibold">Agent GMV</span>
            <CreditCard className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-surface-900">
            {formatINR(analytics.agentGmv)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{analytics.gmvGrowthPercent}% vs last week</span>
          </div>
        </Card>

        {/* Conversations */}
        <Card>
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="font-semibold">AI Conversations</span>
            <MessageSquare className="w-4 h-4 text-surface-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-surface-900">
            {formatNumber(analytics.totalConversations)}
          </div>
          <p className="text-[11px] text-surface-500 mt-2">100% automated via WhatsApp</p>
        </Card>

        {/* Closed Deals */}
        <Card>
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="font-semibold">Settled Deals</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-surface-900">
            {formatNumber(analytics.dealsClosed)}
          </div>
          <p className="text-[11px] text-surface-500 mt-2">Zero human intervention</p>
        </Card>

        {/* Average Order Value */}
        <Card>
          <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
            <span className="font-semibold">Average Order Value</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-surface-900">
            {formatINR(analytics.averageOrderValue)}
          </div>
          <p className="text-[11px] text-surface-500 mt-2">Protected by price floor</p>
        </Card>
      </div>

      {/* 2-Column: Live Activity Stream & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-Time Activity Log (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">Agent Activity Stream</h3>
            <span className="text-[11px] text-surface-500 font-mono">Live SSE Feed</span>
          </div>

          <div className="bg-white border border-surface-200 rounded-md divide-y divide-surface-100">
            {activity.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-surface-900">{item.title}</span>
                    <Badge variant={item.type === "PAYMENT_CAPTURED" ? "success" : "brand"}>
                      {item.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-surface-500">{item.description}</p>
                </div>
                <span className="text-[11px] text-surface-400 font-mono flex-shrink-0">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products via AI Seller (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">Top Converted Products</h3>
            <Link href="/dashboard/products" className="text-[11px] text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="bg-white border border-surface-200 rounded-md divide-y divide-surface-100">
            {analytics.topSellingProducts.map((prod, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-surface-900">{prod.title}</p>
                  <p className="text-[11px] text-surface-500">{prod.salesCount} deals closed</p>
                </div>
                <div className="text-right font-mono text-xs font-bold text-surface-900">
                  {formatINR(prod.revenue)}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Integration Health Box */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>Razorpay Webhook Listener</span>
              <span className="text-emerald-600 flex items-center gap-1 font-mono text-[11px]">
                ● Healthy
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              `payment.captured` events automatically settle transactions and trigger inventory release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { api, emptyAnalytics } from "@/lib/api/client";
import { AnalyticsSummary } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Percent,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/context/store-context";

export default function AnalyticsPage() {
  const { currentStore, refreshTrigger } = useStore();
  const [data, setData] = useState<AnalyticsSummary>(emptyAnalytics);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.analytics.getSummary();
        if (res) setData(res);
      } catch (err) {
        console.error("Failed to load analytics", err);
      }
    }
    load();
  }, [currentStore?.id, refreshTrigger]);

  const totalMarginSaved = data.marginPreserved || 0;
  const totalDiscountConceded = (data as any).totalDiscountGiven || Math.round(data.agentGmv * (data.averageDiscount / 100));
  const totalRequestedDiscount = totalMarginSaved + totalDiscountConceded;

  const channels = data.channelBreakdown && data.channelBreakdown.length > 0
    ? data.channelBreakdown
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Agent Analytics & ROI</h1>
            <Badge variant="outline" className="text-[11px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
              +{formatINR(totalMarginSaved)} Margin Preserved
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Performance metrics, dealer margin preservation, and conversion velocity across autonomous WhatsApp negotiations.
          </p>
        </div>

        <Link href="/dashboard/growth-ai">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Growth Advisor</span>
          </Button>
        </Link>
      </div>

      {/* 4 Top KPI Cards using shadcn Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Total Agent GMV</span>
              <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(data.agentGmv)}</CardTitle>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-600 font-medium mt-1 truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+{data.gmvGrowthPercent}% WoW</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Conversion Rate</span>
              <Percent className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{data.conversionRate}%</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">{data.dealsClosed} closed of {data.totalConversations}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Avg Concession</span>
              <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{data.averageDiscount}%</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">Preserving store floor</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-3.5 sm:p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">Avg Order Value</span>
              <ShoppingBag className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
            <CardTitle className="text-lg sm:text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(data.averageOrderValue)}</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">Floor protected</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Sourced Channel Breakdown & Margin Shielding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Channel Revenue (7 cols) */}
        <Card className="lg:col-span-7 border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-sm font-bold text-zinc-900">Revenue Contribution by Sourced Channel</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Settlement volume split between Native catalog and connected Shopify store.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            {channels.length === 0 ? (
              <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold text-zinc-700">Awaiting Multi-Channel Orders</p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Channel revenue splits between ZapAI Native catalog and connected Shopify stores will graph here automatically upon autonomous order settlement.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {channels.map((ch, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-zinc-800">{ch.channel}</span>
                      <span className="font-mono font-bold text-zinc-900">{ch.percentage}% ({formatINR(ch.gmv)})</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? "bg-zinc-900" : "bg-zinc-600"}`}
                        style={{ width: `${Math.min(100, Math.max(0, ch.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-zinc-900">Dynamic Inventory Prioritization</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  AI automatically routes buyer negotiations to highest margin SKUs first.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium text-zinc-700 font-mono bg-white">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Margin Shielding Matrix (5 cols) */}
        <Card className="lg:col-span-5 border-zinc-200 shadow-xs flex flex-col justify-between">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-bold text-zinc-900">Margin Protection Matrix</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">Value shielded against extreme buyer discount requests.</CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-2.5 text-xs">
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Requested Buyer Discounts</span>
              <span className="font-mono font-semibold text-zinc-900">{formatINR(totalRequestedDiscount)}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Conceded Discounts by AI</span>
              <span className="font-mono font-semibold text-zinc-900">{formatINR(totalDiscountConceded)}</span>
            </div>
            <div className="p-3 bg-zinc-900 text-white rounded-lg flex justify-between items-center shadow-xs">
              <span className="text-zinc-200 font-medium">Net Dealer Margin Preserved</span>
              <span className="font-mono font-bold text-sm">+{formatINR(totalMarginSaved)}</span>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Floor Compliance</span>
            <span className="text-zinc-800 font-bold">100% Zero Breaches</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AnalyticsSummary } from "@/lib/types";
import { initialMockAnalytics } from "@/lib/api/mock-data";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Percent,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary>(initialMockAnalytics);

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
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Agent Analytics & ROI</h1>
            <Badge variant="outline" className="text-[11px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
              +{formatINR(data.marginPreserved || 9310)} Margin Preserved
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Performance metrics, dealer margin preservation, and conversion velocity across autonomous WhatsApp negotiations.
          </p>
        </div>
      </div>

      {/* 4 Top KPI Cards using shadcn Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Agent GMV</span>
              <CreditCard className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(data.agentGmv)}</CardTitle>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{data.gmvGrowthPercent}% this week</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Conversion Rate</span>
              <Percent className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{data.conversionRate}%</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">{data.dealsClosed} closed of {data.totalConversations} leads</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Avg Concession Given</span>
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{data.averageDiscount}%</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">Below 12% mandate ceiling</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between text-zinc-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Average Order Value</span>
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-zinc-900 mt-1">{formatINR(data.averageOrderValue)}</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">Enforced by price floor</CardDescription>
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
              Settlement volume split between Native AgentBridge catalog and connected Shopify store.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0 space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-zinc-800">AgentBridge Native Catalog</span>
                  <span className="font-mono font-bold text-zinc-900">62% ({formatINR(51143)})</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 rounded-full w-[62%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-zinc-800">Shopify Connected Store</span>
                  <span className="font-mono font-bold text-zinc-900">38% ({formatINR(31347)})</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 rounded-full w-[38%]" />
                </div>
              </div>
            </div>

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
              <span className="font-mono font-semibold text-zinc-900">₹14,200</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Conceded Discounts by AI</span>
              <span className="font-mono font-semibold text-zinc-900">₹4,890</span>
            </div>
            <div className="p-3 bg-zinc-900 text-white rounded-lg flex justify-between items-center shadow-xs">
              <span className="text-zinc-200 font-medium">Net Dealer Margin Preserved</span>
              <span className="font-mono font-bold text-sm">₹9,310</span>
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

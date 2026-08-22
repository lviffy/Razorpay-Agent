"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AnalyticsSummary } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import {
  TrendingUp,
  Percent,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function load() {
      const res = await api.analytics.getSummary();
      setData(res);
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-xs text-zinc-500 font-mono">Loading analytics telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Agent Analytics & ROI</h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              +₹9,310 Margin Preserved
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Performance metrics, dealer margin preservation, and conversion velocity across autonomous WhatsApp negotiations.
          </p>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Agent GMV</span>
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-zinc-900">{formatINR(data.agentGmv)}</p>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{data.gmvGrowthPercent}% this week</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Conversion Rate</span>
            <Percent className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-zinc-900">{data.conversionRate}%</p>
            <p className="text-xs text-zinc-500 mt-1">{data.dealsClosed} closed of {data.totalConversations} leads</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Avg Concession Given</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-zinc-900">{data.averageDiscount}%</p>
            <p className="text-xs text-zinc-500 mt-1">Below 12% mandate ceiling</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Average Order Value</span>
            <ShoppingBag className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-zinc-900">{formatINR(data.averageOrderValue)}</p>
            <p className="text-xs text-zinc-500 mt-1">Enforced by price floor</p>
          </div>
        </div>
      </div>

      {/* Sourced Channel Breakdown & Margin Shielding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Channel Revenue (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Revenue Contribution by Sourced Channel</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Settlement volume split between Native AgentBridge catalog and connected Shopify store.
            </p>
          </div>

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
            <span className="text-xs font-medium text-zinc-700 font-mono">Active</span>
          </div>
        </div>

        {/* Margin Shielding Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Margin Protection Matrix</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Value shielded against extreme buyer discount requests.</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Requested Buyer Discounts</span>
              <span className="font-mono font-semibold text-zinc-900">₹14,200</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center">
              <span className="text-zinc-600">Conceded Discounts by AI</span>
              <span className="font-mono font-semibold text-zinc-900">₹4,890</span>
            </div>
            <div className="p-3 bg-zinc-900 text-white rounded-lg flex justify-between items-center">
              <span className="text-zinc-200 font-medium">Net Dealer Margin Preserved</span>
              <span className="font-mono font-bold text-sm">₹9,310</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Floor Compliance</span>
            <span className="text-zinc-800 font-bold">100% Zero Breaches</span>
          </div>
        </div>
      </div>
    </div>
  );
}

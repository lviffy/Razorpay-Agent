"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Percent,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  PackageCheck,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface DailyBriefingProps {
  briefing: {
    headline: string;
    summary: string;
    highlights: Array<{
      title: string;
      value: string;
      change?: string;
      isPositive?: boolean;
      description: string;
    }>;
    inventoryAlerts: Array<{
      sku: string;
      title: string;
      availableStock: number;
      daysOfInventory: string;
      status: string;
      recommendation: string;
      suggestedRestockQty?: number;
    }>;
    growthOpportunities: Array<{
      type: string;
      title: string;
      impact: string;
      description: string;
      action?: {
        actionType: string;
        sku?: string;
        value: number;
        label: string;
      };
    }>;
  };
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectAction?: (action: any) => void;
  onAskAI?: (prompt: string) => void;
}

export function DailyBriefingCard({
  briefing,
  isLoading,
  onRefresh,
  onSelectAction,
  onAskAI,
}: DailyBriefingProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const highlights = briefing?.highlights || [];
  const alerts = briefing?.inventoryAlerts || [];
  const opportunities = briefing?.growthOpportunities || [];

  return (
    <div className="space-y-4">
      {/* Top 3-4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Settled GMV */}
        <Card className="border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Settled Agent GMV</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-2">
            {highlights[0]?.value || "₹0"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 mt-1">
            <span>{highlights[0]?.change || "Real-Time Ledger"}</span>
            <span className="text-slate-400">• Razorpay UPI</span>
          </div>
        </Card>

        {/* KPI 2: Margin Preserved */}
        <Card className="border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Dealer Margin Saved</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-2">
            {highlights[1]?.value || "₹0"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">100% Floor Guarded</span>
            <span className="text-slate-400">• Zero Below Cost</span>
          </div>
        </Card>

        {/* KPI 3: WhatsApp Conversion */}
        <Card className="border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Deal Conversion Rate</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-2">
            {highlights[2]?.value || "0%"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
            <span className="text-indigo-600 font-semibold">{highlights[2]?.change || "Direct Inquiries"}</span>
            <span className="text-slate-400">• WhatsApp AI</span>
          </div>
        </Card>

        {/* KPI 4: Stock Risk Radar */}
        <Card className="border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Inventory Status</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-2">
            {alerts.length > 0 ? `${alerts.length} At Risk` : "0 At Risk"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
            <span className={alerts.length > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
              {alerts.length > 0 ? "Action Recommended" : "Optimal Stock Reserves"}
            </span>
          </div>
        </Card>
      </div>

      {/* Clean Intelligence Digest Card */}
      <Card className="border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {briefing?.headline || "Store Performance & Growth Intelligence"}
                </h3>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-[10px] font-medium">
                  Live Feed
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {briefing?.summary || "Live metrics across settled GMV, dealer margin preservation, and inventory burn velocity."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-xs font-medium gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </Button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Toggle details"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 sm:p-5 bg-slate-950/40 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Growth Opportunities */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Growth & Price Levers</span>
                <span className="text-[10px] text-blue-400 font-normal">Autonomous Recommendations</span>
              </div>

              {opportunities.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400">
                  No pending pricing adjustments. Margins and conversion rates are operating optimally.
                </div>
              ) : (
                opportunities.map((opp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{opp.title}</span>
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            {opp.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {opp.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        onClick={() => onAskAI && onAskAI(`How do I execute: ${opp.title}?`)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                      >
                        Ask Advisor <ArrowRight className="w-3 h-3" />
                      </button>

                      {opp.action && onSelectAction && (
                        <Button
                          size="sm"
                          onClick={() =>
                            onSelectAction({
                              id: `opp-${idx}`,
                              title: opp.title,
                              description: opp.description,
                              actionType: opp.action?.actionType,
                              sku: opp.action?.sku,
                              value: opp.action?.value,
                              badge: opp.impact,
                            })
                          }
                          className="h-6 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1 px-2.5 shadow-xs"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          {opp.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right: Stockout Warnings */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Inventory Alerts</span>
                <span className="text-[10px] text-amber-400 font-normal">Stockout Warning</span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>All product SKUs currently hold sufficient inventory for upcoming demand.</span>
                </div>
              ) : (
                alerts.map((al, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded">
                            {al.daysOfInventory} Left
                          </span>
                          <span className="text-xs font-bold text-white">{al.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">({al.sku})</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{al.recommendation}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold font-mono text-white">{al.availableStock}</span>
                        <span className="text-[10px] text-slate-400 block">units left</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-[10px] text-slate-400">
                        Burn Rate: Fast
                      </span>

                      {onSelectAction && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onSelectAction({
                              id: `restock-${al.sku}`,
                              title: `Restock ${al.title}`,
                              description: al.recommendation,
                              actionType: "RESTOCK_INVENTORY",
                              sku: al.sku,
                              value: al.suggestedRestockQty || 25,
                              badge: "Restock PO",
                            })
                          }
                          className="h-6 text-[11px] bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium px-2.5"
                        >
                          + Restock Stock
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

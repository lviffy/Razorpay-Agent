"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AnalyticsSummary } from "@/lib/types";
import { formatINR, formatNumber } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Users, DollarSign, Percent } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function load() {
      const res = await api.analytics.getSummary();
      setData(res);
    }
    load();
  }, []);

  if (!data) return <div className="text-xs text-surface-500">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Agent Analytics & ROI</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Performance metrics for autonomous WhatsApp negotiation campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-surface-500 font-semibold mb-1">Total Agent GMV</p>
          <p className="text-2xl font-bold font-mono text-surface-900">{formatINR(data.agentGmv)}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+{data.gmvGrowthPercent}% this week</span>
          </div>
        </Card>

        <Card>
          <p className="text-xs text-surface-500 font-semibold mb-1">Conversion Rate</p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{data.conversionRate}%</p>
          <p className="text-[11px] text-surface-500 mt-2">Closed / Active dialogues</p>
        </Card>

        <Card>
          <p className="text-xs text-surface-500 font-semibold mb-1">Average Discount Given</p>
          <p className="text-2xl font-bold font-mono text-surface-900">{data.averageDiscount}%</p>
          <p className="text-[11px] text-surface-500 mt-2">Well below 12% ceiling</p>
        </Card>

        <Card>
          <p className="text-xs text-surface-500 font-semibold mb-1">Average Order Value</p>
          <p className="text-2xl font-bold font-mono text-surface-900">{formatINR(data.averageOrderValue)}</p>
          <p className="text-[11px] text-surface-500 mt-2">Enforced by floor price</p>
        </Card>
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-surface-200 rounded-md p-6 space-y-4">
        <h3 className="text-sm font-semibold text-surface-900">Revenue Contribution by Sourced Channel</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-surface-800">Native AgentBridge Catalog</span>
              <span className="font-mono font-bold text-surface-900">62% ({formatINR(51143)})</span>
            </div>
            <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden border border-surface-200">
              <div className="h-full bg-[#0C83FD] w-[62%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-surface-800">Shopify Connected Catalog</span>
              <span className="font-mono font-bold text-surface-900">38% ({formatINR(31347)})</span>
            </div>
            <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden border border-surface-200">
              <div className="h-full bg-emerald-500 w-[38%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

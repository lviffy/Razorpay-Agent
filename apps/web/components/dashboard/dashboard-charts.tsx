"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/utils";
import { TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { AnalyticsSummary } from "@/lib/types";

export interface DashboardChartsProps {
  summary?: AnalyticsSummary;
  charts?: {
    gmvData?: Array<{ day: string; gmv: number; baseline: number }>;
    marginData?: Array<{ day: string; preserved: number; conceded: number }>;
    velocityData?: Array<{ time: string; leads: number; deals: number }>;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isCurrency?: boolean;
}

function CustomTooltip({ active, payload, label, isCurrency = false }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 shadow-xl text-xs text-white">
        <p className="font-semibold text-zinc-300 text-[11px] mb-1.5 pb-1 border-b border-zinc-800">{label}</p>
        <div className="space-y-1">
          {payload.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {isCurrency ? formatINR(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardCharts({ summary, charts }: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="p-5 h-64 animate-pulse border-zinc-200" />
        ))}
      </div>
    );
  }

  const gmvData = charts?.gmvData && charts.gmvData.length > 0
    ? charts.gmvData
    : [
        { day: "Mon", gmv: 0, baseline: 0 },
        { day: "Tue", gmv: 0, baseline: 0 },
        { day: "Wed", gmv: 0, baseline: 0 },
        { day: "Thu", gmv: 0, baseline: 0 },
        { day: "Fri", gmv: 0, baseline: 0 },
        { day: "Sat", gmv: 0, baseline: 0 },
        { day: "Today", gmv: 0, baseline: 0 },
      ];

  const marginData = charts?.marginData && charts.marginData.length > 0
    ? charts.marginData
    : [
        { day: "Mon", preserved: 0, conceded: 0 },
        { day: "Tue", preserved: 0, conceded: 0 },
        { day: "Wed", preserved: 0, conceded: 0 },
        { day: "Thu", preserved: 0, conceded: 0 },
        { day: "Fri", preserved: 0, conceded: 0 },
        { day: "Sat", preserved: 0, conceded: 0 },
        { day: "Today", preserved: 0, conceded: 0 },
      ];

  const velocityData = charts?.velocityData && charts.velocityData.length > 0
    ? charts.velocityData
    : [
        { time: "08:00", leads: 0, deals: 0 },
        { time: "11:00", leads: 0, deals: 0 },
        { time: "14:00", leads: 0, deals: 0 },
        { time: "17:00", leads: 0, deals: 0 },
        { time: "20:00", leads: 0, deals: 0 },
        { time: "23:00", leads: 0, deals: 0 },
      ];

  const totalGmv = summary?.agentGmv !== undefined
    ? summary.agentGmv
    : gmvData.reduce((acc, curr) => acc + curr.gmv, 0);

  const gmvGrowth = summary?.gmvGrowthPercent !== undefined
    ? summary.gmvGrowthPercent
    : 0;

  const peakDay = totalGmv > 0
    ? gmvData.reduce((max, curr) => (curr.gmv > max.gmv ? curr : max), gmvData[0] || { day: "Today", gmv: 0 })
    : { day: "Today", gmv: 0 };

  const totalPreserved = summary?.marginPreserved !== undefined
    ? summary.marginPreserved
    : marginData.reduce((acc, curr) => acc + curr.preserved, 0);

  const avgDiscount = summary?.averageDiscount !== undefined
    ? summary.averageDiscount
    : 0;

  const conversionRate = summary?.conversionRate !== undefined
    ? summary.conversionRate
    : 0;

  const dealsClosed = summary?.dealsClosed !== undefined
    ? summary.dealsClosed
    : velocityData.reduce((acc, curr) => acc + curr.deals, 0);

  return (
    <div className="space-y-4">
      {/* Section Sub-Header with shadcn Tabs View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900">Telemetry & Performance Intelligence</h3>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              3 Live Views
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time analytics comparing autonomous settlements, protected margins, and conversion velocity.
          </p>
        </div>

        {/* View mode switcher */}
        <div className="overflow-x-auto no-scrollbar max-w-full pb-0.5">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="h-8 shrink-0">
              <TabsTrigger value="all" className="text-xs py-1 px-2.5">All Graphs</TabsTrigger>
              <TabsTrigger value="gmv" className="text-xs py-1 px-2.5">GMV Volume</TabsTrigger>
              <TabsTrigger value="margin" className="text-xs py-1 px-2.5">Margin Shield</TabsTrigger>
              <TabsTrigger value="velocity" className="text-xs py-1 px-2.5">Lead Velocity</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 3 Graph Grid using shadcn Cards */}
      <div
        className={`grid gap-4 ${
          viewMode === "all"
            ? "grid-cols-1 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {/* Graph 1: Settlement Volume & GMV Velocity (Area Chart) */}
        {(viewMode === "all" || viewMode === "gmv") && (
          <Card className="border-zinc-200 shadow-xs flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-700" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Graph 1 · GMV Velocity</span>
                  </div>
                  <CardTitle className="text-xl font-bold font-mono text-zinc-900 mt-1">{formatINR(totalGmv)}</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 mt-0.5">7-day gross settled volume</CardDescription>
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  +{gmvGrowth}% WoW
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 pb-2">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gmvData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 9, fontFamily: "monospace" }}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <RechartsTooltip content={<CustomTooltip isCurrency />} />
                    <Area
                      type="monotone"
                      dataKey="gmv"
                      name="Settled GMV"
                      stroke="#18181b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#gmvGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>Peak Day: {peakDay.day} ({formatINR(peakDay.gmv)})</span>
              <span className="text-zinc-800 font-semibold">100% UPI Settled</span>
            </CardFooter>
          </Card>
        )}

        {/* Graph 2: Margin Shielding (Preserved vs Conceded Bar Chart) */}
        {(viewMode === "all" || viewMode === "margin") && (
          <Card className="border-zinc-200 shadow-xs flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Graph 2 · Margin Shield</span>
                  </div>
                  <CardTitle className="text-xl font-bold font-mono text-zinc-900 mt-1">{formatINR(totalPreserved)}</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 mt-0.5">Dealer margin preserved against discount asks</CardDescription>
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  0 Violations
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 pb-2">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 9, fontFamily: "monospace" }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <RechartsTooltip content={<CustomTooltip isCurrency />} />
                    <Bar
                      dataKey="preserved"
                      name="Margin Saved"
                      fill="#18181b"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="conceded"
                      name="Conceded by AI"
                      fill="#a1a1aa"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-zinc-900" /> Preserved
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-zinc-400" /> Conceded
                </span>
              </div>
              <span className="text-zinc-800 font-semibold">{avgDiscount}% Avg Disct</span>
            </CardFooter>
          </Card>
        )}

        {/* Graph 3: Intraday WhatsApp Lead & Conversion Velocity (Line Chart) */}
        {(viewMode === "all" || viewMode === "velocity") && (
          <Card className="border-zinc-200 shadow-xs flex flex-col justify-between">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Activity className="w-3.5 h-3.5 text-zinc-700" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Graph 3 · Conversion Flow</span>
                  </div>
                  <CardTitle className="text-xl font-bold font-mono text-zinc-900 mt-1">{conversionRate}% Rate</CardTitle>
                  <CardDescription className="text-[11px] text-zinc-500 mt-0.5">Inbound conversations to settled payments</CardDescription>
                </div>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {dealsClosed} Deals Closed
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 pb-2">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 9, fontFamily: "monospace" }}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="Inbound Leads"
                      stroke="#a1a1aa"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={{ r: 2, fill: "#a1a1aa" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="deals"
                      name="Deals Closed"
                      stroke="#18181b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#18181b" }}
                      activeDot={{ r: 5, fill: "#18181b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-zinc-900 inline-block" /> Closed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-zinc-400 inline-block border-dashed" /> Inbound
                </span>
              </div>
              <span className="text-zinc-800 font-semibold">&lt; 1.2s Resp</span>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

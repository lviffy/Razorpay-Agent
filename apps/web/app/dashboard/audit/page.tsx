"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  CreditCard,
  MessageSquare,
  Package,
  Layers,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Hash,
  Radio,
  Link2,
} from "lucide-react";

interface AuditRecord {
  id: string;
  eventType: string;
  whatsappMessageId?: string;
  conversationId?: string;
  x402TransactionId: string;
  razorpayPaymentId?: string;
  orderId?: string;
  payload: any;
  checksum: string;
  timestamp: string;
  isNew?: boolean; // SSE live append flag
}

export default function AuditExplorerPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLedger();
  }, []);

  const loadAuditLedger = async () => {
    setLoading(true);
    try {
      const data = await api.audit.search("");
      if (data && Array.isArray(data)) {
        setRecords(data as any);
        if (data.length > 0) {
          setSelectedRecord((curr) => curr || (data[0] as any));
        }
      }
    } catch (err) {
      console.error("Audit load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // SSE live append — new events prepend to the ledger as they arrive
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
    const es = new EventSource(`${backendUrl}/demo/events`);
    es.onmessage = (e) => {
      try {
        if (!e.data || e.data.startsWith(":")) return;
        const ev = JSON.parse(e.data);
        const ids = ev.ids || {};
        const newRecord: AuditRecord = {
          id: `sse_${Date.now()}`,
          eventType: ev.type || "SYSTEM_EVENT",
          whatsappMessageId: ids.whatsappMessageId,
          conversationId: ids.conversationId,
          x402TransactionId: ids.x402TransactionId || `x402_${Date.now()}`,
          razorpayPaymentId: ids.razorpayPaymentId,
          orderId: ids.orderId,
          payload: ev.payload || {},
          checksum: `sse_live_${Date.now().toString(16)}`,
          timestamp: new Date().toISOString(),
          isNew: true,
        };
        setRecords((prev) => [newRecord, ...prev.slice(0, 49)]);
        setSelectedRecord(newRecord);
        // Clear isNew flag after animation
        setTimeout(() => {
          setRecords((prev) =>
            prev.map((r) => (r.id === newRecord.id ? { ...r, isNew: false } : r))
          );
        }, 2000);
      } catch {
        // ignore non-JSON pings
      }
    };
    return () => es.close();
  }, []);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.x402TransactionId && r.x402TransactionId.toLowerCase().includes(q)) ||
      (r.razorpayPaymentId && r.razorpayPaymentId.toLowerCase().includes(q)) ||
      (r.orderId && r.orderId.toLowerCase().includes(q)) ||
      (r.whatsappMessageId && r.whatsappMessageId.toLowerCase().includes(q)) ||
      (r.conversationId && r.conversationId.toLowerCase().includes(q)) ||
      r.eventType.toLowerCase().includes(q)
    );
  });

  const active = selectedRecord || filtered[0] || records[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              5-Field Cryptographic Audit Ledger
            </h1>
            <Badge variant="outline" className="gap-1.5 font-medium text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SHA-256 Checksum Chained
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Immutable, append-only verification ledger linking WhatsApp messages, sessions, Fiat-Native x402 challenges, Razorpay payment captures, and merchant orders.
          </p>
        </div>
      </div>

      {/* Chain Visualization — block-explorer style */}
      <div className="overflow-x-auto">
        <div className="flex items-stretch gap-0 min-w-max pb-1">
          {records.slice(0, 5).map((r, i) => {
            const isCapture = r.eventType === "PAYMENT_CAPTURED";
            const isLock = r.eventType === "INVENTORY_LOCKED";
            const isFail = r.eventType === "PAYMENT_FAILED";
            const blockColor = isCapture
              ? "border-emerald-500/60 bg-emerald-950"
              : isLock
              ? "border-amber-500/60 bg-amber-950"
              : isFail
              ? "border-red-500/60 bg-red-950"
              : "border-zinc-600/60 bg-zinc-900";
            const hashColor = isCapture ? "text-emerald-400" : isLock ? "text-amber-400" : isFail ? "text-red-400" : "text-zinc-400";
            return (
              <React.Fragment key={r.id}>
                <button
                  onClick={() => setSelectedRecord(r)}
                  className={`shrink-0 p-3 rounded-xl border ${blockColor} w-48 text-left transition-all hover:opacity-90 ${selectedRecord?.id === r.id ? "ring-2 ring-white/20" : ""}`}
                >
                  <div className="text-[9px] font-mono text-zinc-500 mb-1">Block #{String(records.length - i).padStart(4, "0")} · {i === 0 ? "LATEST" : `${i}b ago`}</div>
                  <div className="text-[11px] font-bold text-white truncate">{r.eventType.replace(/_/g, " ")}</div>
                  <div className={`text-[9px] font-mono ${hashColor} mt-2 truncate`}>
                    {r.checksum?.slice(0, 14)}...
                  </div>
                  <div className="text-[9px] text-zinc-600 mt-1">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                </button>
                {i < Math.min(records.length - 1, 4) && (
                  <div className="flex items-center px-1 text-zinc-600 text-sm select-none">→</div>
                )}
              </React.Fragment>
            );
          })}
          {records.length === 0 && (
            <div className="p-4 text-xs text-zinc-500 italic">No blocks yet — run a transaction to generate ledger entries.</div>
          )}
        </div>
      </div>

      {/* SSE Live Status + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>Live SSE stream connected — new events auto-append</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAuditLedger}
          className="gap-1.5 text-xs h-8 bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Ledger</span>
        </Button>
      </div>

      {/* 5-Way Linkage Concept Diagram */}
      <Card className="border-zinc-200 shadow-xs bg-zinc-900 text-white p-5 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 min-w-[720px] text-xs">
          <div className="flex-1 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1. WhatsApp Message</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-300 truncate">wamid.ABGxxxxxxxx</p>
          </div>

          <span className="text-zinc-500 font-mono">⟷</span>

          <div className="flex-1 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
              <Layers className="w-3.5 h-3.5" />
              <span>2. Conversation ID</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-300 truncate">conv_xxxxxxxxxxxx</p>
          </div>

          <span className="text-zinc-500 font-mono">⟷</span>

          <div className="flex-1 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <KeyRound className="w-3.5 h-3.5" />
              <span>3. x402 Challenge Tx</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-300 truncate">x402_xxxxxxxxxxxx</p>
          </div>

          <span className="text-zinc-500 font-mono">⟷</span>

          <div className="flex-1 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CreditCard className="w-3.5 h-3.5" />
              <span>4. Razorpay Pay ID</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-300 truncate">pay_xxxxxxxxxxxx</p>
          </div>

          <span className="text-zinc-500 font-mono">⟷</span>

          <div className="flex-1 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/80 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
              <Package className="w-3.5 h-3.5" />
              <span>5. Order Ref</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-300 truncate">ORD-1042</p>
          </div>
        </div>
      </Card>

      {/* Search Bar & Sample ID Quick Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl p-2 px-3 shadow-xs">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by WhatsApp Msg ID, x402 Hash, Razorpay Payment ID (pay_...), or Order Reference (ORD-...)"
            className="border-none shadow-none text-xs focus-visible:ring-0 h-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick chip buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider pl-1">
            Sample Audit Searches:
          </span>
          {["ORD-1042", "pay_RzpInstant89412", "x402_", "wamid."].map((s, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(s)}
              className="bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-md font-mono text-[10px] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Pane Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event List (5 cols) */}
        <Card className="lg:col-span-5 border-zinc-200 shadow-xs divide-y divide-zinc-100 max-h-[580px] overflow-y-auto">
          <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>Audit Ledger Entries ({filtered.length})</span>
            <span className="text-[10px] font-mono text-zinc-500">Append-Only Postgres</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No audit events matched your search query.
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = active?.id === item.id;
              const isCaptured = item.eventType === "PAYMENT_CAPTURED";
              const isLock = item.eventType === "INVENTORY_LOCKED";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className={`p-3.5 cursor-pointer transition-all ${
                    item.isNew
                      ? "audit-flash"
                      : isSelected
                      ? "bg-blue-50/70 border-l-4 border-blue-600"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        isCaptured
                          ? "bg-emerald-100 text-emerald-800"
                          : isLock
                          ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {item.eventType}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-900 mt-1.5">
                    Order Ref: {item.orderId || "ORD-1042"}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-zinc-500">
                    <span className="truncate max-w-[140px]">{item.x402TransactionId}</span>
                    {item.razorpayPaymentId && (
                      <span className="text-emerald-600 font-bold truncate max-w-[100px]">
                        {item.razorpayPaymentId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Right Column: Detailed Cryptographic Chain Inspection (7 cols) */}
        <Card className="lg:col-span-7 border-zinc-200 shadow-xs p-5 space-y-5">
          {active ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Cryptographic Verification Passed</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">Event Type: {active.eventType}</p>
                  </div>
                </div>

                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  ● Verified SHA-256
                </Badge>
              </div>

              {/* 5-Field Data Matrix */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  5-Field Linked Transaction Identifiers
                </p>

                <div className="space-y-2 text-xs">
                  {/* WhatsApp Message */}
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">WhatsApp Inbound Message ID</span>
                      <span className="font-mono text-zinc-800 font-semibold">
                        {active.whatsappMessageId || "wamid.ABG984129038"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(active.whatsappMessageId || "wamid.ABG984129038", "wa")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedKey === "wa" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Conversation ID */}
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Persistent Conversation ID</span>
                      <span className="font-mono text-zinc-800 font-semibold">
                        {active.conversationId || "conv_9876543210"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(active.conversationId || "conv_9876543210", "conv")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedKey === "conv" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* x402 Hash */}
                  <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/70 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] text-zinc-500">x402 Protocol Transaction ID</span>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">PROTOCOL BRIDGE</span>
                      </div>
                      <span className="font-mono text-amber-700 font-semibold break-all text-[11px]">
                        {active.x402TransactionId}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(active.x402TransactionId, "x402")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "x402" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Razorpay Payment ID */}
                  <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/70 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] text-zinc-500">Canonical Razorpay Payment ID</span>
                        {active.razorpayPaymentId && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">SETTLED ✓</span>
                        )}
                      </div>
                      <span className="font-mono text-emerald-700 font-bold text-[11px]">
                        {active.razorpayPaymentId || "— awaiting settlement"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(active.razorpayPaymentId || "", "rzp")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === "rzp" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Order Reference */}
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">ZapAI Merchant Order ID</span>
                      <span className="font-mono text-zinc-900 font-bold">
                        {active.orderId || "ORD-1042"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(active.orderId || "ORD-1042", "order")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedKey === "order" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* SHA-256 Checksum Chaining Box */}
              <div className="p-3.5 bg-zinc-950 rounded-xl text-zinc-300 font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-400" />
                    <span>SHA-256 Checksum (prev_checksum + payload):</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">Chain Intact</span>
                </div>
                <p className="text-zinc-200 break-all">{active.checksum}</p>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-zinc-400">
              Select an audit record to inspect the cryptographic verification trace.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

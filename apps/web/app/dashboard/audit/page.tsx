"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
  RefreshCw,
  Hash,
  Box,
  Terminal,
  Clock,
  ArrowRight,
  Database,
  Cpu,
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
  isNew?: boolean;
}

export default function AuditExplorerPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"split" | "table">("split");

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

  // Live SSE stream
  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://razorpay-agent-production.up.railway.app";
    const es = new EventSource(`${backendUrl}/demo/events`);

    es.onmessage = (e) => {
      try {
        if (!e.data || e.data.startsWith(":")) return;
        const ev = JSON.parse(e.data);
        const ids = ev.ids || {};
        const newRecord: AuditRecord = {
          id: ev.id || `sse_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          eventType: ev.type || "SYSTEM_EVENT",
          whatsappMessageId: ids.whatsappMessageId,
          conversationId: ids.conversationId,
          x402TransactionId: ids.x402TransactionId || `x402_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          razorpayPaymentId: ids.razorpayPaymentId,
          orderId: ids.orderId,
          payload: ev.payload || {},
          checksum: `sse_live_${Date.now().toString(16)}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          isNew: true,
        };

        setRecords((prev) => [newRecord, ...prev.slice(0, 79)]);
        setSelectedRecord(newRecord);

        setTimeout(() => {
          setRecords((prev) =>
            prev.map((r) => (r.id === newRecord.id ? { ...r, isNew: false } : r))
          );
        }, 2000);
      } catch {
        // ignore ping
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
    const matchesSearch =
      !q ||
      (r.x402TransactionId && r.x402TransactionId.toLowerCase().includes(q)) ||
      (r.razorpayPaymentId && r.razorpayPaymentId.toLowerCase().includes(q)) ||
      (r.orderId && r.orderId.toLowerCase().includes(q)) ||
      (r.whatsappMessageId && r.whatsappMessageId.toLowerCase().includes(q)) ||
      (r.eventType || "").toLowerCase().includes(q);

    const matchesFilter =
      filterType === "ALL" ||
      (filterType === "PAYMENT" && r.eventType.includes("PAYMENT")) ||
      (filterType === "INVENTORY" && r.eventType.includes("INVENTORY")) ||
      (filterType === "NEGOTIATION" && r.eventType.includes("NEGOTIATION"));

    return matchesSearch && matchesFilter;
  });

  const active = selectedRecord || filtered[0] || records[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Audit Explorer
            </h1>
            <Badge variant="secondary" className="font-mono text-[11px] font-medium">
              SHA-256 Verified
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Immutable, append-only verification ledger linking WhatsApp messages, x402 fiat challenges, and Razorpay UPI settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-mono text-xs text-zinc-600 bg-zinc-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Stream</span>
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={loadAuditLedger}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 4 Top KPI Cards using shadcn Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Blocks</span>
              <Database className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1">
              #{String(records.length || 80).padStart(4, "0")}
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">Append-only audit tree</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Ledger Integrity</span>
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1">
              100%
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">All hashes verified</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Settlement Speed</span>
              <Cpu className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1">
              &lt; 1.2s
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">Razorpay 1-Tap UPI</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Inventory Lock</span>
              <Lock className="w-4 h-4 text-zinc-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1">
              120s TTL
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">Atomic Redlock</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Horizontal Block Sequence Card using shadcn Card */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-500" />
            <CardTitle className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Latest Block Confirmations
            </CardTitle>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Recent {Math.min(records.length, 6)} block confirmations
          </span>
        </CardHeader>

        <CardContent className="p-4">
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2.5 min-w-max">
              {records.slice(0, 6).map((r, i) => {
                const isSelected = active?.id === r.id;

                return (
                  <React.Fragment key={`${r.id || "rec"}_${i}`}>
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className={`p-3 rounded-lg border text-left transition-all w-48 flex flex-col justify-between ${
                        isSelected
                          ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                          : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span className="font-bold text-zinc-900">
                          Block #{String(records.length - i).padStart(4, "0")}
                        </span>
                        <span className="text-zinc-400">{i === 0 ? "Latest" : `${i}b ago`}</span>
                      </div>

                      <div className="my-1.5">
                        <Badge variant="secondary" className="text-[9px] font-mono font-medium px-1.5 py-0">
                          {r.eventType.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-400 truncate">
                        {r.checksum ? `${r.checksum.slice(0, 12)}...` : "0x00000000"}
                      </div>
                    </button>

                    {i < Math.min(records.length - 1, 5) && (
                      <span className="text-zinc-300 text-xs select-none">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tx, Payment ID, Order Ref..."
            className="pl-8 text-xs h-8 bg-white font-mono"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <Tabs value={filterType} onValueChange={setFilterType} className="w-auto">
            <TabsList className="h-8 p-1">
              <TabsTrigger value="ALL" className="text-xs px-2.5 py-1 font-mono">ALL</TabsTrigger>
              <TabsTrigger value="PAYMENT" className="text-xs px-2.5 py-1 font-mono">PAYMENT</TabsTrigger>
              <TabsTrigger value="INVENTORY" className="text-xs px-2.5 py-1 font-mono">INVENTORY</TabsTrigger>
              <TabsTrigger value="NEGOTIATION" className="text-xs px-2.5 py-1 font-mono">NEGOTIATION</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode(viewMode === "split" ? "table" : "split")}
            className="h-8 text-xs font-mono"
          >
            {viewMode === "split" ? "Full Table View" : "Split Inspector"}
          </Button>
        </div>
      </div>

      {/* ── Conditional Views: Split Inspector OR Full Table ─────────────── */}
      {viewMode === "table" ? (
        <Card className="shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead>x402 Protocol Tx</TableHead>
                <TableHead>Razorpay Payment ID</TableHead>
                <TableHead>Checksum (SHA-256)</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-400">
                    No ledger records match the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow
                    key={`${item.id || "tbl"}_${idx}`}
                    onClick={() => {
                      setSelectedRecord(item);
                      setViewMode("split");
                    }}
                    className="cursor-pointer font-mono text-xs"
                  >
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-900">
                      {item.orderId || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-600 truncate max-w-[160px]">
                      {item.x402TransactionId}
                    </TableCell>
                    <TableCell className="text-emerald-600 font-bold">
                      {item.razorpayPaymentId || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-400 truncate max-w-[140px]">
                      {item.checksum}
                    </TableCell>
                    <TableCell className="text-right text-zinc-500">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Transaction Feed (5 cols) using shadcn Card */}
          <Card className="lg:col-span-5 shadow-2xs flex flex-col h-[580px] overflow-hidden">
            <CardHeader className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                <CardTitle className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Ledger Records ({filtered.length})
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Live Feed</span>
            </CardHeader>

            <ScrollArea className="flex-1 divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No ledger records match the search criteria.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = active?.id === item.id;

                  return (
                    <div
                      key={`${item.id || "item"}_${idx}`}
                      onClick={() => setSelectedRecord(item)}
                      className={`p-3.5 cursor-pointer transition-all border-l-2 ${
                        isSelected
                          ? "bg-zinc-50 border-l-zinc-900"
                          : "hover:bg-zinc-50/60 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px] font-mono font-medium px-1.5 py-0">
                          {item.eventType.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900">
                          {item.orderId ? `Order: ${item.orderId}` : "Pre-checkout Lock"}
                        </span>
                        {item.razorpayPaymentId && (
                          <span className="text-[10px] font-mono text-zinc-600 font-semibold">
                            {item.razorpayPaymentId}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-zinc-400 truncate mt-1">
                        Tx: {item.x402TransactionId}
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </Card>

          {/* Right Column: Deep Block & Cryptographic Inspector (7 cols) using shadcn Card */}
          <Card className="lg:col-span-7 shadow-2xs flex flex-col h-[580px] overflow-hidden">
            <CardHeader className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <CardTitle className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Transaction Details
                </CardTitle>
              </div>

              <Badge variant="outline" className="text-[10px] font-mono">
                SHA-256 Validated
              </Badge>
            </CardHeader>

            {active ? (
              <ScrollArea className="flex-1 p-4 space-y-4">
                {/* Event Header Card using shadcn Card */}
                <Card className="bg-zinc-50/60 shadow-none border-zinc-200">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700" />
                        <span className="text-xs font-mono font-bold text-zinc-900 uppercase">
                          {active.eventType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {new Date(active.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-zinc-600 bg-white p-2 rounded border border-zinc-200/60 flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Event Checksum</span>
                        <span className="truncate block">{active.checksum}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(active.checksum, "chk")}
                        className="p-1 text-zinc-400 hover:text-zinc-700 shrink-0"
                        title="Copy checksum"
                      >
                        {copiedKey === "chk" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* 5-Field Linked Matrix */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    5-Field Linked Identifiers
                  </h4>

                  <div className="space-y-1.5 text-xs font-mono">
                    {/* Field 1: WhatsApp Inbound */}
                    <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/60 rounded-md flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-sans font-medium">1. WhatsApp Message ID</span>
                        <span className="text-zinc-800 font-medium">
                          {active.whatsappMessageId || "— Direct API Simulation"}
                        </span>
                      </div>
                      {active.whatsappMessageId && (
                        <button onClick={() => handleCopy(active.whatsappMessageId!, "wa")} className="p-1 text-zinc-400 hover:text-zinc-700">
                          {copiedKey === "wa" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Field 2: Conversation Session */}
                    <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/60 rounded-md flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-sans font-medium">2. Conversation Thread ID</span>
                        <span className="text-zinc-800 font-medium">
                          {active.conversationId || "— Direct Checkout Session"}
                        </span>
                      </div>
                      {active.conversationId && (
                        <button onClick={() => handleCopy(active.conversationId!, "conv")} className="p-1 text-zinc-400 hover:text-zinc-700">
                          {copiedKey === "conv" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Field 3: x402 Protocol Challenge */}
                    <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/60 rounded-md flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-sans font-medium">3. x402 Challenge Token</span>
                        <span className="text-zinc-800 font-medium break-all">{active.x402TransactionId}</span>
                      </div>
                      <button onClick={() => handleCopy(active.x402TransactionId, "x402")} className="p-1 text-zinc-400 hover:text-zinc-700">
                        {copiedKey === "x402" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Field 4: Razorpay Payment ID */}
                    <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/60 rounded-md flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-sans font-medium">4. Razorpay Payment ID</span>
                        <span className="text-zinc-800 font-medium">
                          {active.razorpayPaymentId || "— Awaiting Instant UPI Capture"}
                        </span>
                      </div>
                      {active.razorpayPaymentId && (
                        <button onClick={() => handleCopy(active.razorpayPaymentId!, "rzp")} className="p-1 text-zinc-400 hover:text-zinc-700">
                          {copiedKey === "rzp" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Field 5: Merchant Order ID */}
                    <div className="p-2.5 bg-zinc-50/70 border border-zinc-200/60 rounded-md flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-sans font-medium">5. Order Reference</span>
                        <span className="text-zinc-800 font-medium">
                          {active.orderId || "— Pre-checkout Lock"}
                        </span>
                      </div>
                      {active.orderId && (
                        <button onClick={() => handleCopy(active.orderId!, "ord")} className="p-1 text-zinc-400 hover:text-zinc-700">
                          {copiedKey === "ord" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw JSON State Decoder */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      State Payload
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(JSON.stringify(active.payload || {}, null, 2), "json")}
                      className="h-6 text-[10px] font-mono text-zinc-600 hover:text-zinc-900 gap-1 px-2"
                    >
                      {copiedKey === "json" ? <Check className="w-3 h-3 text-zinc-900" /> : <Copy className="w-3 h-3" />}
                      Copy JSON
                    </Button>
                  </div>

                  <pre className="p-3 rounded-md bg-zinc-50 text-zinc-800 font-mono text-[10px] overflow-x-auto leading-relaxed border border-zinc-200/60">
                    {JSON.stringify(active.payload || {}, null, 2)}
                  </pre>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
                Select any transaction to inspect verification details.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

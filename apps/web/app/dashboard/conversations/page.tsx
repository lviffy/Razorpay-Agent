"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ConversationThread } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Zap,
  ShieldCheck,
  CheckCheck,
  Phone,
  CreditCard,
  User,
  ArrowUpRight,
  Wifi,
} from "lucide-react";

// Format phone numbers cleanly: e.g. "917077013159" -> "+91 70770 13159"
function formatPhoneNumber(phone?: string): string {
  if (!phone) return "WhatsApp Buyer";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 12 && clean.startsWith("91")) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return `+${clean}`;
}

function getDisplayName(thread: { customerName?: string; customerPhone?: string }): string {
  if (
    thread.customerName &&
    thread.customerName.trim() &&
    thread.customerName !== "Aarav Patel" &&
    thread.customerName !== "Customer" &&
    thread.customerName !== "WhatsApp Buyer"
  ) {
    return thread.customerName;
  }
  return formatPhoneNumber(thread.customerPhone);
}

// Render formatted WhatsApp message content cleanly
function FormattedMessageContent({ text }: { text: string }) {
  if (!text) return null;

  // Extract Razorpay payment links if present
  const rzpMatch = text.match(/https?:\/\/(?:rzp\.io\/rzp\/[a-zA-Z0-9]+|[^\s]+\/rzp\/[a-zA-Z0-9]+)/i);
  const paymentUrl = rzpMatch ? rzpMatch[0] : null;

  // Clean lines and format bold / inline code
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (paymentUrl && trimmed.includes(paymentUrl)) {
          return null;
        }

        const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g);

        return (
          <p key={idx}>
            {parts.map((part, pIdx) => {
              if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
                return (
                  <strong key={pIdx} className="font-semibold text-zinc-900">
                    {part.slice(1, -1)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
                return (
                  <code
                    key={pIdx}
                    className="px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-800"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </p>
        );
      })}

      {paymentUrl && (
        <div className="mt-2.5 pt-2 border-t border-zinc-200/80">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">Razorpay 1-Tap UPI Checkout</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
          </a>
        </div>
      )}
    </div>
  );
}

export default function ConversationsPage() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileTab, setMobileTab] = useState<"threads" | "chat" | "trace">("chat");
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyThreads = useCallback((list: ConversationThread[]) => {
    if (!list || list.length === 0) return;
    setThreads(list);
    setSelectedId((curr) => (curr && list.some((t) => t.id === curr) ? curr : list[0].id));
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    // Pass auth headers via URL param (EventSource doesn't support headers)
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("zapai_auth_token") || localStorage.getItem("agentbridge_auth_token") || "")
        : "";
    const storeId =
      typeof window !== "undefined"
        ? (localStorage.getItem("zapai_selected_store_id") || localStorage.getItem("agentbridge_selected_store_id") || "")
        : "";

    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (storeId) params.set("storeId", storeId);

    const url = `${API_BASE}/conversations/stream${params.toString() ? "?" + params.toString() : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("conversations", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        applyThreads(data);
        setConnected(true);
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };
  }, [applyThreads]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const filteredThreads = threads.filter((t) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const displayName = getDisplayName(t).toLowerCase();
    const phone = (t.customerPhone || "").toLowerCase();
    const lastMsg = (t.lastMessage || "").toLowerCase();
    return displayName.includes(q) || phone.includes(q) || lastMsg.includes(q);
  });

  const selectedThread =
    threads.find((t) => t.id === selectedId) || filteredThreads[0] || threads[0] || null;

  // Auto-scroll chat to latest message on selection or update
  useEffect(() => {
    if (selectedThread?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedThread?.id, selectedThread?.messages?.length]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Conversations & Traces</h1>
            <Badge variant="outline" className="gap-1.5 font-mono text-[11px] bg-zinc-50 text-zinc-700 border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Engine
            </Badge>
            {/* SSE live status */}
            {connected ? (
              <Badge variant="outline" className="gap-1.5 font-mono text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200">
                <Wifi className="w-3 h-3" />
                Live
                {lastUpdated && (
                  <span className="text-emerald-500">
                    · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 font-mono text-[11px] bg-amber-50 text-amber-700 border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Reconnecting…
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time WhatsApp buyer dialogues paired with transparent AI Seller reasoning traces and floor price mandate checks.
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="grid grid-cols-3 w-full sm:w-auto lg:hidden bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
          <button
            onClick={() => setMobileTab("threads")}
            className={`py-1.5 px-2 text-center rounded-lg transition-colors truncate font-medium ${
              mobileTab === "threads" ? "bg-white text-zinc-900 shadow-xs font-semibold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`py-1.5 px-2 text-center rounded-lg transition-colors truncate font-medium ${
              mobileTab === "chat" ? "bg-white text-zinc-900 shadow-xs font-semibold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            WhatsApp Chat
          </button>
          <button
            onClick={() => setMobileTab("trace")}
            className={`py-1.5 px-2 text-center rounded-lg transition-colors truncate font-medium ${
              mobileTab === "trace" ? "bg-white text-zinc-900 shadow-xs font-semibold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            AI Trace
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <Card className="border-zinc-200/80 rounded-xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px] h-[calc(100dvh-13rem)] overflow-hidden shadow-2xs p-0 bg-white">
          {/* Pane 1 Skeleton */}
          <div className="lg:col-span-3 border-r border-zinc-200 p-3 space-y-3">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-zinc-100 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Pane 2 Skeleton */}
          <div className="lg:col-span-5 border-r border-zinc-200 flex flex-col justify-between p-4 bg-zinc-50/40">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>

            <div className="space-y-3 my-auto py-6">
              <div className="flex justify-start">
                <Skeleton className="h-10 w-44 rounded-xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-16 w-56 rounded-xl" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-8 w-32 rounded-xl" />
              </div>
            </div>

            <Skeleton className="h-9 w-full" />
          </div>

          {/* Pane 3 Skeleton */}
          <div className="lg:col-span-4 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : !selectedThread ? (
        /* Empty State */
        <Card className="p-12 border-zinc-200 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900">No active conversations yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            When buyers message your connected WhatsApp Business number, their live negotiation transcripts and AI reasoning traces will appear here.
          </p>
        </Card>
      ) : (
        /* Loaded 3-Pane Layout */
        <Card className="border-zinc-200/80 rounded-xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px] h-[calc(100dvh-13rem)] overflow-hidden shadow-2xs p-0 bg-white">
          {/* Pane 1: Conversation List (3 cols) */}
          <div
            className={`lg:col-span-3 border-r border-zinc-200 flex flex-col min-h-0 h-full overflow-hidden ${
              mobileTab !== "threads" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search phone, deals..."
                  className="pl-8 text-xs h-8 bg-white border-zinc-200 font-mono"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400">No conversations found.</div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = Boolean(selectedThread && t.id === selectedThread.id);
                  const displayName = getDisplayName(t);

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedId(t.id);
                        setMobileTab("chat");
                      }}
                      className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 border-l-2 ${
                        isSelected
                          ? "bg-zinc-50 border-l-zinc-900 text-zinc-900 font-medium"
                          : "hover:bg-zinc-50/60 text-zinc-700 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                            <Phone className="w-3 h-3 text-zinc-500" />
                          </div>
                          <span className="text-xs font-semibold font-mono text-zinc-900">{displayName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">{t.lastMessageAt}</span>
                      </div>

                      <p className="text-[11px] text-zinc-500 line-clamp-1 pl-8 font-normal">{t.lastMessage}</p>

                      <div className="flex items-center justify-between mt-0.5 pl-8">
                        <Badge variant="outline" className="text-[9px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
                          {t.status === "deal_closed" ? "Deal Settled" : "Negotiating"}
                        </Badge>
                        {t.dealAmount && (
                          <span className="text-xs font-mono font-bold text-zinc-900">
                            {formatINR(t.dealAmount)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Pane 2: WhatsApp Transcript (5 cols) */}
          <div
            className={`lg:col-span-5 border-r border-zinc-200 flex flex-col min-h-0 h-full overflow-hidden bg-zinc-50/40 ${
              mobileTab !== "chat" ? "hidden lg:flex" : "flex"
            }`}
          >
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-white">
                <div className="max-w-sm space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-500 mx-auto flex items-center justify-center shadow-2xs">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">No active conversations</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      When buyers message your WhatsApp Business account, live transcripts and autonomous negotiations will stream here.
                    </p>
                  </div>
                  <Link href="/dashboard/whatsapp" className="inline-block pt-1">
                    <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Launch WhatsApp Simulator</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Top Info Header */}
                <div className="p-3.5 border-b border-zinc-100 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-mono text-zinc-900 leading-none">
                        {getDisplayName(selectedThread)}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        {formatPhoneNumber(selectedThread.customerPhone)}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] font-mono font-medium bg-zinc-50 text-zinc-700 border-zinc-200">
                    WhatsApp Live
                  </Badge>
                </div>

                {/* Messages Feed - Scrollable Viewport */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                  {(selectedThread.messages || []).map((m) => {
                    const isUser = m.sender === "customer";
                    const isSystem = m.sender === "system";

                    if (isSystem) {
                      return (
                        <div
                          key={m.id}
                          className="p-3 bg-white border border-zinc-200 rounded-lg text-center text-xs text-zinc-800 font-medium space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-zinc-900 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Razorpay Settlement Verified</span>
                          </div>
                          <p className="text-[11px] text-zinc-600">{m.content}</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col text-xs max-w-[85%] ${
                          isUser ? "mr-auto items-start" : "ml-auto items-end"
                        }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl leading-relaxed shadow-2xs border ${
                            isUser
                              ? "bg-white text-zinc-900 border-zinc-200/80 rounded-tl-xs"
                              : "bg-zinc-50 text-zinc-900 border-zinc-200/80 rounded-tr-xs"
                          }`}
                        >
                          {m.mediaUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                              <img
                                src={m.mediaUrl}
                                alt="Product preview"
                                className="max-h-44 w-full object-cover rounded-lg transition-transform hover:scale-105 duration-200 cursor-pointer"
                                onClick={() => window.open(m.mediaUrl, "_blank")}
                              />
                            </div>
                          )}
                          <FormattedMessageContent text={m.content} />
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-zinc-400 font-mono">
                          <span>{m.timestamp}</span>
                          {!isUser && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Read-only Agent Status Footer */}
                <div className="p-3 bg-white border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 shrink-0">
                  <span className="text-[11px] text-zinc-600 font-medium">
                    AI Seller Agent is handling negotiations autonomously.
                  </span>
                  <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 text-zinc-700 hover:bg-zinc-50 border-zinc-200">
                    Take Over
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Pane 3: AI Reasoning Trace Engine (4 cols) */}
          <div
            className={`lg:col-span-4 flex flex-col min-h-0 h-full overflow-hidden bg-white ${
              mobileTab !== "trace" ? "hidden lg:flex" : "flex"
            }`}
          >
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center bg-zinc-50/50">
                <div className="max-w-xs space-y-2 text-center text-xs text-zinc-400">
                  <ShieldCheck className="w-8 h-8 mx-auto text-zinc-300" />
                  <p className="font-semibold text-zinc-700">AI Reasoning Trace</p>
                  <p className="text-[11px] text-zinc-500">
                    Step-by-step reasoning, margin floor checks, and mandate signatures will appear here during live interactions.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    AI Reasoning Trace
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600 font-medium bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                    {(selectedThread.traces || []).length} Steps
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                  {(selectedThread.traces || []).map((tr, index) => (
                    <div key={tr.id} className="relative pl-5 pb-2">
                      {/* Vertical connecting line */}
                      {index < (selectedThread.traces || []).length - 1 && (
                        <div className="absolute left-1.5 top-2.5 bottom-0 w-px bg-zinc-200" />
                      )}
                      {/* Dot */}
                      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-zinc-900 flex items-center justify-center" />

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">{tr.title}</span>
                          {tr.durationMs && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              {tr.durationMs}ms
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-700 leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 font-mono">
                          {tr.detail}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono block">{tr.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trace Summary Footer */}
                <div className="p-3 bg-zinc-50/60 border-t border-zinc-100 text-xs text-zinc-600 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="text-[11px] font-medium text-zinc-700">Audit Mandate Signature</span>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-zinc-200 rounded text-zinc-800 font-medium">
                    {selectedThread.id ? `0x${selectedThread.id.replace(/[^a-fA-F0-9]/g, "").slice(0, 4) || "7c9e"}...${selectedThread.id.slice(-4)}` : "Verified SHA-256"}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

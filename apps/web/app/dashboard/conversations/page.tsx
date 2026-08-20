"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ConversationThread } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  ExternalLink,
  ShieldCheck,
  Bot,
  User,
  ListFilter,
  BrainCircuit,
} from "lucide-react";

export default function ConversationsPage() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedId, setSelectedId] = useState<string>("conv_1");
  const [mobileTab, setMobileTab] = useState<"threads" | "chat" | "trace">("chat");

  useEffect(() => {
    async function load() {
      const list = await api.conversations.list();
      setThreads(list);
    }
    load();
  }, []);

  const selectedThread = threads.find((t) => t.id === selectedId) || threads[0];

  if (!selectedThread) {
    return <div className="text-xs text-surface-500">Loading conversations...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">AI Conversations & Traces</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            Real-time WhatsApp buyer dialogues paired with transparent AI Seller reasoning traces.
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex items-center gap-1 lg:hidden bg-surface-100 p-1 rounded-lg border border-surface-200 self-start">
          <button
            onClick={() => setMobileTab("threads")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === "threads" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === "chat" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            WhatsApp Chat
          </button>
          <button
            onClick={() => setMobileTab("trace")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === "trace" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            AI Trace
          </button>
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="bg-white border border-surface-200 rounded-xl grid grid-cols-1 lg:grid-cols-12 min-h-[560px] lg:h-[calc(100vh-13rem)] overflow-hidden shadow-subtle">
        {/* Pane 1: Conversation List (3 cols) */}
        <div
          className={`lg:col-span-3 border-r border-surface-200 flex flex-col ${
            mobileTab !== "threads" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-surface-200 bg-surface-50">
            <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-surface-400" />
              <input
                type="text"
                aria-label="Search conversations"
                placeholder="Search conversations..."
                className="bg-transparent border-none outline-none w-full text-xs text-surface-900 placeholder:text-surface-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
            {threads.map((t) => {
              const isSelected = t.id === selectedThread.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setMobileTab("chat");
                  }}
                  className={`w-full text-left p-3.5 transition-all flex flex-col gap-1 ${
                    isSelected
                      ? "bg-brand-50/80 text-surface-900 font-medium ring-1 ring-inset ring-brand-500/20"
                      : "hover:bg-surface-50 text-surface-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-surface-900">{t.customerName}</span>
                    <span className="text-[10px] text-surface-500 font-mono">{t.lastMessageAt}</span>
                  </div>
                  <p className="text-[11px] text-surface-500 line-clamp-1">{t.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant={t.status === "deal_closed" ? "success" : "brand"}>
                      {t.status === "deal_closed" ? "Deal Closed" : "Negotiating"}
                    </Badge>
                    {t.dealAmount && (
                      <span className="text-xs font-mono font-bold text-surface-900">
                        {formatINR(t.dealAmount)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pane 2: WhatsApp Transcript (5 cols) */}
        <div
          className={`lg:col-span-5 border-r border-surface-200 flex flex-col bg-[#F8FAFC] ${
            mobileTab !== "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top Info */}
          <div className="p-3 border-b border-surface-200 bg-white flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-surface-900">{selectedThread.customerName}</p>
              <p className="text-[11px] text-surface-500 font-mono">{selectedThread.customerPhone}</p>
            </div>
            <Badge variant="brand">WhatsApp Cloud API</Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {selectedThread.messages.map((m) => {
              const isUser = m.sender === "customer";
              const isSystem = m.sender === "system";

              if (isSystem) {
                return (
                  <div
                    key={m.id}
                    className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-800 font-medium"
                  >
                    {m.content}
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
                    className={`p-3 rounded-xl border leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-white text-surface-900 border-surface-200"
                        : "bg-[#0C2340] text-white border-[#0A1D36]"
                    }`}
                  >
                    <p>{m.content}</p>
                    {m.metadata?.isPaymentLink && (
                      <div className="mt-2.5 pt-2.5 border-t border-blue-900/60 flex items-center justify-between text-[11px]">
                        <span className="text-blue-300 font-mono">
                          Razorpay {formatINR(m.metadata.offerAmount || 0)}
                        </span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready to Pay
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-surface-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}
          </div>

          {/* Read-only Agent Status Footer */}
          <div className="p-3 bg-white border-t border-surface-200 flex items-center justify-between text-xs text-surface-500">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              AI Seller Agent is handling this conversation automatically.
            </span>
            <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 rounded-md">
              Take Over
            </Button>
          </div>
        </div>

        {/* Pane 3: AI Reasoning Trace Engine (4 cols) */}
        <div
          className={`lg:col-span-4 flex flex-col bg-white ${
            mobileTab !== "trace" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#195adc]" />
              <span className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                AI Trace Engine
              </span>
            </div>
            <span className="text-[10px] font-mono text-surface-500 font-semibold">
              {selectedThread.traces.length} STEPS
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {selectedThread.traces.map((tr, index) => (
              <div key={tr.id} className="relative pl-5 pb-2">
                {/* Vertical connecting line */}
                {index < selectedThread.traces.length - 1 && (
                  <div className="absolute left-1.5 top-3 bottom-0 w-0.5 bg-surface-200" />
                )}
                {/* Dot */}
                <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-brand-50 border-2 border-[#195adc]" />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-surface-900">{tr.title}</span>
                    {tr.durationMs && (
                      <span className="text-[10px] font-mono text-surface-400">
                        {tr.durationMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-surface-600 leading-normal bg-surface-50 p-2.5 rounded-lg border border-surface-200 font-mono">
                    {tr.detail}
                  </p>
                  <span className="text-[10px] text-surface-400 font-mono">{tr.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trace Summary Footer */}
          <div className="p-3 bg-surface-50 border-t border-surface-200 text-xs text-surface-600 flex items-center justify-between">
            <span className="text-[11px] font-medium">Audit Mandate Signature</span>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-surface-200 rounded text-surface-700">
              0x9a8f...4e12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

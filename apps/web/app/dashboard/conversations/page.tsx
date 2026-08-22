"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ConversationThread } from "@/lib/types";
import { initialMockConversations } from "@/lib/api/mock-data";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  CheckCheck,
  Layers,
} from "lucide-react";

export default function ConversationsPage() {
  const [threads, setThreads] = useState<ConversationThread[]>(initialMockConversations);
  const [selectedId, setSelectedId] = useState<string>("conv_1");
  const [mobileTab, setMobileTab] = useState<"threads" | "chat" | "trace">("chat");

  useEffect(() => {
    async function load() {
      try {
        const list = await api.conversations.list();
        if (list && list.length > 0) {
          setThreads(list);
          setSelectedId((curr) => (list.some((t) => t.id === curr) ? curr : list[0].id));
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    }
    load();
  }, []);

  const selectedThread = threads.find((t) => t.id === selectedId) || threads[0] || initialMockConversations[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Conversations & Traces</h1>
            <Badge variant="outline" className="gap-1.5 font-medium text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              WhatsApp Engine
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time WhatsApp buyer dialogues paired with transparent AI Seller reasoning traces and floor price mandate checks.
          </p>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex items-center gap-1 lg:hidden bg-zinc-100 p-1 rounded-lg border border-zinc-200 self-start text-xs">
          <button
            onClick={() => setMobileTab("threads")}
            className={`px-3 py-1 rounded-md transition-colors ${
              mobileTab === "threads" ? "bg-white text-zinc-900 font-medium shadow-xs" : "text-zinc-600"
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`px-3 py-1 rounded-md transition-colors ${
              mobileTab === "chat" ? "bg-white text-zinc-900 font-medium shadow-xs" : "text-zinc-600"
            }`}
          >
            WhatsApp Chat
          </button>
          <button
            onClick={() => setMobileTab("trace")}
            className={`px-3 py-1 rounded-md transition-colors ${
              mobileTab === "trace" ? "bg-white text-zinc-900 font-medium shadow-xs" : "text-zinc-600"
            }`}
          >
            AI Trace
          </button>
        </div>
      </div>

      {/* 3-Pane Layout */}
      <Card className="border-zinc-200 rounded-xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:h-[calc(100vh-12rem)] overflow-hidden shadow-xs p-0">
        {/* Pane 1: Conversation List (3 cols) */}
        <div
          className={`lg:col-span-3 border-r border-zinc-200 flex flex-col ${
            mobileTab !== "threads" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-zinc-200 bg-zinc-50">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                aria-label="Search conversations"
                placeholder="Search leads, phone, deals..."
                className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {threads.map((t) => {
              const isSelected = t.id === selectedThread.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedId(t.id);
                    setMobileTab("chat");
                  }}
                  className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-zinc-100 border-l-2 border-zinc-900 text-zinc-900 font-medium"
                      : "hover:bg-zinc-50 text-zinc-700 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                        {t.customerName.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">{t.customerName}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">{t.lastMessageAt}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 pl-8 font-normal">{t.lastMessage}</p>
                  <div className="flex items-center justify-between mt-1 pl-8">
                    <Badge variant="outline" className="text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200">
                      {t.status === "deal_closed" ? "✓ Deal Closed" : "Negotiating"}
                    </Badge>
                    {t.dealAmount && (
                      <span className="text-xs font-mono font-bold text-zinc-900">
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
          className={`lg:col-span-5 border-r border-zinc-200 flex flex-col bg-zinc-50 ${
            mobileTab !== "chat" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Top Info Header */}
          <div className="p-3.5 border-b border-zinc-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                {selectedThread.customerName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 leading-none">{selectedThread.customerName}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">{selectedThread.customerPhone}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium bg-zinc-100 text-zinc-700 border-zinc-200 font-mono">
              WhatsApp Live
            </Badge>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-100/60">
            {selectedThread.messages.map((m) => {
              const isUser = m.sender === "customer";
              const isSystem = m.sender === "system";

              if (isSystem) {
                return (
                  <div
                    key={m.id}
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-center text-xs text-zinc-800 font-medium space-y-1 shadow-xs"
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
                    className={`p-3 rounded-xl leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-white text-zinc-900 border border-zinc-200 rounded-tl-none"
                        : "bg-zinc-900 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="text-xs">{m.content}</p>
                    {m.metadata?.isPaymentLink && (
                      <div className="mt-2 pt-2 border-t border-zinc-700 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-200 font-mono font-bold">
                          Razorpay {formatINR(m.metadata.offerAmount || 0)}
                        </span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1 font-mono text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready to Pay
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-zinc-400 font-mono">{m.timestamp}</span>
                    {!isUser && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Read-only Agent Status Footer */}
          <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[11px] text-zinc-600">
              AI Seller Agent is handling negotiations autonomously.
            </span>
            <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 text-zinc-700 hover:bg-zinc-50 border-zinc-300">
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
          <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              AI Reasoning Trace
            </span>
            <span className="text-[10px] font-mono text-zinc-600 font-medium bg-zinc-200/80 px-2 py-0.5 rounded">
              {selectedThread.traces.length} Steps
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {selectedThread.traces.map((tr, index) => (
              <div key={tr.id} className="relative pl-5 pb-2">
                {/* Vertical connecting line */}
                {index < selectedThread.traces.length - 1 && (
                  <div className="absolute left-1.5 top-2.5 bottom-0 w-px bg-zinc-200" />
                )}
                {/* Dot */}
                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-zinc-900 flex items-center justify-center" />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">{tr.title}</span>
                    {tr.durationMs && (
                      <span className="text-[10px] font-mono text-zinc-500">
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
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[11px] font-medium text-zinc-700">Audit Mandate Signature</span>
            </div>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 border border-zinc-200 rounded text-zinc-800 font-medium">
              0x9a8f...4e12
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}




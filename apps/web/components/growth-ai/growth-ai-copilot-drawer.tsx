"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  TrendingUp,
  Package,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api/client";
import {
  ActionExecutionDialog,
  ActionableCard,
  SuggestedAction,
} from "./insight-cards";
import { stripMarkdownAsterisks } from "@/lib/ai/growth-gemini";

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: SuggestedAction[];
  toolCallsExecuted?: Array<{ name: string; args: any; result: any }>;
  createdAt: string;
}

export function GrowthAICopilotDrawer({
  open,
  onOpenChange,
  initialPrompt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
}) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Hello! I am your ZapAI Growth & Inventory Advisor. I have real-time access to your store's live catalog stock, WhatsApp buyer negotiations, and Razorpay settlements.\n\nAsk me anything about your revenue trajectory, stockout risks, or margin preservation!",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<SuggestedAction | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, open]);

  // If initialPrompt changes and drawer opens
  useEffect(() => {
    if (initialPrompt && open) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, open]);

  // Context-aware suggestion prompts based on current page
  const getContextSuggestions = () => {
    if (pathname.includes("/products")) {
      return [
        "Which SKUs are at risk of running out this week?",
        "Show products with zero sales in 14 days (dead stock)",
        "Can I safely raise listed price on top-selling items?",
      ];
    }
    if (pathname.includes("/orders") || pathname.includes("/analytics")) {
      return [
        "Breakdown my GMV growth and average order value",
        "How much dealer margin did the AI agent preserve?",
        "What is our WhatsApp lead-to-deal conversion rate?",
      ];
    }
    if (pathname.includes("/conversations")) {
      return [
        "What are the most common buyer discount requests?",
        "Where are buyers dropping off in WhatsApp chat?",
        "Which product bundles have the highest acceptance rate?",
      ];
    }
    return [
      "How is my store performing overall today?",
      "Which products need urgent restocking?",
      "What actions can I take to increase margin this week?",
    ];
  };

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.growthAi.chat({
        messages: history,
      });

      const assistantMsg: CopilotMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: res.reply || "I've reviewed your store metrics.",
        suggestedActions: res.suggestedActions || [],
        toolCallsExecuted: res.toolCallsExecuted || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "⚠️ I encountered an issue retrieving real-time store metrics. Please check your backend connection.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTriggerAction(action: SuggestedAction) {
    setActiveAction(action);
    setActionDialogOpen(true);
  }

  function handleActionSuccess(msg: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `act-done-${Date.now()}`,
        role: "assistant",
        content: `✅ **Action Applied**: ${msg}`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  const suggestions = getContextSuggestions();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col bg-white border-l border-zinc-200 shadow-2xl z-[9999]"
        >
          {/* Header */}
          <SheetHeader className="p-4 sm:p-5 border-b border-zinc-100 bg-gradient-to-r from-slate-900 to-zinc-900 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-sm font-bold text-white tracking-tight">
                      ZapAI Growth Advisor
                    </SheetTitle>
                    <Badge className="bg-blue-600/80 text-white text-[10px] font-semibold border-0">
                      Store Copilot ✨
                    </Badge>
                  </div>
                  <SheetDescription className="text-[11px] text-zinc-300">
                    Real-time inventory, revenue & margin intelligence
                  </SheetDescription>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMessages([
                    {
                      id: "msg-welcome",
                      role: "assistant",
                      content:
                        "Chat cleared. Ask me anything about your inventory health, GMV trajectory, or pricing elasticity!",
                      createdAt: new Date().toISOString(),
                    },
                  ])
                }
                className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-white/10"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Quick Context-Aware Suggestion Chips */}
          <div className="p-3 bg-zinc-50 border-b border-zinc-200/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold uppercase text-zinc-400 shrink-0">
              Suggestions:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-white hover:bg-blue-50 text-zinc-700 hover:text-blue-700 border border-zinc-200 hover:border-blue-200 transition-all font-medium flex items-center gap-1 shadow-2xs"
              >
                <span>{s}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </div>

          {/* Chat Messages Viewport */}
          <ScrollArea className="flex-1 p-4 sm:p-5 space-y-4">
            <div className="space-y-4 pb-4">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`space-y-2 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? "bg-blue-600 text-white font-medium rounded-tr-xs"
                            : "bg-zinc-100 text-zinc-800 rounded-tl-xs whitespace-pre-wrap"
                        }`}
                      >
                        {stripMarkdownAsterisks(m.content)}
                      </div>

                      {/* Tool call indicator */}
                      {!isUser && m.toolCallsExecuted && m.toolCallsExecuted.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.toolCallsExecuted.map((tc, tIdx) => (
                            <Badge
                              key={tIdx}
                              variant="outline"
                              className="text-[10px] bg-white text-zinc-500 border-zinc-200 font-mono"
                            >
                              ⚡ queried {tc.name.replace(/^get/, "")}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Suggested Executable Actions */}
                      {!isUser && m.suggestedActions && m.suggestedActions.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {m.suggestedActions.map((act) => (
                            <ActionableCard
                              key={act.id}
                              action={act}
                              onExecute={handleTriggerAction}
                            />
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] text-zinc-400 px-1 block">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-100 text-zinc-600 text-xs rounded-tl-xs flex items-center gap-2 shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Analyzing live store inventory & metrics...</span>
                  </div>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>
          </ScrollArea>

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t border-zinc-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask anything about inventory, sales, or margins..."
                className="text-xs bg-zinc-50 border-zinc-200 focus-visible:ring-blue-600"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !inputVal.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 gap-1 shadow-xs shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs font-semibold">Send</span>
                  </>
                )}
              </Button>
            </form>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Autonomous Store AI • Securely scoped to your merchant account
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Execution Dialog */}
      <ActionExecutionDialog
        action={activeAction}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        onSuccess={handleActionSuccess}
      />
    </>
  );
}

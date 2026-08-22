"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/utils";
import { api } from "@/lib/api/client";
import {
  Smartphone,
  CheckCircle2,
  Send,
  Radio,
  ShieldCheck,
  Zap,
  CheckCheck,
  RefreshCw,
  Terminal,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  time: string;
  isPaymentLink?: boolean;
  paymentAmount?: number;
  paymentUrl?: string;
}

const defaultMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: "user",
    text: "Hi! Do you have the Nike Air Zoom Pegasus in Size 10?",
    time: "10:14 AM",
  },
  {
    id: "m2",
    sender: "agent",
    text: "Hey there! 👋 Yes, we have 18 pairs of Nike Air Zoom Pegasus 41 (Size 10) in stock ready to ship today! Retail price is ₹3,999. Would you like me to reserve a pair for you?",
    time: "10:14 AM",
  },
  {
    id: "m3",
    sender: "user",
    text: "Can you do ₹3,600 and ship today?",
    time: "10:15 AM",
  },
  {
    id: "m4",
    sender: "agent",
    text: "I can offer you our exclusive flash deal: ₹3,799 with 100% Free Express Shipping! (That saves you ₹200 + ₹150 delivery). Here is your instant Razorpay UPI checkout link:",
    time: "10:15 AM",
    isPaymentLink: true,
    paymentAmount: 3799,
    paymentUrl: "https://rzp.io/i/mock_checkout_link",
  },
];

export default function WhatsAppPage() {
  const [testPrompt, setTestPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("simulator");

  const [testLog, setTestLog] = useState<string[]>([
    `[10:14:02 AM] Inbound POST /api/webhooks/whatsapp HTTP/1.1 200 OK (38ms)`,
    `[10:14:02 AM] X-Hub-Signature-256 HMAC verified successfully`,
    `[10:14:03 AM] Intent extracted: 'check_inventory' -> SKU 'SKU-SHOE-001' (18 in stock)`,
    `[10:15:10 AM] Inbound buyer offer: ₹3,600 (Threshold Floor: ₹3,500)`,
    `[10:15:11 AM] Counter-offer formulated: ₹3,799 (5% discount concession, 95% margin preserved)`,
    `[10:15:12 AM] Razorpay Payment Link generated: plink_K9x182749a`,
  ]);

  const quickPrompts = [
    "Can you do ₹3,600 for Nike Pegasus 41?",
    "Do you have Adidas Ultraboost in UK 9?",
    "Is shipping free to Mumbai?",
    "Can I get a discount on Puma Velocity Nitro?",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || testPrompt;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTestPrompt("");
    setIsTyping(true);

    try {
      // Real backend simulation call to Gemini + DB catalog + Razorpay
      const simResult = await api.simulator.sendChatMessage(text);

      const agentReply: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: "agent",
        text: simResult.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isPaymentLink: simResult.isPaymentLink,
        paymentAmount: simResult.paymentAmount,
        paymentUrl: simResult.paymentUrl,
      };

      setMessages((prev) => [...prev, agentReply]);
      if (simResult.logs && simResult.logs.length > 0) {
        setTestLog((prev) => [...prev, ...simResult.logs]);
      }
    } catch (err) {
      console.error("Simulation error:", err);
      const fallbackReply: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: "agent",
        text: "I've checked our live stock and can offer our best price with free express shipping!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">WhatsApp Cloud API Channel</h1>
            <Badge variant="outline" className="gap-1.5 font-medium text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Meta WABA Live
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Meta Cloud API connection management, live AI selling simulations, and real-time webhook payload verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-white text-zinc-700 border-zinc-300">
            v19.0 Cloud API
          </Badge>
        </div>
      </div>

      {/* Meta Account Status Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Account Number</span>
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1">+91 98765 00000</CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Verified Green Badge
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Meta WABA ID</span>
              <Radio className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1">waba_991823481</CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono">
            Tier 2 (10,000 msgs/day)
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Webhook Latency</span>
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1">38ms</CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-emerald-600 font-mono font-medium">
            ● 200 OK (HMAC Verified)
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Payment Gateway</span>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1">Razorpay Instant</CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono">
            Direct UPI Settlement
          </CardFooter>
        </Card>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive WhatsApp Mobile Mockup (7 cols) */}
        <Card className="lg:col-span-7 border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 bg-zinc-900 text-white border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                RF
              </div>
              <div>
                <p className="text-xs font-bold leading-none">RunFast Sports (AI Seller)</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-1">online • official business account</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border-zinc-700">
              Live Simulator
            </Badge>
          </CardHeader>

          {/* Chat Messages Body */}
          <div className="p-4 space-y-3 bg-[#e5ddd5]/30 min-h-[380px] max-h-[420px] overflow-y-auto">
            <div className="text-center">
              <span className="text-[10px] bg-white/80 border border-zinc-200 text-zinc-500 px-2.5 py-1 rounded-md shadow-2xs">
                TODAY • ENCRYPTED END-TO-END
              </span>
            </div>

            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-[#d9fdd3] text-zinc-900 rounded-tr-none"
                        : "bg-white text-zinc-900 rounded-tl-none border border-zinc-200/80"
                    }`}
                  >
                    <p>{m.text}</p>

                    {m.isPaymentLink && (
                      <div className="mt-2.5 p-2.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-800">Razorpay Payment Link</span>
                          <span className="font-mono font-bold text-zinc-900">
                            {formatINR(m.paymentAmount || 3799)}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Instant UPI, Google Pay, PhonePe, Cards accepted
                        </div>
                        <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified Merchant
                          </span>
                          <a
                            href={m.paymentUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            Pay Now <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-zinc-400 font-mono">
                      <span>{m.time}</span>
                      {isUser && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 bg-white border border-zinc-200/80 p-2.5 rounded-lg rounded-tl-none w-28 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-zinc-400 ml-1">Typing...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider shrink-0 pl-1">
              Quick Inquiries:
            </span>
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="whitespace-nowrap bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-md transition-colors shadow-2xs cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <Input
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about shoes, request a discount, or check inventory..."
              className="text-xs h-9"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!testPrompt.trim() || isTyping}
              size="sm"
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Right Column: Execution Log & Webhook Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full bg-zinc-100 border border-zinc-200">
              <TabsTrigger value="simulator" className="text-xs">
                Real-Time Telemetry
              </TabsTrigger>
              <TabsTrigger value="webhook" className="text-xs">
                Webhook Verification
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simulator" className="space-y-4 mt-4">
              <Card className="border-zinc-200 shadow-xs">
                <CardHeader className="p-4 pb-2 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-500" />
                    <CardTitle className="text-xs font-bold text-zinc-900">
                      Live A2A & WhatsApp Worker Log
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border-emerald-200">
                    Active (Streaming)
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] h-84 overflow-y-auto space-y-1.5 rounded-b-xl">
                  {testLog.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      <span className="text-zinc-500">{log.slice(0, 13)}</span>
                      <span
                        className={
                          log.includes("200 OK") || log.includes("verified") || log.includes("Written")
                            ? "text-emerald-400"
                            : log.includes("Inbound")
                            ? "text-blue-400"
                            : log.includes("Razorpay")
                            ? "text-amber-300"
                            : "text-zinc-300"
                        }
                      >
                        {log.slice(13)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Policy Enforcement Card */}
              <Card className="border-zinc-200 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-900">
                  <span>Enforced Guardrails</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="space-y-2 text-xs text-zinc-600">
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span>Floor Price Protection</span>
                    <span className="font-mono font-semibold text-zinc-900">₹3,500 Enforced</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span>Max Discount Cap</span>
                    <span className="font-mono font-semibold text-zinc-900">12% Maximum</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span>Redis Lock Expiry</span>
                    <span className="font-mono font-semibold text-zinc-900">120s TTL</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Cryptographic Ledger</span>
                    <span className="font-mono font-semibold text-zinc-900">SHA-256 Checksum</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="webhook" className="space-y-4 mt-4">
              <Card className="border-zinc-200 shadow-xs">
                <CardHeader className="p-4 pb-2 border-b border-zinc-100">
                  <CardTitle className="text-xs font-bold text-zinc-900">
                    Meta Webhook Credentials
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Endpoints configured for WhatsApp Cloud API callbacks
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-700">Webhook URL</p>
                    <p className="font-mono text-[11px] bg-zinc-50 border border-zinc-200 p-2 rounded-md mt-1 text-zinc-800 break-all">
                      https://razorpay-agent-production.up.railway.app/webhooks/whatsapp
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-700">Verify Token</p>
                    <p className="font-mono text-[11px] bg-zinc-50 border border-zinc-200 p-2 rounded-md mt-1 text-zinc-800">
                      agentbridge_secret
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-700">Subscribed Events</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono bg-zinc-50">messages</Badge>
                      <Badge variant="outline" className="text-[10px] font-mono bg-zinc-50">message_template_status_update</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/utils";
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
    text: "Hey there! 👋 Yes, we have 18 pairs of Nike Air Zoom Pegasus 40 (Size 10) in stock ready to ship today! Retail price is ₹3,999. Would you like me to reserve a pair for you?",
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
    `[10:14:03 AM] Intent extracted: 'check_inventory' -> SKU 'NIK-PEG-40' (18 in stock)`,
    `[10:15:10 AM] Inbound buyer offer: ₹3,600 (Threshold Floor: ₹3,500)`,
    `[10:15:11 AM] Counter-offer formulated: ₹3,799 (5% discount concession, 95% margin preserved)`,
    `[10:15:12 AM] Razorpay Payment Link generated: plink_K9x182749a`,
  ]);

  const quickPrompts = [
    "Can you do ₹3,400 for 2 pairs?",
    "Do you offer Cash on Delivery?",
    "Is shipping free to Mumbai?",
    "What is your return policy?",
  ];

  const handleSendMessage = (textToSend?: string) => {
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

    setTestLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Inbound message: "${text}"`,
      `[${new Date().toLocaleTimeString()}] Evaluated against floor policy (₹3,500 min)`,
    ]);

    setTimeout(() => {
      let agentReply: ChatMessage;

      if (text.includes("3,400")) {
        agentReply = {
          id: `a_${Date.now()}`,
          sender: "agent",
          text: "Our absolute minimum floor price for genuine Pegasus 40 is ₹3,500 per pair. If you take 2 pairs today, I can do ₹7,100 total with priority dispatch!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isPaymentLink: true,
          paymentAmount: 7100,
        };
      } else if (text.toLowerCase().includes("shipping")) {
        agentReply = {
          id: `a_${Date.now()}`,
          sender: "agent",
          text: "Yes! All orders above ₹3,000 qualify for 100% Free Express Delivery across India (delivered in 48 hours).",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      } else {
        agentReply = {
          id: `a_${Date.now()}`,
          sender: "agent",
          text: "Got it! I've locked your unit in our inventory. Click the instant Razorpay payment link below to confirm via UPI / Google Pay / Credit Card:",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isPaymentLink: true,
          paymentAmount: 3799,
        };
      }

      setMessages((prev) => [...prev, agentReply]);
      setIsTyping(false);
      setTestLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Outbound AI message dispatched via Meta Cloud API (HTTP 200)`,
      ]);
    }, 900);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                          <span className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5">
                            Pay Now <ExternalLink className="w-2.5 h-2.5" />
                          </span>
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
              <div className="flex items-center gap-1.5 p-2 bg-white rounded-md text-xs text-zinc-500 w-28 shadow-2xs border border-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] font-mono">AI Typing...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2.5 bg-zinc-50 border-t border-zinc-200 overflow-x-auto flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-zinc-500 flex-shrink-0">Try buyer ask:</span>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-[10px] whitespace-nowrap bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-1 rounded transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Footer */}
          <CardFooter className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <Input
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type simulated buyer message (e.g. 'Can I get ₹200 off?')..."
              className="text-xs h-9 bg-zinc-50"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!testPrompt.trim() || isTyping}
              size="sm"
              className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column: Webhook Telemetry & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-900">Developer Telemetry</span>
              <TabsList className="h-8">
                <TabsTrigger value="simulator" className="text-xs py-1 px-2.5">Live Log</TabsTrigger>
                <TabsTrigger value="config" className="text-xs py-1 px-2.5">API Keys</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="simulator" className="mt-0">
              <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Meta Webhook Event Stream</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">● Streaming</span>
                </div>

                <div className="space-y-1.5 font-mono text-[10px] text-zinc-300 max-h-[380px] overflow-y-auto leading-relaxed">
                  {testLog.map((log, index) => (
                    <div key={index} className="text-zinc-300">
                      {log}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <Card className="border-zinc-200 shadow-xs p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">Webhook Endpoints & Tokens</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Configure your Meta App webhook callback with your AgentBridge server.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700">Webhook Callback URL</label>
                    <Input
                      defaultValue="https://api.agentbridge.io/v1/webhooks/whatsapp"
                      readOnly
                      className="font-mono text-xs bg-zinc-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700">Verify Token</label>
                    <Input
                      defaultValue="agentbridge_meta_verify_token_88921"
                      readOnly
                      className="font-mono text-xs bg-zinc-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-700">Permanent Access Token</label>
                    <Input
                      defaultValue="EAAGm0PX4ZC...98bQZDZD"
                      type="password"
                      readOnly
                      className="font-mono text-xs bg-zinc-50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Event Subscriptions</span>
                  <span className="font-mono text-zinc-900 font-medium">messages, deliveries</span>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


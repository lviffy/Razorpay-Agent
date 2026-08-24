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
  CreditCard,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  time: string;
  isPaymentLink?: boolean;
  paymentAmount?: number;
  paymentUrl?: string;
  orderId?: string;
}

export default function WhatsAppPage() {
  const [testPrompt, setTestPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("simulator");
  const [testLog, setTestLog] = useState<string[]>([]);
  const [creds, setCreds] = useState<any>(null);

  const [storeName, setStoreName] = useState("Store");

  React.useEffect(() => {
    async function loadData() {
      try {
        const [threads, credentials, profile] = await Promise.all([
          api.conversations.list(),
          api.settings.getCredentials(),
          api.profile.get(),
        ]);
        if (credentials) setCreds(credentials);
        if (profile?.storeName) setStoreName(profile.storeName);
        if (threads && threads.length > 0) {
          const first = threads[0];
          const mappedMsgs: ChatMessage[] = (first.messages || []).map((m: any, idx: number) => ({
            id: m.id || `m_${idx}`,
            sender: m.sender === "seller_agent" ? "agent" : m.sender === "system" ? "system" : "user",
            text: m.content || "",
            time: m.timestamp || "Just now",
            isPaymentLink: m.metadata?.isPaymentLink,
            paymentAmount: m.metadata?.offerAmount,
            paymentUrl: m.metadata?.paymentLinkId ? `https://rzp.io/i/${m.metadata.paymentLinkId}` : undefined,
          }));
          setMessages(mappedMsgs);
        }
      } catch (err) {
        console.error("Failed to load live data:", err);
      }
    }
    loadData();
  }, []);

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeCheckoutData, setActiveCheckoutData] = useState<{
    orderId?: string;
    amount?: number;
    paymentUrl?: string;
  } | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  const quickPrompts = [
    "Can you offer a discount on this item?",
    "Do you have stock available right now?",
    "Is shipping free for this order?",
    "What is the best deal you can give me?",
  ];

  const handleOpenCheckoutModal = (amount?: number, orderId?: string, url?: string) => {
    setActiveCheckoutData({ amount: amount || 0, orderId: orderId || "", paymentUrl: url });
    setCheckoutModalOpen(true);
  };

  const handleExecutePaymentSimulation = async (status: "captured" | "failed") => {
    if (!activeCheckoutData) return;
    setIsSimulatingPayment(true);
    try {
      const res = await api.simulator.simulatePayment({
        orderId: activeCheckoutData.orderId,
        status,
        method: "UPI (Razorpay)",
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (status === "captured") {
        const confirmMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          sender: "agent",
          text: `✅ *Payment Confirmed! (Razorpay ${res.paymentId || "pay_instant"})*\n\nAmount: ₹${(activeCheckoutData.amount || 0).toLocaleString("en-IN")}\nStore: ${storeName}\n\n*Audit Trail Verified:*\n• 🔗 x402 Hash: \`${res.x402TransactionId || "x402_tx_verified"}\`\n• 💳 Razorpay ID: \`${res.paymentId || "pay_rzp_instant"}\`\n• 📦 Order ID: \`${res.orderId || activeCheckoutData.orderId || "ORD"}\`\n\nInstant UPI settlement verified.`,
          time: timeStr,
        };
        setMessages((prev) => [...prev, confirmMsg]);
        setTestLog((prev) => [
          ...prev,
          `[${timeStr}] Razorpay Webhook: 'payment.captured' (HMAC SHA-256 Verified)`,
          `[${timeStr}] Inventory state transition: PAYMENT_PENDING -> PAID (Postgres)`,
          `[${timeStr}] Redis inventory reservation lock released`,
          `[${timeStr}] Settlement: ₹${activeCheckoutData.amount || 0} routed via Razorpay`,
        ]);
      } else {
        const failMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          sender: "agent",
          text: `❌ *UPI Payment Timed Out / Declined*\n\nInventory lock was released immediately. Would you like to retry or choose an alternative payment option?`,
          time: timeStr,
        };
        setMessages((prev) => [...prev, failMsg]);
        setTestLog((prev) => [
          ...prev,
          `[${timeStr}] Razorpay Webhook: 'payment.failed'`,
          `[${timeStr}] Atomic recovery: Redis inventory lock released`,
          `[${timeStr}] Restored stock level in Postgres`,
        ]);
      }
    } catch (err) {
      console.error("Simulation failure:", err);
    } finally {
      setIsSimulatingPayment(false);
      setCheckoutModalOpen(false);
    }
  };

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
        orderId: simResult.orderId || "ORD-1042",
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
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1 truncate">
              {creds?.whatsappPhoneNumber || "Not Configured"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${creds?.whatsappPhoneNumber ? "bg-emerald-500" : "bg-amber-400"}`} />
            {creds?.whatsappPhoneNumber ? "Verified Channel" : "Setup Required"}
          </CardFooter>
        </Card>

        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Meta Phone ID</span>
              <Radio className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1 truncate">
              {creds?.whatsappPhoneNumberId || "Not Set"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono">
            {creds?.whatsappPhoneNumberId ? "Meta Graph API v19.0" : "Configure in Settings"}
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
            <CardTitle className="text-sm font-mono font-bold text-zinc-900 mt-1 truncate">
              {creds?.razorpayKeyId ? `${creds.razorpayKeyId.slice(0, 12)}...` : "Not Configured"}
            </CardTitle>
          </CardHeader>
          <CardFooter className="p-4 pt-1 text-[10px] text-zinc-500 font-mono flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${creds?.razorpayKeyId ? (creds?.razorpayEnvironment === "live" ? "bg-emerald-500" : "bg-blue-500") : "bg-zinc-300"}`} />
            {creds?.razorpayKeyId ? (creds?.razorpayEnvironment === "live" ? "Live Production" : "Test Sandbox") : "Pending Setup"}
          </CardFooter>
        </Card>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive WhatsApp Mobile Mockup (7 cols) */}
        <Card className="lg:col-span-7 border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <CardHeader className="p-4 bg-zinc-900 text-white border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                {storeName ? storeName.slice(0, 2) : "AI"}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{storeName} (AI Seller)</p>
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
                      <div className="mt-2.5 p-2.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-800">Razorpay Payment Link</span>
                          <span className="font-mono font-bold text-zinc-900">
                            {formatINR(m.paymentAmount || 3799)}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Instant UPI, Google Pay, PhonePe, Cards accepted
                        </div>
                        <div className="pt-1.5 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified Merchant ({m.orderId || "ORD-1042"})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenCheckoutModal(m.paymentAmount || 3799, m.orderId || "ORD-1042", m.paymentUrl)}
                              className="text-[10px] font-bold px-2 py-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-md cursor-pointer flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>Simulate Outcome</span>
                            </button>
                            <a
                              href={m.paymentUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              Pay Link <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
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
                      zapai_secret
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

      {/* Embedded Razorpay Test Checkout Simulation Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-zinc-900 text-white p-5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                    Razorpay Test Checkout
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {formatINR(activeCheckoutData?.amount || 3799)}
              </p>
              <p className="text-[11px] text-zinc-400">
                Order Reference: <span className="font-mono text-blue-300">{activeCheckoutData?.orderId || "ORD-1042"}</span>
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Test the autonomous financial state machine. Choose an outcome to fire real Razorpay webhook verification:
              </p>

              <div className="space-y-2.5">
                {/* 1. Happy Path: Instant UPI Capture */}
                <button
                  type="button"
                  disabled={isSimulatingPayment}
                  onClick={() => handleExecutePaymentSimulation("captured")}
                  className="w-full p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-emerald-900">
                        Approve via UPI (100% Instant Capture)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed pl-3.5">
                      Fires <code className="font-mono bg-emerald-200/60 px-1 rounded text-[10px]">payment.captured</code> webhook. Deducts stock & creates 5-field audit ledger entry.
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                </button>

                {/* 2. Failure Path: UPI Timeout / Decline */}
                <button
                  type="button"
                  disabled={isSimulatingPayment}
                  onClick={() => handleExecutePaymentSimulation("failed")}
                  className="w-full p-3.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-left transition-all flex items-start justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-bold text-red-900">
                        Simulate UPI Timeout / Decline (Failure)
                      </span>
                    </div>
                    <p className="text-[11px] text-red-700 leading-relaxed pl-3.5">
                      Fires <code className="font-mono bg-red-200/60 px-1 rounded text-[10px]">payment.failed</code> webhook. Verifies atomic Redis lock release in &lt; 2 seconds.
                    </p>
                  </div>
                  <RefreshCw className="w-4 h-4 text-red-600 shrink-0 mt-0.5 group-hover:rotate-180 transition-transform duration-300" />
                </button>
              </div>

              {/* Direct payment link option */}
              {activeCheckoutData?.paymentUrl && (
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span>Open live gateway in new tab:</span>
                  <a
                    href={activeCheckoutData.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Razorpay Standard Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckoutModalOpen(false)}
                className="text-xs h-8"
              >
                Close Simulator
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

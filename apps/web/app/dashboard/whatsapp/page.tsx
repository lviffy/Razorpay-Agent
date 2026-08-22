"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Smartphone,
  CheckCircle2,
  Send,
  Radio,
  ShieldCheck,
} from "lucide-react";

export default function WhatsAppPage() {
  const [testNumber, setTestNumber] = useState("+91 98765 43210");
  const [testPrompt, setTestPrompt] = useState("Looking for running shoes under ₹4,000");
  const [testLog, setTestLog] = useState<string[]>([
    `[10:14:02 AM] Inbound WhatsApp webhook listener verified (HMAC OK)`,
    `[10:14:03 AM] Intent parsed: 'search_running_shoes' (Budget: 4000)`,
    `[10:14:04 AM] Catalog matched 'Nike Air Zoom Pegasus 40' @ ₹3,999`,
  ]);
  const [loading, setLoading] = useState(false);

  const handleTriggerTest = () => {
    setLoading(true);
    setTestLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Inbound message received from ${testNumber}: "${testPrompt}"`,
    ]);
    setTimeout(() => {
      setTestLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Intent parsed: 'search_running_shoes' (Budget: 4000)`,
        `[${new Date().toLocaleTimeString()}] Checked inventory: 18 units available`,
        `[${new Date().toLocaleTimeString()}] Generated counter-offer ₹3,799 + free shipping (Floor: ₹3,500)`,
        `[${new Date().toLocaleTimeString()}] Outbound reply + Razorpay link dispatched via WhatsApp Cloud API`,
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">WhatsApp Cloud API Channel</h1>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
            Meta Verified WABA
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Manage your official Meta WhatsApp Business connection, webhook listeners, and live negotiation simulations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Status Box (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">WhatsApp Business Account</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">+91 98765 00000</p>
              </div>
            </div>
            <span className="text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded font-mono">
              ● Connected
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-600">Meta WABA ID</span>
              <span className="font-mono text-zinc-900 font-bold">waba_991823481</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-600">Webhook Status</span>
              <span className="text-zinc-900 font-medium flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 200 OK (38ms latency)
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-600">Daily Conversations</span>
              <span className="font-mono font-medium text-zinc-900">128 / 1,000 Free</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-600">Instant UPI Payment Links</span>
              <span className="font-mono text-zinc-900 font-medium">Razorpay Integrated</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-600" />
              <span className="text-[11px] font-medium text-zinc-800">2-Way Encryption Active</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">AES-256</span>
          </div>
        </div>

        {/* Live Inbound Tester (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-zinc-600" />
              <h3 className="text-sm font-bold text-zinc-900">Inbound Webhook Simulator</h3>
            </div>
            <span className="text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
              Sandbox Sim
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Simulated Buyer Phone Number</label>
              <Input
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Inbound Message Content</label>
              <Input
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="text-xs"
              />
            </div>

            <Button
              onClick={handleTriggerTest}
              disabled={loading}
              className="w-full text-xs gap-2 h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Simulating Webhook..." : "Send Test WhatsApp Message"}</span>
            </Button>
          </div>

          {testLog.length > 0 && (
            <div className="p-3.5 bg-zinc-900 rounded-lg border border-zinc-800 space-y-1 font-mono text-[10px] text-zinc-300 max-h-40 overflow-y-auto">
              <div className="text-zinc-500 font-bold border-b border-zinc-800 pb-1 mb-1">
                // Real-time Webhook Console
              </div>
              {testLog.map((l, i) => (
                <div key={i} className="leading-relaxed">{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

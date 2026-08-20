"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, CheckCircle2, QrCode, RefreshCw, Send } from "lucide-react";

export default function WhatsAppPage() {
  const [testNumber, setTestNumber] = useState("+91 98765 43210");
  const [testPrompt, setTestPrompt] = useState("Looking for running shoes under ₹4,000");
  const [testLog, setTestLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTriggerTest = () => {
    setLoading(true);
    setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Inbound WhatsApp message received from ${testNumber}`]);
    setTimeout(() => {
      setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Intent parsed: 'search_running_shoes' (Budget: 4000)`]);
      setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Catalog matched 'Nike Air Zoom Pegasus 40' @ ₹3,999`]);
      setTestLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Outbound reply dispatched via WhatsApp Cloud API`]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">WhatsApp Cloud API Channel</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Manage your WhatsApp Business connection, webhook listeners, and live phone simulations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Status Box */}
        <div className="lg:col-span-6 bg-white border border-surface-200 rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#0C2340] text-white flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-surface-900">WhatsApp Business Number</h3>
                <p className="text-xs text-surface-500 font-mono">+91 98765 00000</p>
              </div>
            </div>
            <Badge variant="success">● CONNECTED</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-surface-600">Meta WABA ID</span>
              <span className="font-mono text-surface-900">waba_991823481</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-surface-600">Webhook Status</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-surface-600">Messages Processed Today</span>
              <span className="font-mono font-bold text-surface-900">128</span>
            </div>
          </div>
        </div>

        {/* Live Inbound Tester */}
        <div className="lg:col-span-6 bg-white border border-surface-200 rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-surface-100">
            <h3 className="text-sm font-bold text-surface-900">Inbound Webhook Simulator</h3>
            <Badge variant="brand">DEV TESTER</Badge>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-700">Simulate Customer Phone</label>
              <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-700">Inbound Message Content</label>
              <Input value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)} />
            </div>

            <Button onClick={handleTriggerTest} disabled={loading} className="w-full text-xs gap-2">
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Triggering Webhook..." : "Send Test WhatsApp Message"}</span>
            </Button>
          </div>

          {testLog.length > 0 && (
            <div className="p-3 bg-surface-50 border border-surface-200 rounded-md space-y-1 font-mono text-[10px] text-surface-700 max-h-36 overflow-y-auto">
              {testLog.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

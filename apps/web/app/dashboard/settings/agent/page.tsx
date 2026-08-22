"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AgentProfile } from "@/lib/types";
import { defaultAgentProfile } from "@/lib/api/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Bot,
  Check,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Smile,
  Briefcase,
  Flame,
  CheckCheck,
  Sliders,
} from "lucide-react";

export default function AgentSettingsPage() {
  const [profile, setProfile] = useState<AgentProfile>(defaultAgentProfile);
  const [customRules, setCustomRules] = useState(
    "Always highlight that running shoes feature dual Zoom Air cushioning. If buyer is unsure of sizing, advise that Pegasus models fit true-to-size."
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await api.settings.getAgent();
        if (p) setProfile(p);
      } catch (err) {
        console.error("Failed to load agent profile", err);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    await api.settings.saveAgent(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tones = [
    {
      id: "friendly",
      label: "Friendly & Helpful",
      desc: "Warm, welcoming, responsive with subtle emojis",
      icon: Smile,
      preview: "Hey Rahul! 👋 Welcome to RunFast Sports! Looking for responsive road running shoes today? I can check live variant inventory for you!",
    },
    {
      id: "professional",
      label: "Professional & Technical",
      desc: "Spec-focused, precise, engineering & performance tone",
      icon: Briefcase,
      preview: "Hello Rahul. RunFast Sports inventory confirmed. The Pegasus 40 features dual Zoom Air pods and React foam. 18 units in stock at ₹3,999.",
    },
    {
      id: "persuasive",
      label: "High-Energy Closer",
      desc: "Creates urgency, highlights savings and flash stock alerts",
      icon: Flame,
      preview: "Hey Rahul! 🔥 Great choice on the Pegasus 40—only 3 pairs left in Size 10! I can lock in ₹3,799 + Free Delivery if we confirm right now!",
    },
  ];

  const currentToneObj = tones.find((t) => t.id === profile.tone) || tones[0];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Seller Agent Persona & Limits</h1>
            <Badge variant="outline" className="gap-1.5 font-medium text-[11px] bg-zinc-100 text-zinc-700 border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Autonomous Engine Active
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Configure your AI seller persona, communication voice, negotiation limits, and custom product knowledge mandates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-white text-zinc-700 border-zinc-200">
            LLM: GPT-4o Commerce Engine
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agent Identity & Tone Selector */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Agent Persona & Communication Voice</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">
                  Select the tone and personality style applied across all customer WhatsApp interactions.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              Tone: {currentToneObj.label}
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5 max-w-sm">
              <label className="text-xs font-medium text-zinc-700">Agent Display Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="text-xs font-medium"
              />
              <p className="text-[11px] text-zinc-500">Introduced as your store&apos;s verified AI concierge.</p>
            </div>

            {/* Interactive Tone Cards */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-medium text-zinc-700">Select Negotiation Tone</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tones.map((t) => {
                  const Icon = t.icon;
                  const isSelected = profile.tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setProfile({ ...profile, tone: t.id as any })}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                          : "bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-zinc-600"}`} />
                        <span className="text-xs font-bold">{t.label}</span>
                      </div>
                      <p className={`text-[11px] mt-1.5 leading-relaxed ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live WhatsApp Greeting Bubble Preview */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                  Live WhatsApp Greeting Preview ({currentToneObj.label})
                </span>
                <span className="text-[10px] font-mono text-zinc-500">WhatsApp Cloud API</span>
              </div>
              <div className="p-3.5 bg-white rounded-lg border border-zinc-200/90 text-xs text-zinc-900 leading-relaxed shadow-2xs">
                &quot;{currentToneObj.preview}&quot;
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Product Knowledge & Store Mandates */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center gap-3 space-y-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900">Custom Store Knowledge & Answering Guidelines</CardTitle>
              <CardDescription className="text-[11px] text-zinc-500">
                Provide custom product advice, return policies, or FAQs injected into the agent&apos;s reasoning system prompt.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Custom Prompt Guidance</label>
              <textarea
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono p-3 rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed text-zinc-800"
              />
              <p className="text-[11px] text-zinc-500">
                The agent adheres to these custom instructions alongside catalog inventory data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Autonomy & Settlement Controls */}
        <Card className="border-zinc-200 shadow-xs">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-zinc-900">Autonomy & Settlement Controls</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">
                  Determine how freely the AI agent can formulate counter-offers and generate Razorpay payment links.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-100 text-zinc-700 border-zinc-200">
              Guardrails Active
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900">Autonomous Price Negotiation</p>
                <p className="text-[11px] text-zinc-500">
                  Allow agent to compute real-time counter-offers strictly within your floor price mandate (₹3,500 min).
                </p>
              </div>
              <Switch
                checked={profile.autoNegotiationEnabled}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, autoNegotiationEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900">Human Escalation Fallback</p>
                <p className="text-[11px] text-zinc-500">
                  Automatically flag conversation and notify staff if buyer asks for custom B2B wholesale terms.
                </p>
              </div>
              <Switch
                checked={profile.humanEscalationEnabled}
                onCheckedChange={(checked) =>
                  setProfile({ ...profile, humanEscalationEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            className="h-9 px-6 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
          >
            Save Agent Persona & Mandates
          </Button>
          {saved && (
            <Badge variant="outline" className="gap-1 text-xs text-zinc-700 font-medium bg-zinc-100 px-3 py-1.5 border-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Agent profile saved successfully!
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}


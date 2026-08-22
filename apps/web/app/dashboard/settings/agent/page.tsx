"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AgentProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Bot,
  Check,
  MessageSquare,
} from "lucide-react";

export default function AgentSettingsPage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await api.settings.getAgent();
      setProfile(p);
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-xs text-zinc-500 font-mono">Loading agent profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Seller Agent Persona & Limits</h1>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
            Autonomous Agent
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Configure how your AI seller greets WhatsApp buyers, handles objections, and closes transactions within your mandates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agent Persona & Tone */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Agent Persona & Voice</h2>
              <p className="text-[11px] text-zinc-500">Tone and communication style applied across all customer interactions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Agent Display Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Conversation Tone</label>
              <select
                value={profile.tone}
                onChange={(e) => setProfile({ ...profile, tone: e.target.value as any })}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              >
                <option value="friendly">Friendly & Helpful (Recommended)</option>
                <option value="professional">Professional & Technical</option>
                <option value="direct">Direct & Concise</option>
                <option value="persuasive">High-Energy & Persuasive</option>
              </select>
            </div>
          </div>

          {/* Sample Greeting Bubble */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                Live Greeting Preview
              </span>
              <span className="text-[10px] font-mono text-zinc-500">WhatsApp Cloud API</span>
            </div>
            <div className="p-3 bg-white rounded-md border border-zinc-200 text-xs text-zinc-800 leading-relaxed">
              &quot;Hey Rahul! Welcome to RunFast Sports. Looking for responsive road running shoes or marathon gear today? I can check live variant inventory for you!&quot;
            </div>
          </div>
        </div>

        {/* Autonomy Controls */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Autonomy & Settlement Controls</h2>
              <p className="text-[11px] text-zinc-500">Determine how freely the AI agent can make pricing concessions and issue payment links.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 rounded-lg cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900">Autonomous Price Negotiation</p>
                <p className="text-[11px] text-zinc-500">
                  Allow agent to compute counter-offers in real-time within your floor price mandate.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.autoNegotiationEnabled}
                onChange={(e) =>
                  setProfile({ ...profile, autoNegotiationEnabled: e.target.checked })
                }
                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 rounded-lg cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-900">Human Escalation Fallback</p>
                <p className="text-[11px] text-zinc-500">
                  Flag conversation if customer explicitly requests human operator or high-volume B2B terms.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.humanEscalationEnabled}
                onChange={(e) =>
                  setProfile({ ...profile, humanEscalationEnabled: e.target.checked })
                }
                className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            className="h-8 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
          >
            Save Agent Profile
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-700 font-medium bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Agent profile saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

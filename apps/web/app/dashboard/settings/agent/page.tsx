"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AgentProfile } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Bot, ShieldAlert, Check } from "lucide-react";

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
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return <div className="text-xs text-surface-500">Loading agent profile...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">AI Seller Agent Persona & Limits</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Configure how your AI seller speaks, resolves buyer objections, and closes transactions.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Agent Persona & Tone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Agent Display Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Conversation Tone</label>
                <select
                  value={profile.tone}
                  onChange={(e) => setProfile({ ...profile, tone: e.target.value as any })}
                  className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="friendly">Friendly & Helpful (Recommended)</option>
                  <option value="professional">Professional & Technical</option>
                  <option value="direct">Direct & Concise</option>
                  <option value="persuasive">High-Energy & Persuasive</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
              <p className="font-semibold text-blue-950 mb-0.5">Sample Greeting Prompt</p>
              &quot;Hey Rahul! Welcome to RunFast Sports. Looking for responsive road running shoes or trail gear today?&quot;
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Autonomy Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface-50 border border-surface-200 rounded">
              <div>
                <p className="text-xs font-semibold text-surface-900">Autonomous Price Negotiation</p>
                <p className="text-[11px] text-surface-500">
                  Allow agent to compute counter-offers within the floor price.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.autoNegotiationEnabled}
                onChange={(e) =>
                  setProfile({ ...profile, autoNegotiationEnabled: e.target.checked })
                }
                className="w-4 h-4 text-brand-600 rounded border-surface-300"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-50 border border-surface-200 rounded">
              <div>
                <p className="text-xs font-semibold text-surface-900">Human Escalation Fallback</p>
                <p className="text-[11px] text-surface-500">
                  Flag message if customer requests human agent or complex custom terms.
                </p>
              </div>
              <input
                type="checkbox"
                checked={profile.humanEscalationEnabled}
                onChange={(e) =>
                  setProfile({ ...profile, humanEscalationEnabled: e.target.checked })
                }
                className="w-4 h-4 text-brand-600 rounded border-surface-300"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Save Agent Profile
          </Button>
          {saved && <span className="text-xs text-emerald-600 font-semibold">Saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}

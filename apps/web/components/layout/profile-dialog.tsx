"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Hash,
  ShieldCheck,
  Store,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  CheckCircle2,
  X,
  Bot,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { MerchantProfile } from "@/lib/types";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: (profile: MerchantProfile) => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  onProfileUpdated,
}: ProfileDialogProps) {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      api.profile.get().then((p) => {
        setProfile(p);
        setName(p.name);
        setPhone(p.phone);
        setSavedSuccess(false);
      });
    }
  }, [open]);

  const handleCopyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.merchantId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      // Save name and phone (email is locked / never changed)
      const updated = await api.profile.save({
        name: name.trim() || profile.name,
        phone: phone.trim() || profile.phone,
      });
      setProfile(updated);
      onProfileUpdated?.(updated);
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onOpenChange(false);
      }, 1000);
    } catch {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-0 border-zinc-200/90 rounded-2xl shadow-2xl bg-white [&>button]:hidden">
        {/* Clean Light Header */}
        <div className="bg-zinc-50/80 border-b border-zinc-100 p-4 sm:p-6 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-xs ring-4 ring-blue-500/10 shrink-0">
                RF
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 font-display truncate">
                    {name || profile.name}
                  </DialogTitle>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Admin
                  </span>
                </div>
                <DialogDescription className="text-[11px] sm:text-xs text-zinc-500 font-mono truncate">
                  {profile.email}
                </DialogDescription>
              </div>
            </div>

            {/* Custom SVG Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {savedSuccess ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-2.5 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 font-display">Profile Updated</p>
              <p className="text-xs text-zinc-500">Your profile details have been saved successfully.</p>
            </div>
          ) : (
            <>
              {/* Form Input Fields with Clean SVG Icons */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                      <span>Full Name</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Merchant Admin"
                        className="text-xs pl-9 h-9 rounded-xl bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Work Email Address (Strictly Locked / Read-Only as requested) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                        <span>Work Email</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 font-normal">
                          <Lock className="w-2.5 h-2.5" /> (Locked)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedEmail ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                      <Input
                        type="email"
                        value={profile.email}
                        readOnly
                        title="Work email is tied to the organization account and cannot be changed."
                        className="text-xs pl-9 h-9 rounded-xl bg-zinc-50/80 border-zinc-200 text-zinc-600 cursor-default select-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* WhatsApp Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                      <span>Support Phone (WhatsApp)</span>
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="text-xs pl-9 h-9 font-mono rounded-xl bg-white border-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Merchant ID Input (Locked / Read-Only) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                        <span>Merchant ID</span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 font-normal">
                          <Lock className="w-2.5 h-2.5" /> (Fixed)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Hash className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                      <Input
                        value={profile.merchantId}
                        readOnly
                        className="text-xs pl-9 h-9 font-mono bg-zinc-50/80 rounded-xl text-zinc-600 border-zinc-200 cursor-default select-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Environment & Permissions Pill Card */}
              <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-2.5">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  Store Environment & Permissions
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-700 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200/60 shadow-2xs">
                    <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Store: <strong className="font-semibold text-zinc-900">{profile.storeName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200/60 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Role: <strong className="font-semibold text-zinc-900">{profile.role}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200/60 shadow-2xs">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Gateway: <strong className="font-semibold text-zinc-900">Razorpay Live</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-700 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200/60 shadow-2xs">
                    <Bot className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">AI Seller: <strong className="font-semibold text-zinc-900">Active</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-800">Store & Rules</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </Link>

                <Link
                  href="/dashboard/settings/agent"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-zinc-800">AI Agent Tuning</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </Link>
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-9 px-4 rounded-xl border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

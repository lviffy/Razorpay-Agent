"use client";

import Link from "next/link";
import { Search, Bell, ExternalLink, Sparkles, Shield, ChevronDown, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Active Store + Environment Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-xs text-zinc-900">RunFast Sports</span>
          <span className="text-[10px] text-zinc-500 font-mono font-medium">
            (Sandbox)
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 pl-3 border-l border-zinc-200">
          <span className="text-zinc-600 font-medium text-[11px]">AI Seller: Online</span>
        </div>
      </div>

      {/* Center: Quick Search Simulator with Keyboard Shortcut */}
      <div className="hidden md:flex items-center gap-2.5 w-80 bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus-within:bg-white focus-within:border-zinc-300">
        <Search className="w-3.5 h-3.5 text-zinc-400" />
        <input
          type="text"
          aria-label="Quick search products, orders, conversations"
          placeholder="Search products, orders, conversations..."
          className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 placeholder:text-zinc-400"
          readOnly
        />
        <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/whatsapp"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-3 py-1.5 rounded-md transition-colors"
        >
          <Radio className="w-3 h-3 text-zinc-600" />
          <span>Simulate Lead</span>
        </Link>

        <button
          aria-label="Notifications"
          className="text-zinc-500 hover:text-zinc-700 p-2 rounded-md hover:bg-zinc-100 relative cursor-pointer transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-1.5 right-1.5" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-200">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center">
            RF
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-zinc-900 leading-none">Merchant Admin</p>
            <p className="text-[10px] text-zinc-500 font-mono leading-none mt-1">merchant_01</p>
          </div>
        </div>
      </div>
    </header>
  );
}

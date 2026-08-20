"use client";

import Link from "next/link";
import { Search, Bell, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-surface-200 px-6 flex items-center justify-between select-none">
      {/* Left: Active Store + Environment Pill */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-surface-900">RunFast Sports</span>
          <Badge variant="brand" className="text-[11px] px-1.5 py-0">
            TEST MODE
          </Badge>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-surface-500 pl-3 border-l border-surface-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>AI Seller Agent Active</span>
        </div>
      </div>

      {/* Center: Quick Search Simulator */}
      <div className="hidden md:flex items-center gap-2 w-80 bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-xs text-surface-500">
        <Search className="w-3.5 h-3.5 text-surface-400" />
        <input
          type="text"
          aria-label="Quick search products, orders, conversations"
          placeholder="Search products, orders, conversations... (Cmd+K)"
          className="bg-transparent border-none outline-none w-full text-xs text-surface-900 placeholder:text-surface-400"
          readOnly
        />
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/onboarding"
          className="text-xs text-surface-600 hover:text-brand-500 flex items-center gap-1 font-medium"
        >
          <span>Onboarding Setup</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <button
          aria-label="Notifications"
          className="text-surface-500 hover:text-surface-700 p-1.5 rounded-lg hover:bg-surface-100 relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-surface-200">
          <div className="w-7 h-7 rounded-lg bg-[#195adc] text-white text-xs font-semibold flex items-center justify-center shadow-xs">
            RF
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-surface-900 leading-none">Merchant Admin</p>
            <p className="text-[10px] text-surface-500 leading-none mt-0.5">merchant_01</p>
          </div>
        </div>
      </div>
    </header>
  );
}

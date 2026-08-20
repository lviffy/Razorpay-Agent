"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  ShoppingBag,
  BarChart3,
  Smartphone,
  Sliders,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: Smartphone },
];

const configNavItems = [
  { href: "/dashboard/settings/agent", label: "AI Seller Agent", icon: Zap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#09090b] text-white flex flex-col flex-shrink-0 min-h-screen border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#195adc] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-xs">
            A
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">AgentBridge</span>
            <span className="text-[10px] text-zinc-400 block font-normal tracking-wide">RAZORPAY COMMERCE</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Store Ops
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#195adc] text-white shadow-xs"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Configuration
          </p>
          <nav className="space-y-1">
            {configNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-[#195adc] text-white shadow-xs"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Store Indicator */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">RunFast Sports</p>
            <p className="text-[11px] text-zinc-400 truncate">AgentBridge Native + Shopify</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400" title="AI Agent Live" />
        </div>
      </div>
    </aside>
  );
}

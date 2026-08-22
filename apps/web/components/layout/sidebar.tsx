"use client";

import React from "react";
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
  ShieldCheck,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package, count: "5" },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare, count: "2" },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag, count: "37" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/whatsapp", label: "WhatsApp", icon: Smartphone },
];

const configNavItems = [
  { href: "/dashboard/audit", label: "Audit Ledger", icon: ShieldCheck },
  { href: "/dashboard/settings/agent", label: "AI Seller Agent", icon: Zap },
  { href: "/dashboard/settings", label: "Store & Rules", icon: Settings },
];

export function SidebarNavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto overflow-x-hidden min-h-0">
      <div>
        <p className="px-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Store Ops
        </p>
        <nav className="space-y-0.5">
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
                onClick={onItemClick}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white font-semibold shadow-2xs"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                  <span>{item.label}</span>
                </div>

                {item.count && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono font-medium",
                      isActive ? "bg-zinc-700 text-zinc-200" : "bg-zinc-900 text-zinc-500"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <p className="px-2.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Configuration
        </p>
        <nav className="space-y-0.5">
          {configNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white font-semibold shadow-2xs"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 bg-[#0c0d12] text-white flex-col flex-shrink-0 h-screen sticky top-0 border-r border-zinc-800 select-none z-30 overflow-hidden">
      {/* Brand Header (Pinned at Top) */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-800 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
            A
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white block leading-none">
              AgentBridge
            </span>
            <span className="text-[10px] text-zinc-500 block font-normal tracking-wide mt-1">
              RAZORPAY COMMERCE
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <SidebarNavContent />

      {/* Footer Store Status (Pinned at Bottom) */}
      <div className="p-3 border-t border-zinc-800 flex-shrink-0 bg-[#0c0d12]">
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">RunFast Sports</p>
              <p className="text-[11px] text-zinc-400 truncate">Native + Shopify</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Agent Live" />
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>AI Status</span>
            <span className="text-zinc-300 font-medium">Floor Protected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebarDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-[#0c0d12] text-white flex flex-col shadow-2xl border-r border-zinc-800 z-50 select-none pb-[env(safe-area-inset-bottom)]"
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-800 flex-shrink-0">
              <Link
                href="/dashboard"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                  A
                </div>
                <div>
                  <span className="font-semibold text-sm tracking-tight text-white block leading-none">
                    AgentBridge
                  </span>
                  <span className="text-[10px] text-zinc-500 block font-normal tracking-wide mt-1">
                    RAZORPAY COMMERCE
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation items */}
            <SidebarNavContent onItemClick={() => onOpenChange(false)} />

            {/* Footer Store Status */}
            <div className="p-3 border-t border-zinc-800 flex-shrink-0 bg-[#0c0d12]">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">RunFast Sports</p>
                    <p className="text-[11px] text-zinc-400 truncate">Native + Shopify</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>AI Status</span>
                  <span className="text-zinc-300 font-medium">Floor Protected</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}



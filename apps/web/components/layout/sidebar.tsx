"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  ShoppingBag,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Zap,
  Settings,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/context/store-context";

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/growth-ai", label: "Growth Advisor", icon: Sparkles, badge: "AI ✨" },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
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
    <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto no-scrollbar">
      {/* Main Apps */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Merchant Cockpit
        </p>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Engine & Configuration */}
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Engine & Rules
        </p>
        {configNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { currentStore } = useStore();

  return (
    <aside className="w-56 bg-[#0c0d12] text-white flex flex-col flex-shrink-0 border-r border-zinc-800 select-none z-30 hidden lg:flex h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-800 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center shadow-xs ring-1 ring-white/10 group-hover:scale-105 transition-transform flex-shrink-0">
            <Image
              src="/ZAPAI.png"
              alt="ZapAI Logo"
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white block leading-none">
              Zap<span className="text-blue-400">AI</span>
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
              <p className="text-xs font-semibold text-white truncate">
                {currentStore?.name || "Merchant Store"}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">Autonomous AI</p>
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
  const { currentStore } = useStore();

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
                className="flex items-center gap-2.5 group"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center shadow-xs ring-1 ring-white/10 flex-shrink-0">
                  <Image
                    src="/ZAPAI.png"
                    alt="ZapAI Logo"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="font-semibold text-sm tracking-tight text-white block leading-none">
                    Zap<span className="text-blue-400">AI</span>
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
                    <p className="text-xs font-semibold text-white truncate">
                      {currentStore?.name || "Merchant Store"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">Autonomous AI</p>
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

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  Radio,
  ChevronDown,
  User,
  Sliders,
  Sparkles,
  ShoppingBag,
  LogOut,
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Store,
  ExternalLink,
  Package,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ProfileDialog } from "@/components/layout/profile-dialog";
import { GrowthAICopilotDrawer } from "@/components/growth-ai/growth-ai-copilot-drawer";
import { api, defaultMerchantProfile } from "@/lib/api/client";
import { MerchantProfile, StoreCredentials } from "@/lib/types";
import { useStore } from "@/lib/context/store-context";
import { useAuth } from "@/lib/context/auth-context";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { currentStore, stores, switchStore } = useStore();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<MerchantProfile>(defaultMerchantProfile);
  const [creds, setCreds] = useState<StoreCredentials | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: string;
  }>>([]);

  const displayName = user?.name || profile.name || currentStore?.name || "Merchant";
  const displayEmail = user?.email || profile.email;
  const displayMerchantId = user?.merchantId || profile.merchantId || currentStore?.id || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  // Load profile state & live notifications & credentials
  useEffect(() => {
    api.profile.get().then((p) => {
      if (p) setProfile(p);
    });
    api.settings.getCredentials().then((c) => {
      if (c) setCreds(c);
    });
    api.analytics.getNotifications().then((notifs) => {
      if (notifs) {
        setNotifications(notifs);
        setUnreadNotifications(notifs.filter((n) => !n.read).length);
      }
    });
  }, []);

  // Keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayMerchantId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifications(0);
  };

  const handleNavigate = (path: string) => {
    setCommandOpen(false);
    router.push(path);
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-zinc-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none flex-shrink-0">
        {/* Left: Mobile Hamburger + Active Store + Environment Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Interactive Store Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 sm:gap-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-2 sm:px-2.5 py-1 rounded-lg min-w-0 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 group"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: currentStore.color || "#10B981" }}
                />
                <div className="text-left min-w-0">
                  <span className="font-bold text-xs text-zinc-900 truncate block max-w-[110px] sm:max-w-[160px]">
                    {currentStore.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono px-1 py-0 bg-white text-zinc-600 border-zinc-200 hidden sm:inline-flex"
                >
                  {currentStore.city}
                </Badge>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 shrink-0 transition-transform" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={6} className="w-64 p-1.5 rounded-xl border-zinc-200 shadow-xl bg-white">
              <DropdownMenuLabel className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
                Connected Merchant Stores
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stores.map((s) => {
                const isSelected = s.id === currentStore.id;
                return (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => switchStore(s.id)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-blue-50/70 text-blue-900" : "hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs">{s.name}</p>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">{s.tagline}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono bg-zinc-100 text-zinc-600 px-1 rounded">
                          {s.city}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-medium">● Razorpay Live</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:block h-4 w-px bg-zinc-200 mx-1" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-600 font-medium text-[11px]">AI Seller: Online</span>
          </div>

          {/* Gateway Sandbox vs Simulated Indicator Pill */}
          <Link
            href="/dashboard/settings"
            title={
              creds?.razorpayKeyId && !creds.razorpayKeyId.startsWith("rzp_test_mock")
                ? "Razorpay Live Sandbox active. Autonomous payments settle to Razorpay test rail."
                : "Running in Autonomous Simulated Mode (Offline fallback). Click to connect Razorpay keys in Settings."
            }
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium transition-all ${
              creds?.razorpayKeyId && !creds.razorpayKeyId.startsWith("rzp_test_mock")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                creds?.razorpayKeyId && !creds.razorpayKeyId.startsWith("rzp_test_mock")
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span>
              {creds?.razorpayKeyId && !creds.razorpayKeyId.startsWith("rzp_test_mock")
                ? "Razorpay Sandbox"
                : "Simulated Mode"}
            </span>
          </Link>
        </div>

        {/* Center: Quick Search Simulator with Keyboard Shortcut */}
        <div
          onClick={() => setCommandOpen(true)}
          className="hidden md:flex items-center gap-2.5 w-80 bg-zinc-50/80 hover:bg-zinc-100/80 transition-all border border-zinc-200/80 rounded-xl px-3 py-1.5 text-xs text-zinc-500 cursor-pointer group hover:border-zinc-300"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
          <span className="flex-1 text-xs text-zinc-400 group-hover:text-zinc-600 select-none">
            Search products, orders, rules...
          </span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded-md shadow-2xs group-hover:border-zinc-300">
            ⌘K
          </kbd>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Button (Quick ⌘K trigger) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Search dashboard"
            className="md:hidden text-zinc-500 hover:text-zinc-900 p-2 rounded-lg hover:bg-zinc-100/80 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCopilotOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 border-blue-200 px-2.5 py-1.5 h-8 rounded-lg shadow-2xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Growth AI</span>
          </Button>

          <Link
            href="/dashboard/whatsapp"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 px-3 py-1.5 h-8 rounded-lg transition-colors shadow-2xs"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Simulate Lead</span>
          </Link>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Notifications"
                className="text-zinc-500 hover:text-zinc-800 p-2 rounded-lg hover:bg-zinc-100/80 relative cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-80 p-0 rounded-2xl shadow-2xl border-zinc-200/90 bg-white">
              <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 font-display">Notifications</span>
                  {unreadNotifications > 0 && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">
                      {unreadNotifications} new
                    </Badge>
                  )}
                </div>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs space-y-1 transition-colors ${n.read ? "bg-white" : "bg-blue-50/20"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-zinc-900 text-xs">{n.title}</p>
                      <span className="text-[10px] text-zinc-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{n.description}</p>
                  </div>
                ))}
              </div>
              <div className="p-2.5 bg-zinc-50/70 border-t border-zinc-100 text-center">
                <Link
                  href="/dashboard/analytics"
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>View live store activity</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clean Vertical Divider */}
          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-0.5 shrink-0" />

          {/* User Profile Dropdown Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="User Account Menu"
                className="flex items-center gap-1.5 sm:gap-2.5 py-1 px-1.5 sm:px-2 rounded-xl hover:bg-zinc-100/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-zinc-900 leading-none">{displayName}</p>
                  <p className="text-[10px] text-zinc-500 font-mono leading-none mt-1">{displayMerchantId}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-68 p-1.5 rounded-2xl shadow-2xl border-zinc-200/90 bg-white/95 backdrop-blur-md"
            >
              {/* User Profile Summary Header */}
              <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-100/80 mb-1 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 truncate leading-none">{displayName}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate font-mono">{displayEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono border-t border-zinc-200/60">
                  <span className="text-zinc-500">ID: {displayMerchantId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedId ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-blue-600" />
                    )}
                    <span>{copiedId ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Options with Clean SVG Icons */}
              <DropdownMenuGroup className="space-y-0.5">
                <DropdownMenuItem
                  onClick={() => setProfileOpen(true)}
                  className="px-2.5 py-2 text-xs font-medium text-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100/80 hover:text-zinc-900 flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>My Profile & Details</span>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings"
                    className="px-2.5 py-2 text-xs font-medium text-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100/80 hover:text-zinc-900 flex items-center gap-2.5"
                  >
                    <Sliders className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>Store Mandates & Rules</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/settings/agent"
                    className="px-2.5 py-2 text-xs font-medium text-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100/80 hover:text-zinc-900 flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>AI Seller Agent</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/orders"
                    className="px-2.5 py-2 text-xs font-medium text-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-100/80 hover:text-zinc-900 flex items-center gap-2.5"
                  >
                    <ShoppingBag className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>Orders & Invoices</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 bg-zinc-100" />

              {/* Log Out Action */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl cursor-pointer flex items-center gap-2.5 transition-colors focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Interactive Command Palette (⌘K) */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Store Navigation">
            <CommandItem onSelect={() => handleNavigate("/dashboard")}>
              <Store className="w-4 h-4 text-zinc-500" />
              <span>Dashboard Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/growth-ai")}>
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Growth & Inventory Advisor</span>
              <CommandShortcut>AI ✨</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/products")}>
              <Package className="w-4 h-4 text-zinc-500" />
              <span>Products & Catalog</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/whatsapp")}>
              <Radio className="w-4 h-4 text-blue-600" />
              <span>WhatsApp AI Simulation</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/conversations")}>
              <MessageSquare className="w-4 h-4 text-zinc-500" />
              <span>Customer Conversations</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/orders")}>
              <ShoppingBag className="w-4 h-4 text-zinc-500" />
              <span>Orders & Invoices</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/analytics")}>
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              <span>Revenue & GMV Analytics</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings & Account">
            <CommandItem
              onSelect={() => {
                setCommandOpen(false);
                setProfileOpen(true);
              }}
            >
              <User className="w-4 h-4 text-zinc-500" />
              <span>My Profile & Account</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/settings")}>
              <Sliders className="w-4 h-4 text-zinc-500" />
              <span>Store Rules & Mandates</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate("/dashboard/settings/agent")}>
              <Sparkles className="w-4 h-4 text-zinc-500" />
              <span>AI Seller Configuration</span>
            </CommandItem>
            <CommandItem onSelect={handleLogout} className="text-red-600 aria-selected:text-red-600 aria-selected:bg-red-50">
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onProfileUpdated={setProfile}
      />

      {/* Omnipresent Growth AI Copilot Drawer */}
      <GrowthAICopilotDrawer
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
      />
    </>
  );
}

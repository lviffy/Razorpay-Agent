'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Menu,
  X,
  Bot,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Sparkles,
  Package,
  ShoppingBag,
  Sliders,
  LogOut,
  ChevronDown,
  Store,
  Mail,
  User,
} from 'lucide-react'
import Logo from '@/components/logo'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navLinks = [
  { label: 'Primitives', href: '#why-agentic' },
  { label: 'A2A Negotiation', href: '#negotiation' },
  { label: 'Margin Engine', href: '#margin-protection' },
  { label: 'x402 & Rails', href: '#payment-flow' },
  { label: 'Razorpay Suite', href: '#razorpay-services' },
  { label: 'Audit Trail', href: '#audit-trail' },
  { label: 'Integrations', href: '#integrations' },
]

function UserAvatar({
  avatarUrl,
  name,
  initials,
  size = 'md',
}: {
  avatarUrl?: string | null;
  name: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px] rounded-full',
    md: 'w-8 h-8 text-xs rounded-xl',
    lg: 'w-10 h-10 text-sm rounded-xl',
  }[size];

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
        className={`${sizeClasses} object-cover border border-black/10 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-tr from-brand-600 to-blue-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0 select-none`}
    >
      {initials}
    </div>
  );
}

export function HeroHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isLoggedIn = mounted && !isLoading && isAuthenticated && !!user
  const displayName = user?.name || user?.storeName || 'Merchant'
  const displayEmail = user?.email || ''
  const displayStore = user?.storeName
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'M'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-3 sm:pt-4 transition-all duration-300 pointer-events-none">
      <div
        className={cn(
          'w-full max-w-[1240px] transition-all duration-300 pointer-events-auto rounded-full apple-glass border border-black/[0.08]',
          scrolled
            ? 'max-w-5xl py-2.5 px-4 sm:px-6 bg-white/90 shadow-xs'
            : 'py-3 px-5 sm:px-7 bg-white/80'
        )}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-100/90 p-1 rounded-full border border-black/[0.05]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold text-surface-700 hover:text-surface-900 px-3.5 py-1.5 rounded-full hover:bg-white transition-all duration-150 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isLoggedIn ? (
              <>
                {/* User Dropdown Trigger */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full bg-surface-100/80 hover:bg-surface-200/70 border border-black/[0.06] hover:border-black/[0.12] transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                      aria-label="User profile and account menu"
                    >
                      <UserAvatar
                        avatarUrl={user?.avatarUrl}
                        name={displayName}
                        initials={initials}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-surface-800 max-w-[110px] truncate hidden sm:inline-block">
                        {displayName.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-surface-500 group-hover:text-surface-800 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-68 p-1.5 rounded-2xl shadow-2xl border-surface-200/90 bg-white/95 backdrop-blur-md"
                  >
                    {/* User Profile Summary Header */}
                    <div className="p-3 bg-surface-50/90 rounded-xl border border-surface-100 mb-1 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          avatarUrl={user?.avatarUrl}
                          name={displayName}
                          initials={initials}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-surface-900 truncate leading-none">
                            {displayName}
                          </p>
                          {displayEmail && (
                            <p className="text-[11px] text-surface-500 truncate mt-1 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-surface-400 shrink-0" />
                              <span className="truncate font-mono">{displayEmail}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {displayStore && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-surface-600 border-t border-surface-200/60 font-medium truncate">
                          <Store className="w-3 h-3 text-brand-600 shrink-0" />
                          <span className="truncate">{displayStore}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Navigation Items */}
                    <DropdownMenuGroup className="space-y-0.5">
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="px-2.5 py-2 text-xs font-medium text-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 hover:text-surface-900 flex items-center gap-2.5"
                        >
                          <LayoutDashboard className="w-4 h-4 text-surface-500 shrink-0" />
                          <span>Dashboard Overview</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/settings/agent"
                          className="px-2.5 py-2 text-xs font-medium text-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 hover:text-surface-900 flex items-center gap-2.5"
                        >
                          <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>AI Seller Agent</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/products"
                          className="px-2.5 py-2 text-xs font-medium text-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 hover:text-surface-900 flex items-center gap-2.5"
                        >
                          <Package className="w-4 h-4 text-surface-500 shrink-0" />
                          <span>Products & Catalog</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/orders"
                          className="px-2.5 py-2 text-xs font-medium text-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 hover:text-surface-900 flex items-center gap-2.5"
                        >
                          <ShoppingBag className="w-4 h-4 text-surface-500 shrink-0" />
                          <span>Orders & Invoices</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/settings"
                          className="px-2.5 py-2 text-xs font-medium text-surface-700 rounded-xl cursor-pointer hover:bg-surface-100 hover:text-surface-900 flex items-center gap-2.5"
                        >
                          <Sliders className="w-4 h-4 text-surface-500 shrink-0" />
                          <span>Store Mandates & Rules</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1 bg-surface-100" />

                    {/* Log Out */}
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl cursor-pointer flex items-center gap-2.5 transition-colors focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Direct Dashboard Link Button */}
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 sm:px-4 py-2 min-h-[36px] rounded-full transition-all cursor-pointer shadow-xs"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            ) : (
              <Link
                href="/signup"
                className="group inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 sm:px-5 py-2 min-h-[36px] rounded-full transition-all cursor-pointer shadow-xs"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-surface-700 hover:text-brand-900 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full hover:bg-black/[0.04] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border border-surface-200 rounded-3xl p-6 pointer-events-auto md:hidden space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-100">
              <Logo size="sm" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-surface-400 hover:text-surface-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoggedIn && (
              <div className="p-3 bg-surface-50 rounded-2xl border border-surface-100 flex items-center gap-3">
                <UserAvatar
                  avatarUrl={user?.avatarUrl}
                  name={displayName}
                  initials={initials}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-surface-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-surface-500 font-mono truncate">{displayEmail}</p>
                  {displayStore && (
                    <p className="text-[10px] text-brand-600 font-medium truncate mt-0.5">{displayStore}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-surface-700 hover:text-brand-600 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {isLoggedIn && (
                <>
                  <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-surface-400">
                    Console
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-surface-800 hover:text-brand-600 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-surface-500" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/settings/agent"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-surface-800 hover:text-brand-600 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <span>AI Seller Agent</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-xs font-semibold text-surface-800 hover:text-brand-600 px-3 py-2 rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-surface-500" />
                    <span>Store Settings</span>
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-100">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false)
                      await logout()
                    }}
                    className="text-center py-2.5 rounded-full border border-surface-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-xs"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default HeroHeader
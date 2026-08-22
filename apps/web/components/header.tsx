'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X, Bot, ShieldCheck, Zap } from 'lucide-react'
import Logo from '@/components/logo'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'A2A Negotiation', href: '#negotiation' },
  { label: 'Margin Engine', href: '#margin-protection' },
  { label: 'x402 & Razorpay', href: '#payment-flow' },
  { label: 'Audit Trail', href: '#audit-trail' },
  { label: 'Integrations', href: '#integrations' },
]

export function HeroHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-xs font-bold text-surface-700 hover:text-surface-900 px-3.5 py-2 min-h-[36px] rounded-full hover:bg-black/[0.04] transition-all duration-150"
            >
              Sign In
            </Link>

            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 sm:px-5 py-2 min-h-[36px] rounded-full transition-all cursor-pointer shadow-xs"
            >
              <span>Start ZapAI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

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
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-100">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-full border border-surface-200 text-xs font-bold text-surface-800 hover:bg-surface-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-xs"
              >
                Start ZapAI
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default HeroHeader
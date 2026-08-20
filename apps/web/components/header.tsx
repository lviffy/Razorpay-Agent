'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X, Bot, ShieldCheck, CreditCard, Sparkles } from 'lucide-react'
import Logo from '@/components/logo'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'ARCHITECTURE', href: '#architecture' },
  { label: 'WHATSAPP AI', href: '#whatsapp-ai' },
  { label: 'CATALOG & SHOPIFY', href: '#catalog' },
  { label: 'MARGIN MANDATES', href: '#mandates' },
  { label: 'INTEGRATIONS', href: '#integrations' },
]

export function HeroHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-3 sm:pt-4 transition-all duration-300 pointer-events-none">
      <div
        className={cn(
          'w-full max-w-[1300px] transition-all duration-300 pointer-events-auto rounded-full border',
          scrolled
            ? 'max-w-5xl bg-white/90 backdrop-blur-md border-[#e4e4e7] shadow-sm py-2 px-4 sm:px-6'
            : 'bg-white/80 backdrop-blur-sm border-[#e4e4e7] py-3 px-5 sm:px-8'
        )}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[11px] font-mono font-bold tracking-wider text-[#52525b] hover:text-[#09090b] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-xs font-bold text-[#52525b] hover:text-[#09090b] px-3.5 py-2 min-h-[40px] rounded-full transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 bg-[#195adc] hover:bg-[#378ffa] text-white text-xs font-bold px-5 py-2.5 min-h-[40px] rounded-full transition-all shadow-subtle hover:shadow-card"
            >
              <span>Launch Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#52525b] hover:text-[#09090b] min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#f4f4f5] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-4 top-20 bg-white border border-[#e4e4e7] rounded-3xl p-6 shadow-xl pointer-events-auto lg:hidden space-y-5"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-mono font-bold text-[#52525b] hover:text-[#195adc] py-2 border-b border-[#f4f4f5]"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-full border border-[#e4e4e7] text-xs font-bold text-[#09090b] hover:bg-[#f8fafc]"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-full bg-[#195adc] text-white text-xs font-bold hover:bg-[#378ffa]"
              >
                Launch Store
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default HeroHeader
'use client'

import React from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { DottedMap } from '@/components/ui/dotted-map'
import { ShieldCheck, ArrowUpRight } from 'lucide-react'

const markers = [
  {
    lat: 12.9716,
    lng: 77.5946,
    size: 3,
    pulse: true,
  },
]

const footerLinks = {
  platform: [
    { name: 'Conversational Setup', href: '/onboarding' },
    { name: 'Merchant Dashboard', href: '/dashboard' },
    { name: 'Unified Catalog', href: '/dashboard/products' },
    { name: 'AI Trace Engine', href: '/dashboard/conversations' },
    { name: 'Orders & Settlement', href: '/dashboard/orders' },
  ],
  rails: [
    { name: 'Razorpay Payment Links', href: '#flow-intro' },
    { name: 'WhatsApp Cloud API', href: '#flow-intro' },
    { name: 'Shopify Admin Sync', href: '#mandates' },
    { name: 'HMAC SHA-256 Webhooks', href: '#mandates-detail' },
    { name: 'Gemini 2.5 Intent Detection', href: '#architecture' },
  ],
  account: [
    { name: 'Merchant Sign In', href: '/login' },
    { name: 'Create AI Store', href: '/onboarding' },
    { name: 'Agent Settings', href: '/dashboard/settings/agent' },
    { name: 'WhatsApp Channel', href: '/dashboard/whatsapp' },
  ],
}

export default function Footer() {
  return (
    <footer className="relative bg-[#09090b] text-white border-t border-white/10 overflow-hidden">
      <DottedMap
        markers={markers}
        width={800}
        height={400}
        dotRadius={1}
        markerColor="#195adc"
        dotColor="#27272a"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b] pointer-events-none" />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10">
        {/* Main Footer Content */}
        <div className="pt-16 pb-12 sm:pt-20 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Logo and Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-extrabold text-sm">
                  A
                </div>
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  Agent<span className="text-brand-400">Bridge</span>
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Autonomous agentic commerce middleware connecting WhatsApp conversations,
                deterministic margin mandates, and Razorpay instant settlements.
              </p>
              <div className="flex items-center gap-2 text-gray-400 text-xs font-mono pt-1">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Bangalore, India • Razorpay Rails</span>
              </div>
            </div>

            {/* Links Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {/* Platform */}
                <div>
                  <h3 className="text-white/60 font-mono font-bold text-xs uppercase tracking-widest mb-4">
                    Platform
                  </h3>
                  <ul className="space-y-2.5">
                    {footerLinks.platform.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors text-xs flex items-center gap-1 group"
                        >
                          <span>{link.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rails */}
                <div>
                  <h3 className="text-white/60 font-mono font-bold text-xs uppercase tracking-widest mb-4">
                    Integrations
                  </h3>
                  <ul className="space-y-2.5">
                    {footerLinks.rails.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors text-xs"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Account */}
                <div>
                  <h3 className="text-white/60 font-mono font-bold text-xs uppercase tracking-widest mb-4">
                    Store
                  </h3>
                  <ul className="space-y-2.5">
                    {footerLinks.account.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors text-xs"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Bottom Footer */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
          <p>© 2026 AgentBridge Inc. Built for Razorpay Agentic Commerce.</p>
          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
            <span className="text-gray-500">API v2.9 • Cloud v21.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}


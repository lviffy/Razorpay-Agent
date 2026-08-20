'use client'
import React from 'react'
import Link from 'next/link'
import Logo from '@/components/logo'
import { Separator } from '@/components/ui/separator'
import { DottedMap } from '@/components/ui/dotted-map'

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
    { name: 'Razorpay Payment Links', href: '#architecture' },
    { name: 'WhatsApp Cloud API', href: '#architecture' },
    { name: 'Shopify Admin Sync', href: '#catalog' },
    { name: 'HMAC SHA-256 Webhooks', href: '#mandates' },
    { name: 'Gemini 2.5 Flash Intent', href: '#features' },
  ],
  account: [
    { name: 'Merchant Sign In', href: '/login' },
    { name: 'Create Store', href: '/onboarding' },
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
        dotColor="#333"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/40 to-[#09090b] pointer-events-none" />

      <div className="relative mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 z-10">
        {/* Main Footer Content */}
        <div className="pt-16 pb-10 sm:pt-20 sm:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Logo and Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#195adc] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  A
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Agent<span className="text-[#378ffa]">Bridge</span>
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Autonomous agentic commerce middleware connecting WhatsApp conversations,
                deterministic margin mandates, and Razorpay instant settlements.
              </p>
              <div className="flex items-center gap-2 text-gray-500 text-xs font-mono">
                <svg
                  className="w-3.5 h-3.5 text-[#195adc]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Bangalore, India • Razorpay Rails
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
                          className="text-gray-400 hover:text-white transition-colors text-xs"
                        >
                          {link.name}
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
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-mono">
          <p>© 2026 AgentBridge Inc. Built for Razorpay Agentic Commerce.</p>
          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
            <span>API v2.9 • Cloud v21.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

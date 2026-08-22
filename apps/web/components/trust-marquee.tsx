'use client'

import React from 'react'
import { InfiniteSlider } from './ui/infinite-slider'
import { CheckCircle2 } from 'lucide-react'

const ECOSYSTEM_PARTNERS = [
  {
    name: 'Razorpay',
    category: 'Payment Rails',
    badge: 'Official Integration',
    color: '#0052ff',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
          fill="#0052ff"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
        <path d="M12 6l-5 3v6l5 3 5-3V9l-5-3z" fill="#ffffff" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp Cloud API',
    category: 'Meta Verified',
    badge: 'Enterprise BSP',
    color: '#25D366',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.27.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.19-.3a8.21 8.21 0 0 1-1.25-4.45c0-4.54 3.7-8.24 8.24-8.24z"
          fill="#25D366"
        />
      </svg>
    ),
  },
  {
    name: 'Google Pay',
    category: '1-Tap UPI',
    badge: 'Instant Intent',
    color: '#4285F4',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#f8fafc" />
        <path d="M12 5v14M5 12h14" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'PhonePe',
    category: 'UPI Autopay',
    badge: 'Zero Dropoff',
    color: '#5f259f',
    icon: (
      <div className="w-5 h-5 rounded-md bg-[#5f259f] flex items-center justify-center text-white font-bold text-[10px]">
        पे
      </div>
    ),
  },
  {
    name: 'Shopify Sync',
    category: 'Catalog Engine',
    badge: 'OAuth 2.0',
    color: '#95BF47',
    icon: (
      <div className="w-5 h-5 rounded-md bg-[#95BF47] flex items-center justify-center text-white font-bold text-[10px]">
        S
      </div>
    ),
  },
  {
    name: 'CRED UPI',
    category: 'High-Ticket Pay',
    badge: 'Premium D2C',
    color: '#000000',
    icon: (
      <div className="w-5 h-5 rounded-md bg-black flex items-center justify-center text-white font-bold text-[10px]">
        C
      </div>
    ),
  },
  {
    name: 'Paytm UPI',
    category: 'Instant Settle',
    badge: 'Bank Switch',
    color: '#00b9f5',
    icon: (
      <div className="w-5 h-5 rounded-md bg-[#00b9f5] flex items-center justify-center text-white font-bold text-[10px]">
        P
      </div>
    ),
  },
  {
    name: 'HDFC & ICICI',
    category: 'Direct Settle',
    badge: 'T+0 INR',
    color: '#004c8f',
    icon: (
      <div className="w-5 h-5 rounded-md bg-[#004c8f] flex items-center justify-center text-white font-bold text-[9px]">
        BANK
      </div>
    ),
  },
]

export function TrustMarquee() {
  return (
    <div className="w-full py-8 border-b border-black/[0.06] bg-white relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-surface-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-surface-800 uppercase tracking-wider text-[11px] font-mono">
            Payment &amp; Cloud Messaging Infrastructure
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PCI-DSS Compliant
          </span>
          <span>•</span>
          <span className="text-surface-600 font-medium">HMAC SHA-256 Verified Webhooks</span>
        </div>
      </div>

      <div
        className="relative group"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <InfiniteSlider speed={32} gap={16}>
          {ECOSYSTEM_PARTNERS.map((partner, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-2.5 bg-surface-50 rounded-2xl border border-black/[0.06] hover:border-brand-500/40 transition-all duration-200 min-w-[200px]"
            >
              <div className="shrink-0">{partner.icon}</div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-surface-900 font-sans">
                    {partner.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface-200 text-surface-700">
                    {partner.badge}
                  </span>
                </div>
                <span className="text-[10px] text-surface-500 font-medium">
                  {partner.category}
                </span>
              </div>
            </div>
          ))}
        </InfiniteSlider>
      </div>
    </div>
  )
}

export default TrustMarquee

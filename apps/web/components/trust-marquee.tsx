'use client'

import React from 'react'
import Image from 'next/image'
import { InfiniteSlider } from './ui/infinite-slider'
import { CheckCircle2, ShieldCheck, Zap, Lock, Database, KeyRound, Banknote } from 'lucide-react'
import {
  RazorpayIcon,
  WhatsAppIcon,
  GooglePayIcon,
  PhonePeIcon,
  ShopifyIcon,
  CredIcon,
  PaytmIcon,
  BankSettlementIcon,
} from './icons/brand-icons'

const ECOSYSTEM_PARTNERS = [
  {
    name: 'x402 V2 Protocol',
    category: 'M2M Payment Spec',
    badge: 'PAYMENT-REQ',
    color: '#0052ff',
    icon: <Zap className="w-5 h-5 text-brand-600" />,
  },
  {
    name: 'ZapAI Facilitator',
    category: 'Protocol Coordinator',
    badge: 'zapai-inr',
    color: '#195adc',
    icon: (
      <Image
        src="/ZAPAI.png"
        alt="ZapAI Facilitator"
        width={20}
        height={20}
        className="w-5 h-5 rounded-xs object-cover"
      />
    ),
  },
  {
    name: 'Spending Mandates',
    category: 'Zero-Trust Tokens',
    badge: 'AP2 Standard',
    color: '#10b981',
    icon: <KeyRound className="w-5 h-5 text-emerald-600" />,
  },
  {
    name: 'Razorpay',
    category: 'Financial Settlement',
    badge: 'Orders API',
    color: '#0052ff',
    icon: <RazorpayIcon className="w-5 h-5 text-[#0052ff]" />,
  },
  {
    name: 'Redis Concurrency',
    category: 'Atomic Lock',
    badge: 'TTL 120s',
    color: '#ef4444',
    icon: <Lock className="w-5 h-5 text-rose-600" />,
  },
  {
    name: 'Audit Ledger',
    category: 'SHA-256 Chained',
    badge: 'Tamper-Proof',
    color: '#8b5cf6',
    icon: <Database className="w-5 h-5 text-purple-600" />,
  },
  {
    name: 'WhatsApp Cloud API',
    category: 'Meta Verified',
    badge: 'Async Worker',
    color: '#25D366',
    icon: <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />,
  },
  {
    name: 'Bank Settlement',
    category: 'Instant INR',
    badge: 'T+0 Direct',
    color: '#004c8f',
    icon: <BankSettlementIcon className="w-5 h-5 text-[#004c8f]" />,
  },
]

export function TrustMarquee() {
  return (
    <div className="w-full py-8 border-b border-black/[0.06] bg-white relative overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-surface-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse" />
          <span className="font-semibold text-surface-800 uppercase tracking-wider text-[11px] font-mono">
            x402 V2 • Zero-Trust Mandates • Razorpay Settlement Stack
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Deterministic Policy Engine
          </span>
          <span>•</span>
          <span className="text-surface-600 font-medium">HMAC SHA-256 Verified Webhooks</span>
        </div>
      </div>

      <div
        className="relative group overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div className="animate-marquee-scroll py-1 gap-4">
          {[...ECOSYSTEM_PARTNERS, ...ECOSYSTEM_PARTNERS].map((partner, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-2.5 bg-surface-50/90 rounded-2xl border border-black/[0.06] hover:border-brand-500/40 hover:bg-white transition-colors duration-150 min-w-[220px] shrink-0"
            >
              <div className="shrink-0">{partner.icon}</div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-surface-900 font-sans">
                    {partner.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface-200/80 text-surface-700">
                    {partner.badge}
                  </span>
                </div>
                <span className="text-[10px] text-surface-500 font-medium">
                  {partner.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrustMarquee

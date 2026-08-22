'use client'

import React from 'react'
import { InfiniteSlider } from './ui/infinite-slider'
import { CheckCircle2 } from 'lucide-react'
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
    name: 'Razorpay',
    category: 'Payment Rails',
    badge: 'Official Integration',
    color: '#0052ff',
    icon: <RazorpayIcon className="w-5 h-5 text-[#0052ff]" />,
  },
  {
    name: 'WhatsApp Cloud API',
    category: 'Meta Verified',
    badge: 'Enterprise BSP',
    color: '#25D366',
    icon: <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />,
  },
  {
    name: 'Google Pay',
    category: '1-Tap UPI',
    badge: 'Instant Intent',
    color: '#4285F4',
    icon: <GooglePayIcon className="w-5 h-5 text-[#4285F4]" />,
  },
  {
    name: 'PhonePe',
    category: 'UPI Autopay',
    badge: 'Zero Dropoff',
    color: '#5f259f',
    icon: <PhonePeIcon className="w-5 h-5 text-[#5f259f]" />,
  },
  {
    name: 'Shopify Sync',
    category: 'Catalog Engine',
    badge: 'OAuth 2.0',
    color: '#95BF47',
    icon: <ShopifyIcon className="w-5 h-5 text-[#95BF47]" />,
  },
  {
    name: 'CRED UPI',
    category: 'High-Ticket Pay',
    badge: 'Premium D2C',
    color: '#000000',
    icon: <CredIcon className="w-5 h-5" />,
  },
  {
    name: 'Paytm UPI',
    category: 'Instant Settle',
    badge: 'Bank Switch',
    color: '#00b9f5',
    icon: <PaytmIcon className="w-5 h-5 text-[#00b9f5]" />,
  },
  {
    name: 'HDFC & ICICI',
    category: 'Direct Settle',
    badge: 'T+0 INR',
    color: '#004c8f',
    icon: <BankSettlementIcon className="w-5 h-5 text-[#004c8f]" />,
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

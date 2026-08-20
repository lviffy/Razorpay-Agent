'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  Zap,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function WhatsAppSellingIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" className="w-full h-full overflow-visible">
      {/* Background container */}
      <rect x="10" y="10" width="300" height="200" rx="16" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />

      {/* Header bar */}
      <rect x="10" y="10" width="300" height="38" rx="16" fill="#0C2340" />
      <circle cx="32" cy="29" r="10" fill="#195adc" />
      <text x="32" y="32.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI
      </text>
      <text x="50" y="27" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
        RunFast Sports (AI Seller)
      </text>
      <text x="50" y="37" fill="#93c5fd" fontSize="7.5" fontFamily="sans-serif">
        WhatsApp Cloud API • Online
      </text>
      <rect x="235" y="22" width="60" height="14" rx="7" fill="#1e3a8a" />
      <text x="265" y="32" fill="#60a5fa" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        &lt;40ms LATENCY
      </text>

      {/* Customer Bubble 1 */}
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <rect x="25" y="58" width="180" height="26" rx="8" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="0.8" />
        <text x="35" y="74" fill="#09090b" fontSize="8" fontFamily="sans-serif">
          Nike Pegasus 40 UK 9 for ₹3,600?
        </text>
      </motion.g>

      {/* AI Bubble 1 with Margin Guardrail */}
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <rect x="110" y="92" width="185" height="48" rx="8" fill="#0C2340" />
        <text x="120" y="107" fill="#93c5fd" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
          AI Counter-Offer (Mandate Protected)
        </text>
        <text x="120" y="120" fill="#ffffff" fontSize="8" fontFamily="sans-serif">
          Can lock ₹3,799 + Express Shipping!
        </text>
        <rect x="120" y="126" width="100" height="10" rx="3" fill="#1e3a8a" />
        <text x="170" y="133.5" fill="#38bdf8" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
          Floor ₹3,500 • Discount 5%
        </text>
      </motion.g>

      {/* Razorpay 1-Tap Link Bubble */}
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <rect x="80" y="148" width="215" height="46" rx="8" fill="#195adc" />
        <text x="92" y="163" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          Razorpay Instant Checkout
        </text>
        <text x="92" y="174" fill="#dbeafe" fontSize="7.5" fontFamily="monospace">
          rzp.io/i/plink_pegasus_40
        </text>
        <rect x="92" y="179" width="110" height="11" rx="4" fill="#ffffff" />
        <text x="147" y="187.5" fill="#195adc" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          1-Tap UPI Pay (₹3,799)
        </text>
        <circle cx="280" cy="171" r="5" fill="#10b981" />
        <text x="280" y="173.5" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">✓</text>
      </motion.g>
    </svg>
  )
}

function UnifiedCatalogIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" className="w-full h-full overflow-visible">
      <rect x="10" y="10" width="300" height="200" rx="16" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />

      {/* Header */}
      <rect x="10" y="10" width="300" height="38" rx="16" fill="#f8fafc" stroke="#e4e4e7" strokeWidth="1" />
      <text x="25" y="32" fill="#09090b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
        Unified Catalog &amp; Inventory Engine
      </text>
      <rect x="225" y="20" width="70" height="18" rx="9" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="260" y="32" fill="#195adc" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        + SHOPIFY SYNC
      </text>

      {/* Product Row 1 */}
      <rect x="25" y="58" width="270" height="42" rx="8" fill="#ffffff" stroke="#e4e4e7" />
      <rect x="35" y="66" width="26" height="26" rx="4" fill="#0C2340" />
      <text x="48" y="82" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">NK</text>
      <text x="68" y="74" fill="#09090b" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
        Nike Air Zoom Pegasus 40
      </text>
      <text x="68" y="85" fill="#52525b" fontSize="7.5" fontFamily="monospace">
        SKU: NK-PEG-40 • Stock: 18 • Floor: ₹3,500
      </text>
      <rect x="235" y="68" width="50" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="260" y="81" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI ACTIVE
      </text>

      {/* Product Row 2 */}
      <rect x="25" y="108" width="270" height="42" rx="8" fill="#ffffff" stroke="#e4e4e7" />
      <rect x="35" y="116" width="26" height="26" rx="4" fill="#195adc" />
      <text x="48" y="132" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">HV</text>
      <text x="68" y="124" fill="#09090b" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
        RunFast Pro Hydro Vest (5L)
      </text>
      <text x="68" y="135" fill="#52525b" fontSize="7.5" fontFamily="monospace">
        SKU: RF-VEST-05 • Stock: 12 • Floor: ₹1,599
      </text>
      <rect x="235" y="118" width="50" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="260" y="131" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI ACTIVE
      </text>

      {/* Live Lock Banner */}
      <rect x="25" y="158" width="270" height="38" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
      <circle cx="42" cy="177" r="8" fill="#195adc" />
      <text x="42" y="180" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">🔒</text>
      <text x="58" y="174" fill="#1e3a8a" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        Autonomous Unit Lock Active
      </text>
      <text x="58" y="184" fill="#3b82f6" fontSize="7" fontFamily="monospace">
        1 unit reserved (15m window) for WhatsApp checkout #9876
      </text>
    </svg>
  )
}

function RazorpaySettlementIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" className="w-full h-full overflow-visible">
      <rect x="10" y="10" width="300" height="200" rx="16" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />

      {/* Header */}
      <rect x="10" y="10" width="300" height="38" rx="16" fill="#0C2340" />
      <text x="25" y="32" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
        Razorpay Settlement &amp; Webhook Gateway
      </text>
      <rect x="220" y="20" width="75" height="18" rx="9" fill="#10b981" />
      <text x="257" y="32" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        HMAC VERIFIED
      </text>

      {/* Webhook Event Stream 1 */}
      <rect x="25" y="58" width="270" height="38" rx="8" fill="#f8fafc" stroke="#e4e4e7" />
      <circle cx="42" cy="77" r="7" fill="#10b981" />
      <text x="42" y="80" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">✓</text>
      <text x="56" y="73" fill="#09090b" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        payment.captured (₹3,799.00)
      </text>
      <text x="56" y="83" fill="#52525b" fontSize="7" fontFamily="monospace">
        pay_Rzp982012 • UPI @okaxis • Sign: 7c4e...
      </text>
      <text x="255" y="78" fill="#059669" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
        CAPTURED
      </text>

      {/* Webhook Event Stream 2 */}
      <rect x="25" y="102" width="270" height="38" rx="8" fill="#f8fafc" stroke="#e4e4e7" />
      <circle cx="42" cy="121" r="7" fill="#195adc" />
      <text x="42" y="124" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">→</text>
      <text x="56" y="117" fill="#09090b" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        order.fulfilled &amp; Inventory Committed
      </text>
      <text x="56" y="127" fill="#52525b" fontSize="7" fontFamily="monospace">
        Stock deducted: NK-PEG-40 (-1) • Order #AB-1092
      </text>
      <text x="255" y="122" fill="#195adc" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
        FULFILLED
      </text>

      {/* Security Audit Badge */}
      <rect x="25" y="148" width="270" height="48" rx="8" fill="#0C2340" />
      <text x="38" y="166" fill="#93c5fd" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
        SECURITY &amp; COMPLIANCE AUDIT
      </text>
      <text x="38" y="178" fill="#ffffff" fontSize="7.5" fontFamily="sans-serif">
        Backend-only execution • Zero merchant secret leakage • PCI-DSS
      </text>
      <circle cx="270" cy="172" r="10" fill="#195adc" />
      <text x="270" y="175.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
        🛡
      </text>
    </svg>
  )
}

const targetSegments = [
  {
    id: 'd2c',
    tabName: '01 D2C BRANDS',
    title: 'Built for High-Growth D2C Brands',
    subtitle: 'Direct WhatsApp Selling Without Web Drop-Off',
    description:
      'Transform casual social shoppers and abandoned cart leads into immediate paying customers on WhatsApp with personalized multi-turn AI negotiation.',
    bullets: [
      '3x Higher Conversion vs Web Storefronts',
      'Personalized Product Recommendations',
      'Automated Negotiation within Pre-set Margins',
      'Instant One-Tap UPI Checkout via Razorpay',
    ],
    illustration: WhatsAppSellingIllustration,
  },
  {
    id: 'merchants',
    tabName: '02 SHOPIFY SELLERS',
    title: 'Built for High-Volume Merchants & Shopify Stores',
    subtitle: 'Unified Catalog & Automated Stock Protection',
    description:
      'Sync 100+ Shopify SKUs or manage a native catalog with zero technical overhead. Automated 15-minute unit locking ensures no inventory conflicts.',
    bullets: [
      'One-Click Shopify OAuth & Variant Sync',
      'Granular Margin Floor Rules per SKU',
      'Autonomous 15-Minute Unit Reservation Locks',
      'Multi-Variant and Size-Aware Recommendations',
    ],
    illustration: UnifiedCatalogIllustration,
  },
  {
    id: 'enterprise',
    tabName: '03 ENTERPRISE COMMERCE',
    title: 'Built for Enterprise Merchants & Multi-Store Operators',
    subtitle: 'Banking-Grade Rails & Human Escalation',
    description:
      'Scale across dedicated WhatsApp numbers with seamless human escalation rules, cryptographic webhook auditing, and zero client secret exposure.',
    bullets: [
      'Official WhatsApp Cloud API Multi-Number Routing',
      'HMAC SHA-256 Verified Webhook Gateway',
      'One-Click Human Agent Live Takeover',
      'Audit Trails for Every Price Negotiation',
    ],
    illustration: RazorpaySettlementIllustration,
  },
]

export default function BuiltForWhomSection() {
  const [activeTab, setActiveTab] = useState<string>('d2c')
  const current = targetSegments.find((s) => s.id === activeTab) || targetSegments[0]
  const IllustrationComponent = current.illustration

  return (
    <section id="mandates" className="py-20 sm:py-28 bg-white text-[#09090b]">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#195adc]" />
              <span className="text-[11px] font-mono font-bold tracking-wider text-[#52525b] uppercase">
                TARGET COMMERCE WORKFLOWS
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#09090b] leading-[1.15]">
              Designed for modern merchants, <br />
              <span className="text-[#195adc]">engineered for margins.</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {targetSegments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setActiveTab(segment.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer',
                  activeTab === segment.id
                    ? 'bg-[#195adc] text-white shadow-xs'
                    : 'bg-[#f4f4f5] text-[#52525b] hover:text-[#09090b] hover:bg-[#e4e4e7]'
                )}
              >
                {segment.tabName}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Pane Frame */}
        <div className="bg-[#f8fafc] border border-[#e4e4e7] rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xs">
          {/* Left Description (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-[#195adc] uppercase">
                    {current.subtitle}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#09090b] tracking-tight">
                    {current.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                  {current.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-[#09090b] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/onboarding">
                    <Button className="bg-[#195adc] hover:bg-[#378ffa] text-white font-bold rounded-full text-xs px-6 h-11 gap-2">
                      <span>Get Started with {current.tabName.replace(/^[0-9]+\s*/, '')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Interactive Illustration (6 cols) */}
          <div className="lg:col-span-6 aspect-[4/3] bg-white border border-[#e4e4e7] rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                <IllustrationComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
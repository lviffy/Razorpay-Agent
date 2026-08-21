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
    <svg viewBox="0 0 340 230" fill="none" className="w-full h-full overflow-visible">
      <rect x="10" y="10" width="320" height="210" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="10" y="10" width="320" height="38" rx="16" fill="#0c2340" />
      <circle cx="32" cy="29" r="10" fill="#195adc" />
      <text x="32" y="32.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI
      </text>
      <text x="50" y="27" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
        RunFast Sports (AI Seller)
      </text>
      <text x="50" y="37" fill="#93c5fd" fontSize="7.5" fontFamily="sans-serif">
        WhatsApp Cloud API • Online
      </text>
      <rect x="250" y="22" width="65" height="14" rx="7" fill="#1e3a8a" />
      <text x="282.5" y="32" fill="#60a5fa" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        &lt;40ms LATENCY
      </text>

      {/* Customer Bubble */}
      <g>
        <rect x="25" y="58" width="190" height="28" rx="8" fill="#f4f5f7" stroke="#e5e7eb" strokeWidth="0.8" />
        <text x="35" y="75.5" fill="#09090b" fontSize="8.5" fontFamily="sans-serif">
          Nike Pegasus 40 UK 9 for ₹3,400?
        </text>
      </g>

      {/* AI Counter-Offer Bubble */}
      <g>
        <rect x="110" y="94" width="205" height="50" rx="8" fill="#0c2340" />
        <text x="122" y="109" fill="#93c5fd" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          AI Counter-Offer (Mandate Protected)
        </text>
        <text x="122" y="123" fill="#ffffff" fontSize="8.5" fontFamily="sans-serif">
          Can lock ₹3,699 + Free Express Delivery!
        </text>
        <rect x="122" y="129" width="105" height="11" rx="3" fill="#1e3a8a" />
        <text x="174.5" y="137.5" fill="#38bdf8" fontSize="7" textAnchor="middle" fontFamily="monospace">
          Floor ₹3,500 • Margin 18%
        </text>
      </g>

      {/* Razorpay 1-Tap Checkout Link */}
      <g>
        <rect x="90" y="152" width="225" height="50" rx="8" fill="#195adc" />
        <text x="102" y="167" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
          Razorpay Instant 1-Tap Checkout
        </text>
        <text x="102" y="179" fill="#dbeafe" fontSize="7.5" fontFamily="monospace">
          rzp.io/i/plink_pegasus_40
        </text>
        <rect x="102" y="184" width="115" height="13" rx="4" fill="#ffffff" />
        <text x="159.5" y="193.5" fill="#195adc" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          1-Tap UPI Pay (₹3,699)
        </text>
        <circle cx="295" cy="177" r="6" fill="#10b981" />
        <text x="295" y="180" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✓</text>
      </g>
    </svg>
  )
}

function UnifiedCatalogIllustration() {
  return (
    <svg viewBox="0 0 340 230" fill="none" className="w-full h-full overflow-visible">
      <rect x="10" y="10" width="320" height="210" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="10" y="10" width="320" height="38" rx="16" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="1" />
      <text x="25" y="32" fill="#09090b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
        Unified Catalog &amp; Inventory Engine
      </text>
      <rect x="235" y="20" width="80" height="18" rx="9" fill="#eff6ff" stroke="#bfdbfe" />
      <text x="275" y="32" fill="#195adc" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        + SHOPIFY SYNC
      </text>

      {/* Product Row 1 */}
      <rect x="25" y="58" width="290" height="44" rx="8" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="35" y="66" width="28" height="28" rx="4" fill="#0c2340" />
      <text x="49" y="83" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">NK</text>
      <text x="70" y="75" fill="#09090b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
        Nike Air Zoom Pegasus 40
      </text>
      <text x="70" y="87" fill="#6b7280" fontSize="7.5" fontFamily="monospace">
        SKU: NK-PEG-40 • Stock: 18 • Floor: ₹3,500
      </text>
      <rect x="250" y="68" width="55" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="277.5" y="82" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI ACTIVE
      </text>

      {/* Product Row 2 */}
      <rect x="25" y="110" width="290" height="44" rx="8" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="35" y="118" width="28" height="28" rx="4" fill="#195adc" />
      <text x="49" y="135" fill="#ffffff" fontSize="9.5" fontWeight="bold" textAnchor="middle">RF</text>
      <text x="70" y="127" fill="#09090b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
        RunFast Pro Hydro Vest (5L)
      </text>
      <text x="70" y="139" fill="#6b7280" fontSize="7.5" fontFamily="monospace">
        SKU: RF-VEST-05 • Stock: 12 • Floor: ₹1,599
      </text>
      <rect x="250" y="120" width="55" height="22" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
      <text x="277.5" y="134" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        AI ACTIVE
      </text>

      {/* Live Lock Banner */}
      <rect x="25" y="162" width="290" height="40" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
      <circle cx="42" cy="182" r="8" fill="#195adc" />
      {/* SVG lock vector */}
      <path d="M40 180v-2a2 2 0 0 1 4 0v2" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <rect x="39" y="180" width="6" height="5" rx="1" fill="#ffffff" />
      <text x="58" y="179" fill="#1e3a8a" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
        Autonomous Unit Lock Active
      </text>
      <text x="58" y="190" fill="#3b82f6" fontSize="7.5" fontFamily="monospace">
        1 unit reserved (15m timer) for WhatsApp buyer +919876543210
      </text>
    </svg>
  )
}

function RazorpaySettlementIllustration() {
  return (
    <svg viewBox="0 0 340 230" fill="none" className="w-full h-full overflow-visible">
      <rect x="10" y="10" width="320" height="210" rx="16" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="10" y="10" width="320" height="38" rx="16" fill="#0c2340" />
      <text x="25" y="32" fill="#ffffff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">
        Razorpay Settlement &amp; Webhook Gateway
      </text>
      <rect x="230" y="20" width="85" height="18" rx="9" fill="#10b981" />
      <text x="272.5" y="32" fill="#ffffff" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        HMAC VERIFIED
      </text>

      {/* Webhook Event 1 */}
      <rect x="25" y="58" width="290" height="40" rx="8" fill="#f8fafc" stroke="#e5e7eb" />
      <circle cx="42" cy="78" r="8" fill="#10b981" />
      <text x="42" y="81" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✓</text>
      <text x="58" y="74" fill="#09090b" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
        payment.captured (₹3,699.00)
      </text>
      <text x="58" y="85" fill="#6b7280" fontSize="7.5" fontFamily="monospace">
        pay_Rzp982012 • UPI @okaxis • Sign: 7c4e8b91...
      </text>
      <text x="270" y="80" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        CAPTURED
      </text>

      {/* Webhook Event 2 */}
      <rect x="25" y="104" width="290" height="40" rx="8" fill="#f8fafc" stroke="#e5e7eb" />
      <circle cx="42" cy="124" r="8" fill="#195adc" />
      <text x="42" y="127" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">→</text>
      <text x="58" y="120" fill="#09090b" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
        order.fulfilled &amp; Inventory Committed
      </text>
      <text x="58" y="131" fill="#6b7280" fontSize="7.5" fontFamily="monospace">
        Stock deducted: NK-PEG-40 (-1) • Order #AB-1092
      </text>
      <text x="270" y="126" fill="#195adc" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        FULFILLED
      </text>

      {/* Security Audit Banner */}
      <rect x="25" y="152" width="290" height="50" rx="8" fill="#0c2340" />
      <text x="38" y="171" fill="#93c5fd" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        SECURITY &amp; COMPLIANCE AUDIT
      </text>
      <text x="38" y="184" fill="#ffffff" fontSize="7.5" fontFamily="sans-serif">
        Backend-only execution • Zero merchant secret leakage • PCI-DSS
      </text>
      <circle cx="285" cy="177" r="10" fill="#195adc" />
      {/* SVG shield vector */}
      <path d="M285 171l4 2v4c0 3-4 6-4 6s-4-3-4-6v-4l4-2z" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const targetSegments = [
  {
    id: 'd2c',
    tabName: 'D2C Brands',
    title: 'Built for High-Growth D2C Brands',
    subtitle: 'Direct WhatsApp Selling Without Web Drop-Off',
    description:
      'Transform casual social shoppers and abandoned cart leads into immediate paying customers on WhatsApp with personalized multi-turn AI negotiation.',
    bullets: [
      '3.4x Higher Conversion vs Web Storefronts',
      'Personalized Product Recommendations',
      'Automated Negotiation within Pre-set Margins',
      'Instant One-Tap UPI Checkout via Razorpay',
    ],
    illustration: WhatsAppSellingIllustration,
  },
  {
    id: 'merchants',
    tabName: 'Shopify Sellers',
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
    tabName: 'Enterprise Commerce',
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
    <section id="mandates" className="py-20 sm:py-28 bg-white text-surface-900 overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              Designed for modern merchants, <br />
              <span className="text-brand-600">engineered for margins.</span>
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
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-surface-100 text-surface-600 hover:text-surface-900 hover:bg-surface-200'
                )}
              >
                {segment.tabName}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Pane Frame */}
        <div className="bg-[#fafbfc] border border-surface-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-card">
          {/* Left Description (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-brand-600 uppercase">
                    {current.subtitle}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                    {current.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                  {current.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-surface-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/onboarding">
                    <Button className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-full text-xs px-6 h-11 gap-2 shadow-xs cursor-pointer">
                      <span>Get Started with {current.tabName.replace(/^[0-9]+\s*/, '')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Interactive Illustration (6 cols) */}
          <div className="lg:col-span-6 aspect-[4/3] bg-white border border-surface-200 rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
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
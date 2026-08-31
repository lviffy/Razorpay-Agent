'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Zap,
  ShieldCheck,
  Split,
  RotateCcw,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Building2,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureTab {
  id: string
  title: string
  shortTitle: string
  icon: React.ElementType
  badge: string
  badgeColor: string
  tagline: string
  description: string
}

const TABS: FeatureTab[] = [
  {
    id: 'autopay',
    title: 'UPI AutoPay & e-Mandates',
    shortTitle: 'AutoPay & Mandates',
    icon: Zap,
    badge: 'Zero-Touch Debit',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    tagline: 'True Autonomous Purchases up to ₹15,000 Without OTP Popups',
    description:
      'Users delegate pre-authorized spending tokens to their Buyer Agent. Transactions under the RBI ₹15,000 limit execute autonomously via server-initiated debits with zero checkout friction.',
  },
  {
    id: 'offers',
    title: 'Dynamic Offers Engine',
    shortTitle: 'Offers Engine',
    icon: Tag,
    badge: 'A2A Bargaining',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    tagline: 'Live Bank & UPI Discounts Injected into Real-Time Negotiations',
    description:
      'During machine-to-machine bargaining, the Seller Agent queries Razorpay Offers API and injects instant bank cashbacks and card discounts into the counter-offer to win deals.',
  },
  {
    id: 'route',
    title: 'Razorpay Route (Split Payments)',
    shortTitle: 'Route Split',
    icon: Split,
    badge: 'Multi-Merchant Bundling',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    tagline: 'Automated Multi-Vendor Baskets & Platform Take-Rate Splits',
    description:
      'Buy a multi-item bundle (Shoes + Socks + Delivery) across different sellers in a single checkout. Razorpay Route automatically splits the payout and transfers net funds to linked merchant accounts.',
  },
  {
    id: 'refunds',
    title: 'Instant Programmatic Refunds',
    shortTitle: 'Instant Refunds',
    icon: RotateCcw,
    badge: 'Sub-Second Recovery',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    tagline: 'Algorithmic Instant Restitution for Inventory or Fulfillment Mismatches',
    description:
      'If an automated inventory check or shipping constraint fails post-payment, the system triggers an instant API refund to restore the buyer’s spending mandate in seconds.',
  },
  {
    id: 'disputes',
    title: 'SHA-256 Dispute Evidence Chaining',
    shortTitle: 'Dispute Evidence',
    icon: ShieldCheck,
    badge: 'Tamper-Evident Proof',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    tagline: 'Cryptographic Non-Repudiation for Chargeback Defense',
    description:
      'Every agent negotiation, mandate verification, and settlement forms a SHA-256 hash chain. In case of disputes, the unalterable audit ledger is packaged and submitted directly as evidence.',
  },
]

export default function RazorpayServicesSection() {
  const [activeTabId, setActiveTabId] = useState<string>('autopay')

  // AutoPay Interactive State
  const [autoPayAmount, setAutoPayAmount] = useState<number>(3799)
  const isWithinRbiLimit = autoPayAmount <= 15000

  // Offers Interactive State
  const [selectedOffer, setSelectedOffer] = useState<string>('hdfc')

  // Route Interactive State
  const [commissionRate, setCommissionRate] = useState<number>(2)
  const item1Price = 3499
  const item2Price = 499
  const totalBasket = item1Price + item2Price
  const facilitatorFee = Math.round((totalBasket * commissionRate) / 100)
  const merchant1Net = item1Price - Math.round((item1Price * commissionRate) / 100)
  const merchant2Net = item2Price - Math.round((item2Price * commissionRate) / 100)

  // Refunds Interactive State
  const [refundStatus, setRefundStatus] = useState<string>('idle')
  const [refundReason, setRefundReason] = useState<string>('inventory_unavailable')

  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0]

  return (
    <section
      id="razorpay-services"
      className="py-20 sm:py-28 bg-[#fbfbfd] text-surface-900 border-b border-black/[0.06] relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12"
      >
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Razorpay Deep Services Suite
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
            Enterprise Razorpay Capabilities <br className="hidden sm:inline" />
            <span className="text-brand-600">Engineered for Autonomous Commerce.</span>
          </h2>
          <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal [text-wrap:pretty]">
            Beyond standard payment links: Explore how UPI AutoPay, dynamic offers, multi-seller route splitting,
            and cryptographic dispute chaining unlock end-to-end machine settlement.
          </p>
        </div>

        {/* 5-Tab Navigation Pills */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 shrink-0 cursor-pointer border',
                  isActive
                    ? 'bg-surface-900 text-white border-surface-900'
                    : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300 hover:text-surface-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-brand-400' : 'text-surface-500')} />
                <span>{tab.shortTitle}</span>
              </button>
            )
          })}
        </div>

        {/* Active Tab Main Card Container */}
        <div className="rounded-3xl bg-white border border-surface-200 p-6 sm:p-8 lg:p-10 space-y-8 animate-subtle-fade-in" key={activeTabId}>
          {/* Top Banner inside Tab */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-100">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border', activeTab.badgeColor)}>
                  {activeTab.badge}
                </span>
                <span className="text-xs text-surface-400 font-mono">API v1 / Live Service</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-surface-900 font-display">
                {activeTab.tagline}
              </h3>
              <p className="text-xs sm:text-sm text-surface-600 leading-relaxed">
                {activeTab.description}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-xs text-surface-600 bg-surface-50 px-3.5 py-2 rounded-xl border border-surface-200">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified</span>
            </div>
          </div>

          {/* Tab 1: UPI AutoPay Interactive Playground */}
          {activeTabId === 'autopay' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-surface-700">
                    <span>Autonomous Purchase Amount</span>
                    <span className="text-sm font-bold text-brand-600 font-mono">₹{autoPayAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="500"
                    value={autoPayAmount}
                    onChange={(e) => setAutoPayAmount(Number(e.target.value))}
                    className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[11px] text-surface-400 font-mono">
                    <span>₹500</span>
                    <span className="text-amber-600 font-semibold">₹15,000 (RBI Threshold)</span>
                    <span>₹25,000</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className={cn(
                      'p-4 rounded-2xl border transition-colors duration-150 flex items-start gap-3',
                      isWithinRbiLimit
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    )}
                  >
                    {isWithinRbiLimit ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {isWithinRbiLimit ? '1. Zero-Touch Autonomous Rail' : '2. Human 1-Tap Approval Fallback'}
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        {isWithinRbiLimit
                          ? `₹${autoPayAmount} is within the sub-₹15k RBI exemption. The buyer agent debits the pre-approved UPI AutoPay token instantly with no OTP or popup.`
                          : `₹${autoPayAmount} exceeds the ₹15,000 contactless limit. ZapAI automatically dispatches a 1-tap WhatsApp Payment Link for user authorization.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-50 text-surface-900 p-5 rounded-2xl font-mono text-xs space-y-3 border border-black/[0.08]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] text-surface-500 text-[11px]">
                  <span>AUTOPAY TOKENIZED CHARGE PAYLOAD</span>
                  <span className={isWithinRbiLimit ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {isWithinRbiLimit ? 'STATUS: CAPTURED' : 'STATUS: PENDING_APPROVAL'}
                  </span>
                </div>
                <pre className="text-[11px] text-surface-800 leading-relaxed overflow-x-auto font-mono">
{`POST /v1/payments/createRecurringPayment
{
  "customerId": "cust_agent_buyer_01",
  "tokenId": "token_autopay_99812",
  "amount": ${autoPayAmount * 100}, // in paise
  "currency": "INR",
  "recurring": "1",
  "rbiExemption": ${isWithinRbiLimit},
  "executionMode": "${isWithinRbiLimit ? 'AUTONOMOUS_ZERO_TOUCH' : 'HUMAN_LINK_FALLBACK'}"
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 2: Dynamic Offers Interactive Playground */}
          {activeTabId === 'offers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="text-xs font-semibold text-surface-700">Select Active Razorpay Campaign to Test:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'hdfc', name: 'HDFC Bank', disc: '10% Instant Off', savings: 400 },
                    { id: 'upi', name: 'UPI AutoPay', disc: '₹200 Flat Cashback', savings: 200 },
                    { id: 'icici', name: 'ICICI Smart', disc: '5% Off Up to ₹300', savings: 200 },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOffer(o.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-colors duration-150 cursor-pointer space-y-1',
                        selectedOffer === o.id
                          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/20'
                          : 'bg-surface-50 border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <div className="text-xs font-bold text-surface-900">{o.name}</div>
                      <div className="text-[11px] text-blue-600 font-semibold">{o.disc}</div>
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-600">Listed Product Price:</span>
                    <span className="font-bold text-surface-900 font-mono">₹4,000.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Razorpay Live Offer Benefit:</span>
                    <span className="font-bold font-mono">
                      -{selectedOffer === 'hdfc' ? '₹400.00' : '₹200.00'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-surface-200 flex justify-between text-xs font-bold">
                    <span>Effective Autonomous Counter-Price:</span>
                    <span className="text-brand-600 font-mono text-sm">
                      {selectedOffer === 'hdfc' ? '₹3,600.00' : '₹3,800.00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-50 text-surface-900 p-5 rounded-2xl font-mono text-xs space-y-3 border border-black/[0.08]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] text-surface-500 text-[11px]">
                  <span>A2A COUNTER-OFFER WITH RAZORPAY OFFERS</span>
                  <span className="text-blue-700 font-bold">OFFER INJECTED</span>
                </div>
                <pre className="text-[11px] text-surface-800 leading-relaxed overflow-x-auto font-mono">
{`{
  "type": "COUNTER_OFFER",
  "price": ${selectedOffer === 'hdfc' ? 360000 : 380000},
  "razorpayOffer": {
    "offerId": "offer_${selectedOffer}_deal",
    "savingsPaise": ${selectedOffer === 'hdfc' ? 40000 : 20000},
    "summary": "${selectedOffer === 'hdfc' ? 'HDFC 10% Instant Off' : 'UPI AutoPay ₹200 Benefit'}"
  },
  "reasoning": "Countering with live bank discount to bridge budget."
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Razorpay Route Interactive Playground */}
          {activeTabId === 'route' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-surface-700">
                    <span>Platform Facilitator Commission</span>
                    <span className="font-bold text-purple-600 font-mono">{commissionRate}% (₹{facilitatorFee})</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-surface-900">Merchant A: Running Shoes</div>
                      <div className="text-[11px] text-surface-500 font-mono">Linked Acct: acc_runfast_01</div>
                    </div>
                    <div className="font-bold text-surface-900 font-mono text-right">
                      <div>₹{merchant1Net.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-surface-400 font-normal">Gross: ₹{item1Price}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-surface-900">Merchant B: Pro Performance Socks</div>
                      <div className="text-[11px] text-surface-500 font-mono">Linked Acct: acc_speedgear_02</div>
                    </div>
                    <div className="font-bold text-surface-900 font-mono text-right">
                      <div>₹{merchant2Net.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-surface-400 font-normal">Gross: ₹{item2Price}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-50 text-surface-900 p-5 rounded-2xl font-mono text-xs space-y-3 border border-black/[0.08]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] text-surface-500 text-[11px]">
                  <span>RAZORPAY ROUTE SPLIT ORDER</span>
                  <span className="text-purple-700 font-bold">TOTAL: ₹{totalBasket}</span>
                </div>
                <pre className="text-[11px] text-surface-800 leading-relaxed overflow-x-auto font-mono">
{`POST /v1/orders
{
  "amount": ${totalBasket * 100},
  "currency": "INR",
  "transfers": [
    { "account": "acc_runfast_01", "amount": ${merchant1Net * 100} },
    { "account": "acc_speedgear_02", "amount": ${merchant2Net * 100} }
  ],
  "notes": { "platformTakeRate": "${commissionRate}%" }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 4: Instant Refunds Interactive Playground */}
          {activeTabId === 'refunds' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-surface-700">Select Automated Anomaly Reason:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'inventory_unavailable', label: 'Inventory Depleted' },
                      { id: 'merchant_unresponsive', label: 'Merchant Unresponsive' },
                      { id: 'mandate_revoked', label: 'Mandate Revoked' },
                      { id: 'price_mismatch', label: 'Price Mismatch' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRefundReason(r.id)
                          setRefundStatus('idle')
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border text-xs font-medium text-left transition-colors duration-150 cursor-pointer',
                          refundReason === r.id
                            ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                            : 'bg-surface-50 border-surface-200 text-surface-600 hover:border-surface-300'
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setRefundStatus('processing')
                      setTimeout(() => setRefundStatus('processed'), 600)
                    }}
                    disabled={refundStatus === 'processing'}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
                  >
                    <RotateCcw className={cn('w-4 h-4', refundStatus === 'processing' && 'animate-spin')} />
                    <span>{refundStatus === 'processed' ? 'Refund Processed (₹3,799)' : 'Simulate Instant API Refund'}</span>
                  </button>

                  {refundStatus === 'processed' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-subtle-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Speed: <strong>Instant (Optimum Rail)</strong>. Mandate balance restored in 420ms.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-50 text-surface-900 p-5 rounded-2xl font-mono text-xs space-y-3 border border-black/[0.08]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] text-surface-500 text-[11px]">
                  <span>INSTANT REFUND DISPATCH</span>
                  <span className="text-amber-700 font-bold">SPEED: OPTIMUM</span>
                </div>
                <pre className="text-[11px] text-surface-800 leading-relaxed overflow-x-auto font-mono">
{`POST /v1/payments/pay_99812/refund
{
  "amount": 379900,
  "speed": "optimum", // Instant settlement refund
  "notes": {
    "reason": "${refundReason}",
    "source": "zapai_autonomous_agent"
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 5: Dispute Evidence Interactive Playground */}
          {activeTabId === 'disputes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-indigo-700" /> Cryptographic Dispute Bundle
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold">
                      SHA-256 Valid
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-indigo-900">
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Audit Chain Length:</span>
                      <span className="font-mono font-bold">4 Nodes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Genesis Previous Hash:</span>
                      <span className="font-mono font-bold">0000000000...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Delegated Mandate ID:</span>
                      <span className="font-mono font-bold">mnd_8821 (Signed)</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-surface-600 leading-relaxed">
                  When a customer or bank raises an inquiry, ZapAI instantly compiles the immutable SHA-256 node sequence
                  and submits it directly to Razorpay&apos;s Dispute Evidence API without manual staff intervention.
                </div>
              </div>

              <div className="lg:col-span-6 bg-surface-50 text-surface-900 p-5 rounded-2xl font-mono text-xs space-y-3 border border-black/[0.08]">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] text-surface-500 text-[11px]">
                  <span>RAZORPAY DISPUTE EVIDENCE ATTACHMENT</span>
                  <span className="text-indigo-700 font-bold">HMAC VERIFIED</span>
                </div>
                <pre className="text-[11px] text-surface-800 leading-relaxed overflow-x-auto font-mono">
{`PATCH /v1/disputes/disp_99182/evidence
{
  "proofDigest": "a38f71c900e2b...",
  "chainNodes": 4,
  "mandateSignature": "0x7a8f...",
  "timeline": [
    "A2A_OFFER_ACCEPTED (₹3,799)",
    "MANDATE_VERIFIED (mnd_8821)",
    "PAYMENT_SETTLED (Razorpay UPI)"
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 5 Bottom Mini Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-surface-200 text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700">≤ ₹15,000</div>
            <div className="text-[11px] text-surface-600 font-medium">No-OTP AutoPay Cap</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-surface-200 text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-700">15+ Offers</div>
            <div className="text-[11px] text-surface-600 font-medium">Dynamic Bank Rewards</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-surface-200 text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-purple-700">Multi-Vendor</div>
            <div className="text-[11px] text-surface-600 font-medium">Razorpay Route Splits</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-surface-200 text-center space-y-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-700">&lt; 2s Refund</div>
            <div className="text-[11px] text-surface-600 font-medium">Optimum Rail Velocity</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-surface-200 text-center space-y-1 col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl font-bold font-mono text-indigo-700">SHA-256</div>
            <div className="text-[11px] text-surface-600 font-medium">Dispute Ledger Proof</div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Layers,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Sliders,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ServicesSection() {
  const [demoDiscount, setDemoDiscount] = useState<number>(10)
  const basePrice = 3999
  const floorPrice = 3400
  const negotiatedPrice = Math.max(floorPrice, Math.round(basePrice * (1 - demoDiscount / 100)))
  const marginProtected = negotiatedPrice >= floorPrice

  return (
    <section
      id="features"
      className="relative w-full bg-[#fafbfc] text-surface-900 py-20 sm:py-28 border-t border-surface-200 overflow-hidden"
    >
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12] [text-wrap:balance]">
              The AgentBridge Commerce Infrastructure
            </h2>
          </div>

          <p className="text-sm sm:text-base text-surface-600 max-w-md leading-relaxed font-normal">
            A unified stack connecting WhatsApp conversations, autonomous margin guardrails, live inventory locks, and instant Razorpay UPI settlements.
          </p>
        </div>

        {/* 4-Cell Interactive Bento Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Card 1: Autonomous Negotiation Layer (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7 bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:border-brand-300 transition-all duration-300 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-100 border border-surface-200 text-[10px] font-mono font-bold text-surface-600 uppercase">
                  ACTIVE REASONING ENGINE
                </span>
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-surface-900 tracking-tight">
                  Autonomous Negotiation Layer
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed mt-1">
                  Processes natural language buyer bargaining in WhatsApp with deterministic mathematical price floors.
                </p>
              </div>
            </div>

            {/* Interactive Live Floor Simulator Widget */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-surface-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-surface-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-brand-500" /> Buyer Discount Request
                </span>
                <span className="font-mono font-extrabold text-brand-600 text-sm">
                  {demoDiscount}% Discount
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={demoDiscount}
                onChange={(e) => setDemoDiscount(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white border border-surface-200">
                  <span className="text-[9.5px] font-mono text-surface-500 block uppercase">List Price</span>
                  <span className="font-mono text-xs font-bold text-surface-900">₹{basePrice}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-surface-200">
                  <span className="text-[9.5px] font-mono text-surface-500 block uppercase">Floor Price</span>
                  <span className="font-mono text-xs font-bold text-amber-700">₹{floorPrice}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-brand-200">
                  <span className="text-[9.5px] font-mono text-brand-600 block uppercase">AI Counter</span>
                  <span className="font-mono text-xs font-bold text-brand-600">₹{negotiatedPrice}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Unified Catalog Spine (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-5 bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:border-brand-300 transition-all duration-300 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  1-CLICK SHOPIFY SYNC
                </span>
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-surface-900 tracking-tight">
                  Unified Catalog Spine
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed mt-1">
                  Manage native inventory or sync Shopify variants with real-time stock levels.
                </p>
              </div>
            </div>

            {/* Live Catalog Preview */}
            <div className="space-y-2 p-3 bg-[#f8fafc] border border-surface-200 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-surface-200">
                <span className="font-bold text-surface-800">NK-PEGASUS-40</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 18 Units
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono py-1">
                <span className="font-bold text-surface-800">GARMIN-FR-265</span>
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 2 Units (Locked)
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Conversational Checkout Rails (5 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="lg:col-span-5 bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:border-brand-300 transition-all duration-300 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-mono font-bold text-brand-700 uppercase">
                  RAZORPAY 1-TAP UPI
                </span>
              </div>

              <div>
                <h3 className="font-display text-xl font-bold text-surface-900 tracking-tight">
                  Instant Checkout Rails
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed mt-1">
                  Creates authenticated Razorpay Payment Links straight in WhatsApp chat for 1-tap checkout.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0c2340] text-white rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span>PAYMENT LINK GENERATED</span>
                <span className="text-emerald-400">rzp.io/i/plink_8921</span>
              </div>
              <p className="font-mono text-xs text-blue-200 font-bold">
                UPI / Cards / Netbanking • Auto-Fulfill
              </p>
            </div>
          </motion.div>

          {/* Card 4: Merchant Protection & Telemetry (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="lg:col-span-7 bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:border-brand-300 transition-all duration-300 space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  HMAC SHA-256 AUDIT
                </span>
              </div>

              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-surface-900 tracking-tight">
                  Merchant Protection &amp; Telemetry
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed mt-1">
                  Zero client secret exposure, 15-minute temporary inventory holds, and immutable cryptographic audit trails.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[#f8fafc] border border-surface-200 rounded-2xl">
                <span className="font-display text-lg font-bold text-surface-900 block">15 Min</span>
                <span className="text-[10px] font-mono text-surface-500 uppercase">Stock Lock Hold</span>
              </div>
              <div className="p-3 bg-[#f8fafc] border border-surface-200 rounded-2xl">
                <span className="font-display text-lg font-bold text-emerald-600 block">100%</span>
                <span className="text-[10px] font-mono text-surface-500 uppercase">Secret Isolation</span>
              </div>
              <div className="p-3 bg-[#f8fafc] border border-surface-200 rounded-2xl">
                <span className="font-display text-lg font-bold text-brand-600 block">&lt; 10ms</span>
                <span className="text-[10px] font-mono text-surface-500 uppercase">Webhook Verification</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


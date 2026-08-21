'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle2, Bot, ShieldCheck, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribed(true)
    setTimeout(() => {
      setEmail('')
      setSubscribed(false)
    }, 4000)
  }

  return (
    <section
      id="cta"
      className="relative py-20 sm:py-28 px-4 sm:px-6 bg-[#fafbfc] text-surface-900 overflow-hidden flex flex-col items-center border-t border-surface-200"
    >
      <div className="mx-auto max-w-[1240px] w-full relative z-10 px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
        {/* Main CTA Top Banner */}
        <div className="text-center flex flex-col items-center space-y-6">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-surface-900 leading-[1.1] [text-wrap:balance] max-w-3xl">
            Activate autonomous WhatsApp selling for{' '}
            <span className="text-brand-600">your store.</span>
          </h2>

          <p className="text-sm sm:text-base text-surface-600 max-w-xl leading-relaxed">
            Launch your AI seller agent, define your margin floor mandates, and start collecting
            instant UPI payments on WhatsApp with Razorpay rails.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
            <Link href="/onboarding">
              <Button className="group bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-full px-8 h-12 text-sm gap-2 shadow-xs hover:shadow-glow-blue transition-all duration-200 cursor-pointer">
                <span>Start Conversational Onboarding</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="rounded-full text-sm font-bold px-7 h-12 border-surface-200 bg-white text-surface-800 hover:bg-surface-50 hover:border-surface-300 shadow-2xs transition-all cursor-pointer"
              >
                Open Merchant Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-surface-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant Razorpay Test Mode
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official WhatsApp Cloud API
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Shopify Sync Optional
            </span>
          </div>
        </div>

        {/* Subscribe / Developer Updates Card */}
        <div className="bg-white border border-surface-200 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 shadow-card">
          <div className="flex-1 text-center md:text-left space-y-1.5">
            <h3 className="font-display text-lg sm:text-xl font-bold text-surface-900">
              AgentBridge Merchant &amp; Developer Updates
            </h3>
            <p className="text-xs sm:text-sm text-surface-600 max-w-md mx-auto md:mx-0 leading-relaxed">
              Get notified of new Razorpay settlement features, WhatsApp Cloud API updates, and AI
              seller conversion benchmarks.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-md">
            <form className="relative flex items-center w-full" onSubmit={handleSubscribe}>
              <div className="absolute left-4 z-10 text-surface-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@yourbrand.com"
                autoComplete="email"
                required
                className="w-full bg-[#fafbfc] border border-surface-200 text-surface-900 placeholder:text-surface-400 text-xs sm:text-sm rounded-full py-3.5 pl-11 pr-28 focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-full hover:bg-brand-600 transition-colors cursor-pointer"
              >
                {subscribed ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Subscribed
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}


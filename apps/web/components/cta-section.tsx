'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Bot,
  ShieldCheck,
  Sparkles,
  Check,
  Zap,
  Lock,
} from 'lucide-react'
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
      className="relative py-24 sm:py-32 px-4 sm:px-6 bg-[#080c16] text-white overflow-hidden flex flex-col items-center border-t border-white/10"
    >
      {/* Ambient Radial Lights in Dark CTA */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(0,82,255,0.2)_0%,rgba(25,90,220,0.08)_40%,transparent_70%)] blur-3xl -z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 w-[500px] h-[400px] bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_70%)] blur-2xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-[1240px] w-full relative z-10 px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
        {/* Main CTA Top Banner */}
        <div className="text-center flex flex-col items-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-xs font-mono font-bold text-brand-300 uppercase">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span>Ready for Production Deployment</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] [text-wrap:balance] max-w-3xl">
            Activate autonomous WhatsApp selling for{' '}
            <span className="text-brand-400">
              your store today.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed font-normal">
            Launch your AI seller agent, define your margin floor mandates, and start collecting
            instant UPI payments directly on WhatsApp with Razorpay settlement rails.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link href="/onboarding">
              <Button className="group apple-button-primary font-bold rounded-full px-8 h-12 text-sm gap-2 cursor-pointer">
                <span>Start Conversational Onboarding</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full text-sm font-bold px-7 h-12 cursor-pointer backdrop-blur-md"
              >
                Open Merchant Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Razorpay Test Mode
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Official WhatsApp Cloud API
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Shopify Sync Ready
            </span>
          </div>
        </div>

        {/* Subscribe / Developer Updates Card */}
        <div className="apple-card-dark rounded-[2.5rem] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 border border-white/10">
          <div className="flex-1 text-center md:text-left space-y-1.5">
            <h3 className="font-display text-lg sm:text-xl font-bold text-white">
              AgentBridge Merchant &amp; Developer Updates
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto md:mx-0 leading-relaxed font-sans">
              Get notified of new Razorpay settlement features, WhatsApp Cloud API updates, and AI
              seller conversion benchmarks.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-md">
            <form className="relative flex items-center w-full" onSubmit={handleSubscribe}>
              <div className="absolute left-4 z-10 text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@yourbrand.com"
                autoComplete="email"
                required
                className="w-full bg-white/5 border border-white/15 text-white placeholder:text-gray-400 text-xs sm:text-sm rounded-full py-3.5 pl-11 pr-28 focus:outline-none focus:border-brand-400 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 apple-button-primary text-xs font-bold rounded-full cursor-pointer"
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

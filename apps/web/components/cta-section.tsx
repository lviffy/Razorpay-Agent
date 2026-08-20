'use client'
import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowRight, CheckCircle2, Bot, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative py-20 sm:py-28 px-4 sm:px-6 bg-white text-[#09090b] overflow-hidden flex flex-col items-center border-t border-[#e4e4e7]"
    >
      <div className="mx-auto max-w-[1300px] w-full relative z-10 px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
        {/* CTA Top Half */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center space-y-6"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#09090b] leading-[1.1] [text-wrap:balance] max-w-3xl">
            Activate autonomous WhatsApp selling for <span className="text-[#195adc]">your store.</span>
          </h2>

          <p className="text-sm sm:text-base text-[#52525b] max-w-xl leading-relaxed">
            Launch your AI seller agent, set your margin floor mandates, and start collecting
            instant UPI payments on WhatsApp with Razorpay rails.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href="/onboarding">
              <Button className="bg-[#195adc] text-white hover:bg-[#378ffa] font-bold rounded-full px-8 h-12 text-xs sm:text-sm gap-2 shadow-xs">
                <span>Start Conversational Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="rounded-full text-xs sm:text-sm font-bold px-7 h-12 border-[#e4e4e7] bg-white hover:bg-[#f8fafc]"
              >
                Open Merchant Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#52525b]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant Razorpay Test Mode
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Shopify Optional
            </span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-[#e4e4e7]" />

        {/* Subscribe / Updates Bottom Half */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#f8fafc] border border-[#e4e4e7] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 shadow-xs"
        >
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#09090b]">
              AgentBridge Developer &amp; Merchant Updates
            </h3>
            <p className="text-xs sm:text-sm text-[#52525b] max-w-md mx-auto md:mx-0 leading-relaxed">
              Get notified of new Razorpay settlement features, WhatsApp Cloud API updates, and AI
              seller benchmarks.
            </p>
          </div>

          <div className="w-full md:w-auto flex-1 max-w-md">
            <form className="relative flex items-center w-full" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute left-4 z-10 text-[#52525b]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="merchant@yourbrand.com"
                autoComplete="email"
                required
                className="w-full bg-white border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa] text-xs sm:text-sm rounded-full py-3.5 pl-11 pr-28 focus:outline-none focus:border-[#195adc] transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-[#195adc] text-white text-xs font-bold rounded-full hover:bg-[#378ffa] transition-colors cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

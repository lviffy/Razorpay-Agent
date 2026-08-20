'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export default function PrecisionQuoteSection() {
  return (
    <section id="precision-quote" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-[#e4e4e7]">
      <div className="max-w-[1300px] mx-auto flex flex-row md:grid md:grid-cols-[auto_minmax(0,1fr)] gap-6 sm:gap-10 items-center">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-[#195adc] text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        <blockquote className="w-full md:max-w-3xl pl-5 sm:pl-7 relative">
          <motion.span
            className="absolute left-0 top-0 w-[3px] bg-[#195adc]"
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: '100%', opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />

          <p className="text-left text-base xs:text-lg sm:text-xl md:text-2xl font-semibold text-[#09090b] tracking-tight leading-tight">
            <span className="block overflow-hidden">
              <motion.span
                initial={{ x: -180, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
                className="block md:whitespace-nowrap"
              >
                &ldquo;Shoppers naturally negotiate and ask questions in WhatsApp chat.
              </motion.span>
            </span>

            <span className="block mt-1.5 overflow-hidden">
              <motion.span
                initial={{ x: -180, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
                className="block md:whitespace-nowrap text-[#195adc]"
              >
                Your profit margins remain mathematically protected.&rdquo;
              </motion.span>
            </span>
          </p>
        </blockquote>
      </div>
    </section>
  )
}

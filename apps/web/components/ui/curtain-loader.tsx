'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'

interface CurtainLoaderProps {
  onComplete?: () => void
}

export function CurtainLoader({ onComplete }: CurtainLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem('eon-loader-seen')
    if (hasSeenLoader) {
      setIsDone(true)
      setIsInitializing(false)
      if (onComplete) onComplete()
      return
    }

    setIsInitializing(false)

    // Lock scroll
    document.documentElement.style.position = 'relative'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'

    // Simulate progress with smooth organic pacing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          sessionStorage.setItem('eon-loader-seen', 'true')
          setTimeout(() => {
            setIsDone(true)
            // Unlock scroll
            document.documentElement.style.removeProperty('position')
            document.documentElement.style.removeProperty('overflow')
            document.documentElement.style.removeProperty('height')
            if (onComplete) onComplete()
          }, 450)
          return 100
        }
        // Organic progress increments
        const increment = prev < 70 ? Math.floor(Math.random() * 10) + 6 : Math.floor(Math.random() * 14) + 8
        const next = prev + increment
        return next > 100 ? 100 : next
      })
    }, 75)

    return () => {
      clearInterval(interval)
      document.documentElement.style.removeProperty('position')
      document.documentElement.style.removeProperty('overflow')
      document.documentElement.style.removeProperty('height')
    }
  }, [onComplete])

  if (isInitializing) return null

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ 
            y: '-100%',
            transition: { duration: 0.8, ease: [0.65, 0, 0.35, 1] } // easeInOutCubic
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white border-b border-neutral-200/80 shadow-2xl overflow-hidden"
        >
          {/* Architectural square grid background with radial vignette */}
          <div 
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, #f1f1f4 1px, transparent 1px), linear-gradient(to bottom, #f1f1f4 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)',
            }}
          />

          {/* Ambient soft glow behind center */}
          <div 
            aria-hidden="true"
            className="absolute w-80 h-80 rounded-full bg-[#195ADC]/5 blur-3xl pointer-events-none -translate-y-4"
          />

          <motion.div 
            className="relative z-10 flex flex-col items-center gap-7"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo in natural light theme */}
            <Logo className="scale-125" />

            {/* Minimalist Progress Track & Counter */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-48 sm:w-56 h-[3px] bg-neutral-100 rounded-full overflow-hidden relative border border-neutral-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#195ADC] to-[#38BDF8] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                />
              </div>

              <span className="font-mono text-[11px] font-medium text-neutral-400 tabular-nums tracking-widest select-none">
                {progress}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

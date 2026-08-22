'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  uniColor?: boolean
}

export function Logo({
  className,
  size = 'md',
  showText = true,
  uniColor = false,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base font-bold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
  }

  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2.5 group select-none', className)}
    >
      <div
        className={cn(
          'rounded-xl bg-[#195adc] text-white flex items-center justify-center font-black group-hover:bg-[#378ffa] transition-colors',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            uniColor ? 'text-white font-bold' : 'text-[#09090b] font-bold',
            'tracking-tight',
            textSizes[size]
          )}
        >
          Zap<span className="text-[#195adc]">AI</span>
        </span>
      )}
    </Link>
  )
}

export default Logo
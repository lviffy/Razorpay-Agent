'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showText?: boolean
  uniColor?: boolean
  href?: string
}

export function Logo({
  className,
  size = 'md',
  showText = true,
  uniColor = false,
  href = '/',
}: LogoProps) {
  const iconDimensions = {
    xs: { px: 20, class: 'w-5 h-5 rounded-md' },
    sm: { px: 28, class: 'w-7 h-7 rounded-lg' },
    md: { px: 36, class: 'w-9 h-9 rounded-xl' },
    lg: { px: 44, class: 'w-11 h-11 rounded-2xl' },
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base font-bold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
  }

  const content = (
    <>
      <div
        className={cn(
          'relative overflow-hidden flex-shrink-0 shadow-xs ring-1 ring-black/[0.08] transition-transform duration-200 group-hover:scale-105 bg-[#195adc]',
          iconDimensions[size].class
        )}
      >
        <Image
          src="/ZAPAI.png"
          alt="ZapAI Logo"
          width={iconDimensions[size].px}
          height={iconDimensions[size].px}
          className="w-full h-full object-cover"
          priority
        />
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
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn('inline-flex items-center gap-2.5 group select-none', className)}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      {content}
    </div>
  )
}

export default Logo
'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WordRevealProps extends Omit<HTMLMotionProps<'h2'>, 'children'> {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  stagger?: number
  duration?: number
  delay?: number
}

export function WordReveal({
  text,
  className,
  as: Component = 'h2',
  stagger = 0.08,
  duration = 0.8,
  delay = 0,
  ...props
}: WordRevealProps) {
  const words = text.split(/\s+/)

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  const childVariants = {
    hidden: {
      y: '115%',
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: duration,
        ease: [0.16, 1, 0.3, 1] as const, // easeOutExpo
      },
    },
  }

  const Tag = motion[Component] || motion.h2

  return (
    <Tag
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -10% 0px' }}
      className={cn('inline-block overflow-visible', className)}
      aria-label={text}
      {...(props as any)}
    >
      {words.map((word, idx) => (
        <React.Fragment key={`${word}-${idx}`}>
          <span
            className="inline-block overflow-hidden relative pb-[0.14em] -mb-[0.14em]"
            aria-hidden="true"
          >
            <motion.span
              variants={childVariants}
              className="inline-block origin-bottom transform-gpu"
            >
              {word}
            </motion.span>
          </span>
          {idx < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </Tag>
  )
}

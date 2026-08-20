'use client'
import { useScroll, useTransform, MotionValue } from 'framer-motion'
import { RefObject } from 'react'

interface UseParallaxOptions {
  speed?: number
  direction?: 'up' | 'down'
}

export function useParallax(
  ref: RefObject<HTMLElement>,
  options: UseParallaxOptions = {}
) {
  const { speed = 0.5, direction = 'up' } = options
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [100 * speed, -100 * speed] : [-100 * speed, 100 * speed]
  )

  return { y, scrollYProgress }
}

export function useScrollProgress() {
  const { scrollYProgress } = useScroll()
  return scrollYProgress
}

export function useParallaxValue(
  scrollProgress: MotionValue<number>,
  inputRange: number[],
  outputRange: number[]
) {
  return useTransform(scrollProgress, inputRange, outputRange)
}

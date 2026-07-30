import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target: number, duration = 380): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = target
    if (Math.abs(from - target) < 0.005) return

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

    const t0 = performance.now()
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

import { useRef, useState, useEffect } from 'react'

export function useReveal(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref?.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return visible
}

export function useCounter(end, run) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    let cur = 0
    const step = Math.max(1, Math.floor(end / 80))
    const id = setInterval(() => {
      cur = Math.min(cur + step, end)
      setV(cur)
      if (cur >= end) clearInterval(id)
    }, 25)
    return () => clearInterval(id)
  }, [run, end])
  return v
}

export function useCountdown(target) {
  const calc = () => {
    const diff = Math.max(0, new Date(target) - Date.now())
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

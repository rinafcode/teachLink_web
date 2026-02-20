import React, { useRef, useEffect } from "react"
import engine from "./AnimationEngine"

type Props = {
  children: React.ReactNode
  axis?: "x" | "y"
  onDismiss?: () => void
  threshold?: number
  className?: string
}

export default function InteractiveAnimations({ children, axis = "x", onDismiss, threshold = 120, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const ctrlRef = useRef<any>(null)
  const startRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let dragging = false

    function getCoord(e: PointerEvent | MouseEvent) {
      return (e as PointerEvent).clientX ?? (e as MouseEvent).clientX
    }

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      startRef.current = axis === "x" ? e.clientX : e.clientY
      el.setPointerCapture(e.pointerId)
      if (ctrlRef.current) ctrlRef.current.stop()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const cur = axis === "x" ? e.clientX : e.clientY
      const delta = cur - startRef.current
      // apply transform directly for immediate response
      const transform = axis === "x" ? `translate3d(${delta}px,0,0)` : `translate3d(0,${delta}px,0)`
      el.style.transform = transform
      el.style.willChange = "transform"
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      const cur = axis === "x" ? e.clientX : e.clientY
      const delta = cur - startRef.current
      const abs = Math.abs(delta)
      if (abs > threshold && onDismiss) {
        // fling away
        const dir = delta > 0 ? 1 : -1
        ctrlRef.current = engine.spring(delta, dir * (window.innerWidth || 1200), (v) => {
          el.style.transform = axis === "x" ? `translate3d(${v}px,0,0)` : `translate3d(0,${v}px,0)`
        })
        ctrlRef.current.onStop = () => onDismiss()
      } else {
        // spring back to 0
        ctrlRef.current = engine.spring(delta, 0, (v) => {
          el.style.transform = axis === "x" ? `translate3d(${v}px,0,0)` : `translate3d(0,${v}px,0)`
        })
      }
    }

    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [axis, onDismiss, threshold])

  return (
    <div ref={ref} className={className} style={{ touchAction: "pan-y" }}>
      {children}
    </div>
  )
}

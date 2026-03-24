type SpringConfig = {
  mass?: number
  stiffness?: number
  damping?: number
  restVelocity?: number
  precision?: number
}

export function clamp(v: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v))
}

export function isAtRest(x: number, v: number, config: SpringConfig) {
  const precision = config.precision ?? 0.001
  return Math.abs(v) < (config.restVelocity ?? 0.02) && Math.abs(x) < precision
}

export function stepSpring(
  position: number,
  velocity: number,
  target: number,
  dt: number,
  config: SpringConfig = {}
) {
  const mass = config.mass ?? 1
  const stiffness = config.stiffness ?? 170
  const damping = config.damping ?? 26

  const x = position - target
  const force = -stiffness * x - damping * velocity
  const a = force / mass
  const newV = velocity + a * dt
  const newX = position + newV * dt
  return { position: newX, velocity: newV }
}

// Minimal RAF manager to batch updates
let rafId: number | null = null
const rafQueue: Array<() => void> = []

export function scheduleFrame(cb: () => void) {
  rafQueue.push(cb)
  if (rafId == null) {
    rafId = requestAnimationFrame(() => {
      rafId = null
      const q = rafQueue.splice(0)
      for (const fn of q) fn()
    })
  }
}

export type SpringState = { position: number; velocity: number; target: number }

export type { SpringConfig }

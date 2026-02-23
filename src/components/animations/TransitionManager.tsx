import engine from "./AnimationEngine"
import { scheduleFrame } from "../../utils/animationUtils"

type TransitionItem = {
  id?: string
  run: () => Promise<void>
}

type OrchestrateOptions = {
  parallel?: boolean
}

export async function orchestrateTransitions(items: TransitionItem[], options: OrchestrateOptions = {}) {
  if (options.parallel) {
    await Promise.all(items.map((i) => i.run()))
    return
  }

  for (const item of items) {
    await item.run()
    // small frame gap to allow layout/paint
    await new Promise<void>((r) => scheduleFrame(() => r()))
  }
}

// Small helper to animate style properties via engine
export function animateNumber(
  start: number,
  to: number,
  onUpdate: (v: number) => void,
  config = {}
) {
  return engine.spring(start, to, onUpdate, config)
}

export function stopAllTransitions() {
  engine.stopAll()
}

import { useMemo } from "react"
import engine, { AnimationEngine } from "../components/animations/AnimationEngine"
import { orchestrateTransitions, animateNumber } from "../components/animations/TransitionManager"

export default function useAdvancedAnimations() {
  // expose a stable API
  const api = useMemo(() => {
    return {
      engine,
      orchestrateTransitions,
      animateNumber,
      stopAll: () => engine.stopAll(),
    }
  }, [])
  return api
}

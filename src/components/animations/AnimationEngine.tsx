import { scheduleFrame, stepSpring, SpringConfig, SpringState } from "../../utils/animationUtils"

type OnUpdate = (value: number) => void

export type AnimationController = {
  stop: () => void
  setTarget: (t: number) => void
}

export class AnimationEngine {
  private active: Set<AnimationControllerImpl> = new Set()

  spring(start: number, target: number, onUpdate: OnUpdate, config: SpringConfig = {}) {
    const impl = new AnimationControllerImpl(start, target, onUpdate, config)
    this.active.add(impl)
    impl.onStop = () => this.active.delete(impl)
    impl.start()
    return impl
  }

  stopAll() {
    for (const c of Array.from(this.active)) c.stop()
    this.active.clear()
  }
}

class AnimationControllerImpl implements AnimationController {
  private state: SpringState
  private config: SpringConfig
  private running = false
  private last = performance.now()
  public onStop: (() => void) | null = null

  constructor(start: number, target: number, private onUpdate: OnUpdate, config: SpringConfig = {}) {
    this.state = { position: start, velocity: 0, target }
    this.config = config
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    const loop = () => {
      if (!this.running) return
      const now = performance.now()
      const dt = Math.min(32, now - this.last) / 1000
      this.last = now
      const res = stepSpring(this.state.position, this.state.velocity, this.state.target, dt, this.config)
      this.state.position = res.position
      this.state.velocity = res.velocity
      this.onUpdate(this.state.position)
      const vel = Math.abs(this.state.velocity)
      const dist = Math.abs(this.state.position - this.state.target)
      if (vel < (this.config.restVelocity ?? 0.02) && dist < (this.config.precision ?? 0.001)) {
        this.onUpdate(this.state.target)
        this.stop()
        return
      }
      scheduleFrame(loop)
    }
    scheduleFrame(loop)
  }

  stop() {
    this.running = false
    if (this.onStop) this.onStop()
  }

  setTarget(t: number) {
    this.state.target = t
    if (!this.running) this.start()
  }
}

const singleton = new AnimationEngine()
export default singleton

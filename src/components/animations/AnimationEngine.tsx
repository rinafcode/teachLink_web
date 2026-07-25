import { stepSpring, SpringConfig, SpringState } from '../../utils/animationUtils';

type OnUpdate = (value: number) => void;

export type AnimationController = {
  stop: () => void;
  setTarget: (t: number) => void;
};

export class AnimationEngine {
  private active: Set<AnimationControllerImpl> = new Set();
  private frameId: number | null = null;

  spring(start: number, target: number, onUpdate: OnUpdate, config: SpringConfig = {}) {
    const impl = new AnimationControllerImpl(start, target, onUpdate, config);
    this.active.add(impl);

    impl.onStop = () => {
      this.active.delete(impl);
      if (this.active.size === 0 && this.frameId !== null) {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
      }
    };

    impl.start(this.ensureLoop.bind(this));
    return impl;
  }

  private ensureLoop() {
    if (this.frameId !== null) return;

    const loop = (now: number) => {
      if (this.active.size === 0) {
        this.frameId = null;
        return;
      }

      // Process all calculations and DOM writes
      for (const anim of this.active) {
        anim.step(now);
      }

      this.frameId = requestAnimationFrame(loop);
    };

    this.frameId = requestAnimationFrame(loop);
  }

  stopAll() {
    for (const c of Array.from(this.active)) c.stop();
    this.active.clear();
  }
}

class AnimationControllerImpl implements AnimationController {
  private state: SpringState;
  private config: SpringConfig;
  private running = false;
  private last = performance.now();
  public onStop: (() => void) | null = null;

  constructor(
    start: number,
    target: number,
    private onUpdate: OnUpdate,
    config: SpringConfig = {},
  ) {
    this.state = { position: start, velocity: 0, target };
    this.config = config;
  }

  start(triggerLoop: () => void) {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    triggerLoop();
  }

  step(now: number) {
    if (!this.running) return;

    const dt = Math.min(32, now - this.last) / 1000;
    this.last = now;

    const res = stepSpring(
      this.state.position,
      this.state.velocity,
      this.state.target,
      dt,
      this.config,
    );

    this.state.position = res.position;
    this.state.velocity = res.velocity;

    this.onUpdate(this.state.position);

    const vel = Math.abs(this.state.velocity);
    const dist = Math.abs(this.state.position - this.state.target);

    if (vel < (this.config.restVelocity ?? 0.02) && dist < (this.config.precision ?? 0.001)) {
      this.onUpdate(this.state.target);
      this.stop();
    }
  }

  stop() {
    this.running = false;
    if (this.onStop) this.onStop();
  }

  setTarget(t: number) {
    this.state.target = t;
    if (!this.running) this.start(() => {});
  }
}

const singleton = new AnimationEngine();
export default singleton;

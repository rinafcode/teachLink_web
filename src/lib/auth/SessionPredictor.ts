// src/lib/auth/SessionPredictor.ts

export interface SessionPredictorOptions {
  /** The total length of a session in milliseconds */
  maxSessionLength?: number;
  /** Activity threshold in milliseconds to consider the user idle */
  idleThreshold?: number;
  /** Callback when the model predicts the user is about to abandon the session */
  onPredictiveAbandonment?: () => void;
  /** Callback when the session is predicted to expire soon and should be refreshed */
  onPredictiveRefresh?: () => void;
}

/**
 * Predictive Analytics for Session Management.
 * Analyzes user activity patterns to predict idle times and proactively manage session state.
 */
export class SessionPredictor {
  private activityTimestamps: number[] = [];
  private maxSessionLength: number;
  private idleThreshold: number;
  private isTracking = false;

  private onPredictiveAbandonment?: () => void;
  private onPredictiveRefresh?: () => void;

  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private sessionStartTime: number;

  constructor(options: SessionPredictorOptions = {}) {
    this.maxSessionLength = options.maxSessionLength || 60 * 60 * 1000; // 1 hour
    this.idleThreshold = options.idleThreshold || 15 * 60 * 1000; // 15 minutes
    this.onPredictiveAbandonment = options.onPredictiveAbandonment;
    this.onPredictiveRefresh = options.onPredictiveRefresh;
    this.sessionStartTime = Date.now();
  }

  /**
   * Starts tracking user activity to build predictive models.
   */
  public startTracking(): void {
    if (this.isTracking) return;
    this.isTracking = true;
    this.sessionStartTime = Date.now();

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', this.trackActivity);
      window.addEventListener('keydown', this.trackActivity);
      window.addEventListener('click', this.trackActivity);
      window.addEventListener('scroll', this.trackActivity);
    }

    // Run prediction evaluation every 30 seconds
    this.trackingInterval = setInterval(() => this.evaluatePredictions(), 30000);
  }

  /**
   * Stops tracking and cleans up event listeners.
   */
  public stopTracking(): void {
    this.isTracking = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', this.trackActivity);
      window.removeEventListener('keydown', this.trackActivity);
      window.removeEventListener('click', this.trackActivity);
      window.removeEventListener('scroll', this.trackActivity);
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  /**
   * Log an activity timestamp. Debounced to avoid excessive array growth.
   */
  private trackActivity = (): void => {
    const now = Date.now();
    const lastActivity = this.activityTimestamps[this.activityTimestamps.length - 1];

    // Only record activity if it's been more than 500ms since the last one
    if (!lastActivity || now - lastActivity > 500) {
      this.activityTimestamps.push(now);

      // Keep only the last 1000 timestamps to prevent memory leaks
      if (this.activityTimestamps.length > 1000) {
        this.activityTimestamps.shift();
      }
    }
  };

  /**
   * Evaluates current predictive metrics and triggers callbacks if thresholds are met.
   */
  public evaluatePredictions(): void {
    const now = Date.now();
    const probabilityIdle = this.predictIdleProbability(now);

    if (probabilityIdle > 0.8 && this.onPredictiveAbandonment) {
      this.onPredictiveAbandonment();
    }

    const sessionProgress = (now - this.sessionStartTime) / this.maxSessionLength;
    const shouldRefresh = this.predictSessionRefresh(sessionProgress, probabilityIdle);

    if (shouldRefresh && this.onPredictiveRefresh) {
      this.onPredictiveRefresh();
    }
  }

  /**
   * Predicts the probability (0.0 to 1.0) that the user is currently idle or about to go idle
   * based on the frequency and recency of their activity.
   */
  public predictIdleProbability(currentTime: number = Date.now()): number {
    if (this.activityTimestamps.length === 0) {
      const timeSinceStart = currentTime - this.sessionStartTime;
      return Math.min(timeSinceStart / this.idleThreshold, 1.0);
    }

    const lastActivity = this.activityTimestamps[this.activityTimestamps.length - 1];
    const timeSinceLastActivity = currentTime - lastActivity;

    // Linear increase in probability of being idle
    let probability = timeSinceLastActivity / this.idleThreshold;

    // Analyze pattern: if frequency of events in the last 5 minutes is very low, increase probability
    const fiveMinutesAgo = currentTime - 5 * 60 * 1000;
    const recentActivities = this.activityTimestamps.filter((t) => t > fiveMinutesAgo).length;

    if (recentActivities < 5 && timeSinceLastActivity > 60000) {
      // less than 5 actions in 5 mins, and none in 1 min
      probability += 0.2;
    }

    return Math.max(0, Math.min(probability, 1.0));
  }

  /**
   * Predicts whether the session should be proactively refreshed.
   * Based on session progress and user engagement (inverse of idle probability).
   */
  public predictSessionRefresh(sessionProgress: number, idleProbability: number): boolean {
    // If the session is more than 75% complete and the user is highly engaged (< 30% idle probability),
    // predict that they will need a session refresh soon to avoid disruption.
    if (sessionProgress > 0.75 && idleProbability < 0.3) {
      return true;
    }
    return false;
  }

  /**
   * Reset session tracking manually (e.g. after a refresh)
   */
  public resetSession(): void {
    this.sessionStartTime = Date.now();
    this.activityTimestamps = [];
  }
}

import { Metric } from './provider';

export type AlertSeverity = 'low' | 'high' | 'critical';

export type Alert = {
  message: string;
  severity: AlertSeverity;
  /** Metric that produced the alert. */
  metric?: string;
  /** Observed value that breached the threshold. */
  value?: number;
  /** Value the observation was compared against (absolute threshold or spike ceiling). */
  threshold?: number;
};

/**
 * Thresholds for a single error-rate metric. Rates are percentages (0-100) so
 * `warning: 3` means "3% of requests failed".
 */
export interface ErrorRateThreshold {
  /** Human readable name used in alert messages. */
  label: string;
  /** Error rate above which a `high` severity alert is raised. */
  warning: number;
  /** Error rate above which the alert is escalated to `critical`. */
  critical: number;
  /**
   * Multiplier applied to the rolling baseline. An observation at or above
   * `baseline * spikeMultiplier` is reported as a spike even while it is still
   * below `warning` — that is what catches a sudden 0.2% -> 2% jump long before
   * the absolute threshold notices it.
   */
  spikeMultiplier: number;
  /** Spikes below this absolute error rate are ignored as noise. */
  spikeMinRate: number;
  /** Number of preceding samples averaged to form the baseline. */
  baselineSamples: number;
  /** Preceding samples required before spike detection engages. */
  minBaselineSamples: number;
}

export interface AlertThresholds {
  responseTime: number;
  zoomApiLatency: number;
  zoomPacketLoss: number;
  zoomSdkLoadTime: number;
  zoomConnectionJitter: number;
  /** Error-rate thresholds keyed by metric name. */
  errorRates: Record<string, ErrorRateThreshold>;
}

export type AlertThresholdOverrides = Partial<Omit<AlertThresholds, 'errorRates'>> & {
  errorRates?: Record<string, Partial<ErrorRateThreshold>>;
};

export interface CheckAlertsOptions {
  /** Overrides merged over the currently configured thresholds. */
  thresholds?: AlertThresholdOverrides;
  /**
   * Older samples used to build the spike baseline. Samples in `metrics` that
   * precede the latest observation are folded in as well, so passing history is
   * only required when the caller polls one snapshot at a time.
   */
  history?: Metric[];
}

/** Baseline spike-detection settings shared by every error-rate metric. */
export const DEFAULT_ERROR_RATE_THRESHOLD: Omit<ErrorRateThreshold, 'label'> = {
  warning: 3,
  critical: 10,
  spikeMultiplier: 3,
  spikeMinRate: 1,
  baselineSamples: 10,
  minBaselineSamples: 3,
};

export const ERROR_RATE_METRIC = 'error_rate';
export const ZOOM_API_ERROR_RATE_METRIC = 'zoom_api_error_rate';

function numberFromEnv(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Deployment-time overrides for the primary error-rate metric. Read through
 * static `process.env.NEXT_PUBLIC_*` member accesses so Next.js can inline them
 * into the client bundle.
 */
function errorRateEnvOverrides(): Partial<ErrorRateThreshold> {
  if (typeof process === 'undefined') return {};

  const overrides: Partial<ErrorRateThreshold> = {};
  const warning = numberFromEnv(process.env.NEXT_PUBLIC_ALERT_ERROR_RATE_WARNING);
  const critical = numberFromEnv(process.env.NEXT_PUBLIC_ALERT_ERROR_RATE_CRITICAL);
  const spikeMultiplier = numberFromEnv(process.env.NEXT_PUBLIC_ALERT_ERROR_RATE_SPIKE_MULTIPLIER);
  const spikeMinRate = numberFromEnv(process.env.NEXT_PUBLIC_ALERT_ERROR_RATE_SPIKE_MIN_RATE);

  if (warning !== undefined) overrides.warning = warning;
  if (critical !== undefined) overrides.critical = critical;
  if (spikeMultiplier !== undefined) overrides.spikeMultiplier = spikeMultiplier;
  if (spikeMinRate !== undefined) overrides.spikeMinRate = spikeMinRate;

  return overrides;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  responseTime: 400,
  zoomApiLatency: 600,
  zoomPacketLoss: 3,
  zoomSdkLoadTime: 2500,
  zoomConnectionJitter: 30,
  errorRates: {
    [ERROR_RATE_METRIC]: { label: 'Error rate', ...DEFAULT_ERROR_RATE_THRESHOLD },
    [ZOOM_API_ERROR_RATE_METRIC]: {
      label: 'Zoom API error rate',
      ...DEFAULT_ERROR_RATE_THRESHOLD,
      warning: 4,
      critical: 15,
    },
  },
};

/**
 * Merge partial overrides over a base threshold set. Unknown error-rate metric
 * names are accepted so a feature can register its own rate without touching
 * this module.
 */
export function resolveAlertThresholds(
  overrides?: AlertThresholdOverrides,
  base: AlertThresholds = DEFAULT_ALERT_THRESHOLDS,
): AlertThresholds {
  const { errorRates: errorRateOverrides, ...scalarOverrides } = overrides ?? {};
  const errorRates: Record<string, ErrorRateThreshold> = { ...base.errorRates };

  Object.entries(errorRateOverrides ?? {}).forEach(([metric, override]) => {
    const existing: ErrorRateThreshold = errorRates[metric] ?? {
      label: metric,
      ...DEFAULT_ERROR_RATE_THRESHOLD,
    };

    errorRates[metric] = { ...existing, ...override };
  });

  return { ...base, ...scalarOverrides, errorRates };
}

let configuredThresholds: AlertThresholds = resolveAlertThresholds({
  errorRates: { [ERROR_RATE_METRIC]: errorRateEnvOverrides() },
});

/** Thresholds currently in force, i.e. defaults + env + `configureAlertThresholds`. */
export function getAlertThresholds(): AlertThresholds {
  return configuredThresholds;
}

/** Apply runtime overrides (admin settings, remote config) to every later check. */
export function configureAlertThresholds(overrides: AlertThresholdOverrides): AlertThresholds {
  configuredThresholds = resolveAlertThresholds(overrides, configuredThresholds);
  return configuredThresholds;
}

/** Restore the defaults + environment configuration. Primarily for tests. */
export function resetAlertThresholds(): AlertThresholds {
  configuredThresholds = resolveAlertThresholds({
    errorRates: { [ERROR_RATE_METRIC]: errorRateEnvOverrides() },
  });
  return configuredThresholds;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function byTimestamp(a: Metric, b: Metric): number {
  return a.timestamp - b.timestamp;
}

function severityFor(value: number, threshold: ErrorRateThreshold): AlertSeverity {
  return value > threshold.critical ? 'critical' : 'high';
}

/**
 * Mean of the samples immediately preceding the latest observation, or
 * `undefined` when there is not enough history to trust a baseline.
 */
function baselineFor(preceding: Metric[], threshold: ErrorRateThreshold): number | undefined {
  if (preceding.length < threshold.minBaselineSamples) return undefined;

  const window = preceding.slice(-threshold.baselineSamples);
  const total = window.reduce((sum, sample) => sum + sample.value, 0);

  return total / window.length;
}

/**
 * Evaluate one error-rate metric. The newest sample decides the absolute
 * breach; the samples before it form the baseline used for spike detection.
 */
function checkErrorRate(
  metricName: string,
  threshold: ErrorRateThreshold,
  samples: Metric[],
  history: Metric[],
): Alert[] {
  if (samples.length === 0) return [];

  const ordered = [...samples].sort(byTimestamp);
  const latest = ordered[ordered.length - 1];
  const alerts: Alert[] = [];

  if (latest.value > threshold.warning) {
    const severity = severityFor(latest.value, threshold);
    alerts.push({
      message:
        severity === 'critical'
          ? `${threshold.label} is above threshold (critical)`
          : `${threshold.label} is above threshold`,
      severity,
      metric: metricName,
      value: round(latest.value),
      threshold: severity === 'critical' ? threshold.critical : threshold.warning,
    });
  }

  // Only samples strictly older than the latest observation form the baseline —
  // overlapping polls must not fold the spike itself into what it is compared to.
  const priorHistory = history.filter(
    (sample) => sample.name === metricName && sample.timestamp < latest.timestamp,
  );
  const preceding = [...priorHistory, ...ordered.slice(0, -1)].sort(byTimestamp);
  const baseline = baselineFor(preceding, threshold);

  if (
    baseline !== undefined &&
    latest.value >= threshold.spikeMinRate &&
    latest.value >= baseline * threshold.spikeMultiplier
  ) {
    alerts.push({
      message: `${threshold.label} spiked to ${round(latest.value)}% (baseline ${round(
        baseline,
      )}%)`,
      severity: severityFor(latest.value, threshold),
      metric: metricName,
      value: round(latest.value),
      threshold: round(baseline * threshold.spikeMultiplier),
    });
  }

  return alerts;
}

export function checkAlerts(metrics: Metric[], options: CheckAlertsOptions = {}): Alert[] {
  const thresholds = resolveAlertThresholds(options.thresholds, configuredThresholds);
  const history = options.history ?? [];
  const alerts: Alert[] = [];
  const errorRateSamples = new Map<string, Metric[]>();

  metrics.forEach((m) => {
    // Error-rate metrics are evaluated per metric name rather than per sample so
    // the preceding samples can act as the spike baseline.
    if (thresholds.errorRates[m.name]) {
      const samples = errorRateSamples.get(m.name) ?? [];
      samples.push(m);
      errorRateSamples.set(m.name, samples);
      return;
    }

    if (m.name === 'response_time' && m.value > thresholds.responseTime) {
      alerts.push({
        message: 'High response time detected',
        severity: 'high',
        metric: m.name,
        value: m.value,
        threshold: thresholds.responseTime,
      });
    }

    if (m.name === 'zoom_api_latency' && m.value > thresholds.zoomApiLatency) {
      alerts.push({
        message: 'High Zoom API latency detected',
        severity: 'low',
        metric: m.name,
        value: m.value,
        threshold: thresholds.zoomApiLatency,
      });
    }

    if (m.name === 'zoom_packet_loss' && m.value > thresholds.zoomPacketLoss) {
      alerts.push({
        message: 'High packet loss in Zoom session detected',
        severity: 'high',
        metric: m.name,
        value: m.value,
        threshold: thresholds.zoomPacketLoss,
      });
    }

    if (m.name === 'zoom_sdk_load_time' && m.value > thresholds.zoomSdkLoadTime) {
      alerts.push({
        message: 'Zoom Web SDK load time is slow',
        severity: 'low',
        metric: m.name,
        value: m.value,
        threshold: thresholds.zoomSdkLoadTime,
      });
    }

    if (m.name === 'zoom_connection_jitter' && m.value > thresholds.zoomConnectionJitter) {
      alerts.push({
        message: 'High connection jitter in Zoom session detected',
        severity: 'low',
        metric: m.name,
        value: m.value,
        threshold: thresholds.zoomConnectionJitter,
      });
    }

    // Realtime transport reliability alerts (see src/lib/realtime/connectionSupervisor.ts)
    if (m.name === 'realtime_offline' && m.value > 0) {
      alerts.push({
        message: 'Realtime connection failed repeatedly — degraded to offline mode',
        severity: 'high',
        metric: m.name,
        value: m.value,
      });
    }

    if (m.name === 'heartbeat_timeout' && m.value > 0) {
      alerts.push({
        message: 'Realtime heartbeat timeout detected',
        severity: 'low',
        metric: m.name,
        value: m.value,
      });
    }
  });

  errorRateSamples.forEach((samples, metricName) => {
    alerts.push(...checkErrorRate(metricName, thresholds.errorRates[metricName], samples, history));
  });

  return alerts;
}

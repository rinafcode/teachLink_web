# Error-Rate Alerting

Error-rate metrics are evaluated by `checkAlerts()` in `src/lib/monitoring/alerts.ts` against
configurable thresholds. Two independent conditions can raise an alert:

- **Absolute breach** — the newest sample is above `warning` (severity `high`) or above `critical`
  (severity `critical`).
- **Spike** — the newest sample is at least `spikeMultiplier` times the rolling baseline of the
  preceding samples. This catches a jump from 0.2% to 2% long before the absolute threshold does.

Rates are percentages (`0`–`100`).

## Defaults

| Setting              | `error_rate` | `zoom_api_error_rate` | Meaning                                         |
| :------------------- | :----------- | :-------------------- | :---------------------------------------------- |
| `warning`            | 3            | 4                     | Absolute rate that raises a `high` alert        |
| `critical`           | 10           | 15                    | Absolute rate that escalates to `critical`      |
| `spikeMultiplier`    | 3            | 3                     | Multiple of the baseline that counts as a spike |
| `spikeMinRate`       | 1            | 1                     | Spikes under this rate are ignored as noise     |
| `baselineSamples`    | 10           | 10                    | Samples averaged into the baseline              |
| `minBaselineSamples` | 3            | 3                     | Samples required before spikes are evaluated    |

## Configuring thresholds

**Per deployment** — environment variables, read at module load:

```bash
NEXT_PUBLIC_ALERT_ERROR_RATE_WARNING=2
NEXT_PUBLIC_ALERT_ERROR_RATE_CRITICAL=8
NEXT_PUBLIC_ALERT_ERROR_RATE_SPIKE_MULTIPLIER=4
NEXT_PUBLIC_ALERT_ERROR_RATE_SPIKE_MIN_RATE=0.5
```

**At runtime** — `configureAlertThresholds()` applies to every later check; `resetAlertThresholds()`
restores the defaults plus the environment configuration:

```ts
configureAlertThresholds({
  responseTime: 800,
  errorRates: { checkout_error_rate: { label: 'Checkout error rate', warning: 1 } },
});
```

**Per call** — pass overrides to a single evaluation:

```ts
checkAlerts(metrics, { thresholds: { errorRates: { error_rate: { warning: 1 } } } });
```

Any metric name registered under `errorRates` gets the full threshold and spike treatment, so a
feature can add its own rate without editing `alerts.ts`.

## Recording error rates

`src/lib/monitoring/metrics.ts` turns individual request outcomes into a rate over a rolling window
(60s by default) and publishes each sample to the shared metric store:

```ts
recordRequestOutcome(response.ok === false); // returns the current rate
recordErrorRateSample(rateFromUpstream); // when the rate is already computed
```

Samples are retained per metric so spikes have a baseline to compare against:

```ts
checkAlerts(latestMetrics, { history: getErrorRateHistory() });
```

In React, `useMetricAlerts()` polls metrics and keeps the history across polls, so the newest samples
are always measured against a baseline they are not part of:

```ts
const { metrics, alerts } = useMetricAlerts();
```

## Tests

- `src/lib/monitoring/__tests__/alerts.test.ts` — thresholds, severity escalation, spike detection
- `src/lib/monitoring/__tests__/errorRate.test.ts` — rolling window, history retention, integration

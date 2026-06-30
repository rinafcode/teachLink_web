# Zoom Integration Performance Monitoring

This document details the Zoom Integration Performance Monitoring feature implemented in the TeachLink platform.

## Overview

The Zoom Integration Performance Monitoring tracks real-time performance metrics of the Zoom Web Client SDK and REST API. This system allows administrators to proactively identify connection degradation, API outages, and SDK load issues that affect live online classes.

## Tracked Metrics

The monitoring system registers and evaluates the following Zoom-related performance metrics:

| Metric Name              | Description                       | Good      | Warning  | Critical | Unit |
| :----------------------- | :-------------------------------- | :-------- | :------- | :------- | :--- |
| `zoom_api_latency`       | REST API endpoint response time   | <= 400ms  | > 400ms  | > 600ms  | ms   |
| `zoom_api_error_rate`    | Failed API requests ratio         | <= 2%     | > 2%     | > 4%     | %    |
| `zoom_sdk_load_time`     | Client SDK asset loading duration | <= 1800ms | > 1800ms | > 2500ms | ms   |
| `zoom_connection_jitter` | Meeting network connection jitter | <= 15ms   | > 15ms   | > 30ms   | ms   |
| `zoom_packet_loss`       | Network packet loss percentage    | <= 1.5%   | > 1.5%   | > 3%     | %    |

## Architecture & Integration Points

1. **Telemetry API Endpoint**

   - Location: `src/app/api/performance/zoom-metrics/route.ts`
   - Exposes mock real-time telemetry representing live Web Client SDK sessions and REST APIs.

2. **Metrics Collection Provider**

   - Location: `src/lib/monitoring/provider.ts` (`LocalMonitoringProvider`)
   - Queries the API endpoint and merges it with Core Web Vitals and DB connection pool metrics.

3. **Alert Evaluation Rules**

   - Location: `src/lib/monitoring/alerts.ts` (`checkAlerts`)
   - Checks threshold metrics and appends warning or critical alerts when limits are crossed.

4. **Performance Dashboard UI**
   - Location: `src/components/performance/PerformanceDashboard.tsx`
   - Visualizes live statuses using reactive widgets, pulsing indicator status, cards with rating tags, and connection component diagnostics.

## Verification

### Unit and Integration Tests

Unit tests are available at [zoom.test.ts](file:///c:/Users/JOTEL/OneDrive/Documentos/teachLink_web/src/lib/monitoring/__tests__/zoom.test.ts).

Run tests with:

```bash
npx pnpm test src/lib/monitoring/__tests__/zoom.test.ts
```

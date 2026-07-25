# TeachLink Backend – Alert Runbooks

This document provides on-call guidance for every Prometheus alert defined in
`charts/teachlink-backend/templates/prometheus-rules.yaml`.

Each section follows the same structure:

1. **What it means** – plain-English explanation of why the alert fired.
2. **Impact** – which users or features are affected.
3. **Triage steps** – ordered checklist to reproduce, scope, and diagnose.
4. **Remediation** – actions to resolve the incident.
5. **Escalation** – who to page if the steps above don't resolve it within SLA.

---

## Table of Contents

- [HighErrorRate](#higherrorrate)
- [HighP99Latency](#highp99latency)
- [QueueDepthHigh](#queuedepthhigh)
- [DLQDepthHigh](#dlqdepthhigh)

---

## HighErrorRate

**Severity:** `critical`
**Alert expression:**
```promql
(
  sum(rate(http_requests_total{job="teachlink-backend", status_code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="teachlink-backend"}[5m]))
) > 0.01
```
**Fires when:** More than 1 % of all HTTP requests have returned a 5xx response
code over a rolling 5-minute window, sustained for 5 minutes.

### What it means

A meaningful fraction of API calls are failing server-side.  This can be caused
by unhandled exceptions, database timeouts, downstream service failures,
out-of-memory crashes, or a bad deployment.

### Impact

- End-users see errors when loading courses, submitting assignments, or making
  payments.
- API consumers (mobile apps, third-party integrations) receive 5xx responses.

### Triage steps

1. **Confirm the alert is genuine** – open Grafana → TeachLink API dashboard →
   "Error Rate" panel.  Verify the rate exceeds 1 % and is not a transient blip.

2. **Identify the failing endpoints:**
   ```promql
   topk(10,
     rate(http_requests_total{job="teachlink-backend", status_code=~"5.."}[5m])
   ) by (path, method, status_code)
   ```

3. **Check pod logs for stack traces:**
   ```bash
   kubectl logs -n <namespace> -l app.kubernetes.io/name=teachlink-backend \
     --since=10m | grep -E "(ERROR|Exception|5[0-9][0-9])"
   ```

4. **Check recent deployments:**
   ```bash
   kubectl rollout history deployment/teachlink-backend -n <namespace>
   ```
   If a deployment was rolled out in the last 30 minutes, rollback is the
   fastest mitigation (see Remediation below).

5. **Check downstream dependencies** – database connectivity, Redis, external
   payment APIs.  Look for connection-refused or timeout errors in the logs.

6. **Check pod restarts / OOMKilled events:**
   ```bash
   kubectl get pods -n <namespace> -l app.kubernetes.io/name=teachlink-backend
   kubectl describe pod <pod-name> -n <namespace> | grep -A5 "Last State"
   ```

### Remediation

| Cause | Action |
|---|---|
| Bad deployment | `kubectl rollout undo deployment/teachlink-backend -n <namespace>` |
| Database down | Restore DB or failover to replica; check RDS/PG logs |
| Pod OOMKilled | Increase `resources.limits.memory` in values; redeploy |
| Downstream API down | Enable circuit-breaker flag or return cached fallback |
| Unhandled exception | Hot-fix the code path identified in logs, redeploy |

### Escalation

If error rate does not drop below 1 % within **15 minutes** of initial triage:
- Page the on-call backend engineer via PagerDuty.
- Notify `#teachlink-incidents` Slack channel with a brief status update.

---

## HighP99Latency

**Severity:** `warning`
**Alert expression:**
```promql
histogram_quantile(
  0.99,
  sum by (le) (
    rate(http_request_duration_seconds_bucket{job="teachlink-backend"}[5m])
  )
) > 1.0
```
**Fires when:** The 99th-percentile request latency exceeds 1 second for 10
consecutive minutes.

### What it means

At least 1 % of requests are taking longer than 1 second.  Common culprits are
slow database queries, N+1 query patterns, lock contention, CPU throttling, or
memory pressure causing GC pauses.

### Impact

- Users experience sluggish page loads and time-outs on slow connections.
- Background jobs that call the API may queue up, eventually triggering
  `QueueDepthHigh`.

### Triage steps

1. **Identify the slow endpoints:**
   ```promql
   topk(10,
     histogram_quantile(0.99,
       rate(http_request_duration_seconds_bucket{job="teachlink-backend"}[5m])
     ) by (path, method, le)
   )
   ```

2. **Check database slow-query logs:**
   - RDS Performance Insights → filter by `wait_event_type = Lock` or
     `wait_event_type = IO`.
   - Look for queries taking > 500 ms.

3. **Check CPU and memory utilisation:**
   ```promql
   rate(process_cpu_seconds_total{job="teachlink-backend"}[5m]) * 100
   process_resident_memory_bytes{job="teachlink-backend"} / 1024 / 1024
   ```

4. **Check for pod CPU throttling:**
   ```bash
   kubectl top pods -n <namespace> -l app.kubernetes.io/name=teachlink-backend
   ```
   If pods are at or near CPU limit, throttling is the likely cause.

5. **Enable query explain-analyse** on the suspected slow query in a staging
   environment to confirm.

### Remediation

| Cause | Action |
|---|---|
| Slow DB query | Add index; rewrite query; cache result with Redis |
| CPU throttling | Increase `resources.limits.cpu`; add HPA scaling rule |
| N+1 queries | Apply DataLoader / eager-load relations in ORM |
| Memory pressure / GC | Increase memory limit; profile heap with `clinic.js` |
| External API slow | Add timeouts; cache responses; use background job |

### Escalation

If P99 latency remains above 1 s after **30 minutes**:
- Page backend engineer.
- If DB is implicated, page the DBA on-call.

---

## QueueDepthHigh

**Severity:** `warning`
**Alert expression:**
```promql
bull_queue_waiting{job="teachlink-backend"} > 1000
```
**Fires when:** Any Bull/BullMQ queue has more than 1 000 jobs waiting to be
processed for 10 consecutive minutes.

### What it means

Workers are not consuming jobs fast enough.  This can mean workers have crashed,
processing is too slow, or a traffic spike has produced an unusual burst of jobs.

### Impact

- Delayed delivery of emails, push notifications, certificate generation, or
  other async tasks.
- If the queue continues growing, Redis memory pressure will follow.

### Triage steps

1. **Identify which queue is backed up:**
   ```promql
   topk(5, bull_queue_waiting{job="teachlink-backend"}) by (queue)
   ```

2. **Check the rate of job consumption vs. arrival:**
   ```promql
   rate(bull_queue_completed{job="teachlink-backend"}[5m]) by (queue)
   rate(bull_queue_added{job="teachlink-backend"}[5m])    by (queue)
   ```

3. **Check worker pod health:**
   ```bash
   kubectl get pods -n <namespace> -l app.kubernetes.io/name=teachlink-backend
   kubectl logs -n <namespace> <worker-pod> --since=10m | grep -i "worker\|queue\|bull"
   ```

4. **Check Redis health** (Bull backs onto Redis):
   ```bash
   kubectl exec -it <redis-pod> -n <namespace> -- redis-cli INFO memory
   ```

5. **Check for a sudden spike in job arrivals** (e.g., a scheduled batch job or
   user-triggered bulk operation).

### Remediation

| Cause | Action |
|---|---|
| Workers crashed | `kubectl rollout restart deployment/teachlink-backend -n <namespace>` |
| Too few workers | Scale out: `kubectl scale deployment/teachlink-backend --replicas=N` |
| Slow job processing | Profile the job handler; optimise DB calls or external I/O |
| Redis OOM | Increase Redis memory limit or purge stale keys |
| Burst traffic | Enable rate-limiting at API layer to reduce job creation rate |

### Escalation

If queue depth does not decrease within **20 minutes**:
- Page backend engineer.
- If Redis is implicated, page infrastructure on-call.

---

## DLQDepthHigh

**Severity:** `critical`
**Alert expression:**
```promql
bull_queue_failed{job="teachlink-backend"} > 50
```
**Fires when:** More than 50 jobs have moved to the failed (dead-letter) state
within a queue, sustained for 5 minutes.

### What it means

Jobs are failing repeatedly and exhausting their retry budget.  No further
automatic retries will occur for these jobs — the work is effectively lost until
an engineer intervenes.

### Impact

- Permanent failure of async tasks: emails unsent, certificates not issued,
  webhooks not delivered, payments not reconciled.
- Data consistency issues if jobs were part of a saga or transactional workflow.

### Triage steps

1. **Identify the failing queue and error:**
   ```promql
   topk(5, bull_queue_failed{job="teachlink-backend"}) by (queue)
   ```

2. **Inspect failed job payloads via Bull Board** (if deployed) at
   `https://<internal-host>/admin/queues`, or directly via Redis:
   ```bash
   kubectl exec -it <redis-pod> -n <namespace> -- \
     redis-cli LRANGE bull:<queue-name>:failed 0 4
   ```

3. **Read the failure reason from job metadata** — look for
   `"failedReason"` in the JSON payload.

4. **Check application logs** for the worker around the time failures spiked:
   ```bash
   kubectl logs -n <namespace> -l app.kubernetes.io/name=teachlink-backend \
     --since=30m | grep -i "failed\|error\|unhandled"
   ```

5. **Reproduce** the failing job in a staging environment using the same payload
   to confirm the fix before retrying production jobs.

### Remediation

| Cause | Action |
|---|---|
| Code bug in job handler | Fix bug, redeploy, then retry jobs from Bull Board |
| External dependency down | Wait for dependency to recover; then bulk-retry jobs |
| Invalid job payload | Patch payload schema validation; discard or correct jobs |
| Credentials expired | Rotate the affected secret; restart the worker |

**Bulk retry via Bull Board:**
Navigate to `Admin → Queues → <queue-name> → Failed` and click
**Retry All Failed**.

**Bulk retry via Redis CLI** (last resort):
```bash
# Move all failed jobs back to the waiting list
kubectl exec -it <redis-pod> -n <namespace> -- \
  redis-cli EVAL "
    local failed = redis.call('lrange', KEYS[1], 0, -1)
    for _, v in ipairs(failed) do
      redis.call('lpush', KEYS[2], v)
    end
    redis.call('del', KEYS[1])
    return #failed
  " 2 bull:<queue-name>:failed bull:<queue-name>:wait
```

### Escalation

If the DLQ continues growing after the fix is deployed:
- Page backend engineer immediately — data loss may be occurring.
- Open a P1 incident and notify `#teachlink-incidents`.
- Document affected job IDs for potential manual reprocessing.

---

## Updating These Runbooks

When a new alert is added to `prometheus-rules.yaml`:

1. Add a matching `##` section to this file following the template above.
2. Set the `runbook_url` annotation in the alert to point at the new section:
   ```
   runbook_url: "https://github.com/rinafcode/teachLink_backend/blob/main/docs/RUNBOOKS.md#<anchor>"
   ```
3. Open a PR — runbook changes should be reviewed by the on-call rotation lead.

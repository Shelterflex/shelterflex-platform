# Backend Monitoring

Observability for the Shelterflex backend (`backend/`): distributed traces, Prometheus metrics, slow-query logging, and recommended alert thresholds.

## OpenTelemetry tracing

Initialized in `backend/src/tracing.ts` (imported first in `backend/src/index.ts`).

| Resource attribute | Source |
| --- | --- |
| `service.name` | `OTEL_SERVICE_NAME` (default `shelterflex-backend`) |
| `service.version` | `VERSION` |
| `deployment.environment` | `NODE_ENV` |

| Variable | Default | Description |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318/v1/traces` | OTLP HTTP trace endpoint |
| `OTEL_SAMPLING_RATIO` | `1.0` | Trace sampling ratio |
| `NODE_ENV` | — | `development` uses console span export; other values use OTLP HTTP |

Auto-instrumentation covers Express HTTP, PostgreSQL (`pg`), and outgoing HTTP.

**Local verification:** run Jaeger or another OTLP HTTP receiver, or start with `NODE_ENV=development` and inspect console span output.

## Prometheus metrics (`GET /metrics`)

| Variable | Description |
| --- | --- |
| `METRICS_TOKEN` | Bearer token required to scrape (`Authorization: Bearer <token>`) |

Returns `401` when the token is missing or incorrect.

### Custom metrics (`backend/src/metrics.ts`)

| Metric | Type | Labels | Description |
| --- | --- | --- | --- |
| `payment_initiated_total` | Counter | `provider`, `status` | Payment initiations (`success` / `failed`) |
| `deal_activation_duration_ms` | Histogram | — | Deal activation end-to-end latency (ms) |
| `kyc_submission_total` | Counter | `status` | KYC submissions by outcome |
| `late_payment_escalation_total` | Counter | `escalation_step` | Late-payment escalations by step |

Default Node/process metrics are also exported via `prom-client` `collectDefaultMetrics`.

A separate OTLP/Prometheus exporter may still listen on `PROMETHEUS_PORT` (default `9464`) for SDK metrics; `GET /metrics` is the secured `prom-client` scrape endpoint for issue #931.

## Database query monitoring

- Queries slower than **100 ms** (configurable via `DB_SLOW_QUERY_THRESHOLD_MS`) log a warning with parameterised SQL and `durationMs`.
- Each HTTP request tracks **database query count** keyed by `x-request-id` (logged when the request completes).

## Health check (`GET /health`)

```json
{
  "status": "ok",
  "uptime": 123.45,
  "version": "0.1.0",
  "dbLatencyMs": 2,
  "memoryUsageMb": 85,
  "requestId": "..."
}
```

`dbLatencyMs` is measured with `SELECT 1`. `memoryUsageMb` is heap used rounded to megabytes.

Additional diagnostics remain under `GET /health/details` and related routes.

## Recommended alert thresholds

Configure in Grafana, Datadog, or your monitoring platform:

| Condition | Threshold | Window | Suggested severity |
| --- | --- | --- | --- |
| Route P99 latency | > 2 s | 5 min | Warning |
| HTTP error rate | > 1% of requests | 5 min | Critical |
| Container memory | > 80% of limit | 5 min | Warning |
| Slow DB queries | sustained increase in slow-query log rate | 15 min | Warning |

Example PromQL (adjust labels to your setup):

- P99 latency: `histogram_quantile(0.99, sum(rate(http_server_duration_bucket[5m])) by (le, http_route)) > 2`
- Error rate: `sum(rate(http_server_requests_total{http_status_code=~"5.."}[5m])) / sum(rate(http_server_requests_total[5m])) > 0.01`
- Memory: `process_resident_memory_bytes / container_memory_limit_bytes > 0.8`

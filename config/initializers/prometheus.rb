# frozen_string_literal: true

require 'prometheus/client'
require 'prometheus/client/formats/text'

# Initialize a global Prometheus registry
PROMETHEUS_REGISTRY = Prometheus::Client.registry

# ── Application Metrics ────────────────────────────────────────────
# HTTP request metrics
HTTP_REQUESTS_TOTAL = PROMETHEUS_REGISTRY.counter(
  :http_requests_total,
  docstring: 'Total HTTP requests',
  labels: %i[method path status]
)

HTTP_REQUEST_DURATION = PROMETHEUS_REGISTRY.histogram(
  :http_request_duration_seconds,
  docstring: 'HTTP request duration in seconds',
  labels: %i[method path],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

# Business metrics
ORDERS_TOTAL = PROMETHEUS_REGISTRY.counter(
  :orders_total,
  docstring: 'Total orders created',
  labels: %i[status product_type]
)

PROVISIONING_TOTAL = PROMETHEUS_REGISTRY.counter(
  :provisioning_total,
  docstring: 'Total provisioning attempts',
  labels: %i[status type]
)

ACTIVE_VMS = PROMETHEUS_REGISTRY.gauge(
  :active_vms_total,
  docstring: 'Number of active VMs'
)

ACTIVE_USERS = PROMETHEUS_REGISTRY.gauge(
  :active_users_total,
  docstring: 'Number of registered users'
)

SIDEKIQ_JOBS = PROMETHEUS_REGISTRY.gauge(
  :sidekiq_jobs,
  docstring: 'Sidekiq job counts',
  labels: [:state]
)

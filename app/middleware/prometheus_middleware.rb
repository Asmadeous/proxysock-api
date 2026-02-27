# frozen_string_literal: true

# Rack middleware to instrument HTTP requests for Prometheus metrics
class PrometheusMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    status, headers, body = @app.call(env)

    duration = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time
    method = env['REQUEST_METHOD']
    path = normalize_path(env['PATH_INFO'])

    HTTP_REQUESTS_TOTAL.increment(labels: { method: method, path: path, status: status.to_s })
    HTTP_REQUEST_DURATION.observe(duration, labels: { method: method, path: path })

    [status, headers, body]
  rescue StandardError => e
    HTTP_REQUESTS_TOTAL.increment(labels: { method: env['REQUEST_METHOD'], path: normalize_path(env['PATH_INFO']), status: '500' })
    raise e
  end

  private

  # Collapse dynamic segments (IDs) to prevent high-cardinality metrics
  def normalize_path(path)
    path.to_s
        .gsub(%r{/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}i, '/:id') # UUIDs
        .gsub(%r{/\d+}, '/:id') # Numeric IDs
        .truncate(80)
  end
end

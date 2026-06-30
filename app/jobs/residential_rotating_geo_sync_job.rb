# frozen_string_literal: true

# Populates the residential-rotating geo tables (rr_countries / rr_states /
# rr_isps) that the storefront country/state/ISP dropdowns read from.
#
# Enqueued by ProductSyncService#sync_residential_rotating_config so a fresh
# environment is seeded by the same proxy product sync that loads the catalog —
# the geo data is provider-rate-limited (throttled) and too slow to run inline in
# the synchronous admin sync request, hence a background job.
#
# Uses MyProxyApi's read-only get-* endpoints (no order balance consumed) and is
# idempotent (upserts), so it is safe to re-run.
class ResidentialRotatingGeoSyncJob < ApplicationJob
  queue_as :low

  def perform
    ResidentialRotatingGeoSync.new.call
  end
end

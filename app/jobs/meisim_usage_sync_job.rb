# frozen_string_literal: true

# Refreshes data usage for MeiSIM travel eSIMs. US carrier lines expose no usage.
class MeisimUsageSyncJob < ApplicationJob
  queue_as :low

  def perform(client: MeisimService.new)
    travel_esims.find_each do |esim|
      usage = client.usage(esim.esim_order.provider_order_no, line: esim.metadata&.dig('line') || 1)
      esim.update!(
        data_total_bytes: usage['data_total_mb'].to_i.megabytes,
        data_used_bytes: usage['data_used_mb'].to_i.megabytes,
        expires_at: usage['expires_at'].presence || esim.expires_at,
        esim_status: usage['status'],
        status: usage['status'] == 'expired' ? 'expired' : esim.status
      )
    rescue MeisimService::Error => e
      Rails.logger.warn("[MeisimUsageSync] #{esim.iccid}: #{e.message}")
    end
  end

  private

  def travel_esims
    Esim.joins(:esim_order)
        .where(esim_provider: 'meisim', status: 'active')
        .where("esim_orders.metadata->>'meisim_line' = 'travel'")
        .includes(:esim_order)
  end
end

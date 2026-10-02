# frozen_string_literal: true

module Admin
  module Api
    class ProviderBalancesController < BaseController
      # GET /admin/api/provider_balances
      # Returns the current account balances from upstream providers.
      # Response:
      #   {
      #     myproxy: { available_balance: 123.45, currency: "USD", ... },
      #     esim_access: { balance: 45.67, raw_balance: 456700 },
      #     meisim: { balance: 63.55, markup_pct: 15, currency: "USD" },
      #     fetched_at: "2026-06-02T12:00:00Z"
      #   }
      def index
        balances = {}

        # ── MyProxyApi balance ────────────────────────────────
        begin
          client = MyProxyApiClient.new
          response = client.account_info
          reseller_data = response.dig('data', 'reseller') || {}
          account_data = response['reseller_account'] || {}
          balances[:myproxy] = {
            available_balance: reseller_data['available_balance'] || reseller_data['balance'],
            deposited_amount: reseller_data['total_deposited'],
            order_amount: reseller_data['total_orders_amount'],
            currency: reseller_data['currency'] || 'USD',
            username: account_data['username'],
            discount: account_data['discount']
          }
        rescue StandardError => e
          Rails.logger.error("Provider balance fetch failed (MyProxyApi): #{e.message}")
          balances[:myproxy] = { error: e.message }
        end

        # ── eSIM Access balance ───────────────────────────────
        begin
          esim_service = EsimAccessService.new
          obj = esim_service.balance_query
          raw_balance = obj['balance'] || 0
          balances[:esim_access] = {
            balance: (raw_balance.to_f / 10_000).round(2),
            raw_balance: raw_balance,
            currency: 'USD'
          }
        rescue StandardError => e
          Rails.logger.error("Provider balance fetch failed (eSIM Access): #{e.message}")
          balances[:esim_access] = { error: e.message }
        end

        # ── MeiSIM dealer wallet ──────────────────────────────
        begin
          wallet = MeisimService.new.wallet
          balances[:meisim] = {
            balance: wallet['balance'],
            markup_pct: wallet['markupPct'],
            currency: 'USD'
          }
        rescue StandardError => e
          Rails.logger.error("Provider balance fetch failed (MeiSIM): #{e.message}")
          balances[:meisim] = { error: e.message }
        end

        balances[:fetched_at] = Time.current.iso8601

        render json: balances
      end
    end
  end
end

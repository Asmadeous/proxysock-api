# frozen_string_literal: true

# Fallback reconciliation for RexPay payments whose browser redirect never
# reached /webhooks/rexpay (tab closed, lost connection, settlement lag).
#
# RexPay has NO server-to-server webhook — the only success signal is the payer's
# browser being redirected back to us. This poller is the safety net that prevents
# a paid customer from being stranded when that redirect doesn't arrive.
#
# Each run: for every pending RexPay checkout session / deposit older than MIN_AGE,
# re-check getTransactionStatus and reconcile the successful ones through the SAME
# PaymentReconciler the webhook uses. Records still unpaid past MAX_AGE are
# abandoned so we stop polling them — safe because RexPay's hosted checkout session
# expires long before then, so no payment can land after the cutoff.
class RexpayReconciliationJob < ApplicationJob
  queue_as :default

  # Give the browser redirect first crack before we poll; stop chasing after the cutoff.
  MIN_AGE = ENV.fetch('REXPAY_SWEEP_MIN_AGE_MINUTES', '5').to_i.minutes
  MAX_AGE = ENV.fetch('REXPAY_SWEEP_MAX_AGE_HOURS', '2').to_i.hours

  def perform
    sweep_checkout_sessions
    sweep_deposits
  end

  private

  def sweep_checkout_sessions
    CheckoutSession.where(payment_method: 'rexpay', status: 'pending')
                   .where(created_at: ..MIN_AGE.ago)
                   .find_each do |session|
      reconcile(session, session.gateway_reference)

      next unless session.reload.pending? && session.created_at < MAX_AGE.ago && session.may_fail?

      session.fail!
      Rails.logger.info("[RexpaySweep] Abandoned stale checkout session #{session.id}")
    end
  end

  def sweep_deposits
    Deposit.where(gateway: 'rexpay', status: 'pending')
           .where(created_at: ..MIN_AGE.ago)
           .find_each do |deposit|
      reconcile(deposit, deposit.metadata&.dig('transaction_ref'))

      next unless deposit.reload.status == 'pending' && deposit.created_at < MAX_AGE.ago

      deposit.update(status: 'failed')
      Rails.logger.info("[RexpaySweep] Abandoned stale deposit #{deposit.id}")
    end
  end

  # Verify with RexPay and, only if successful, apply the same effect as the webhook.
  def reconcile(record, reference)
    return if reference.blank?

    result = RexpayService.new.verify_transaction(reference)
    return unless result[:status] == 'success'

    PaymentReconciler.reconcile(
      { 'reference' => reference, 'amount' => result[:amount], 'currency' => result[:currency], 'metadata' => {} },
      'rexpay'
    )
    Rails.logger.info("[RexpaySweep] Reconciled #{record.class.name} #{record.id} (#{reference})")
  rescue StandardError => e
    Rails.logger.error("[RexpaySweep] #{record.class.name} #{record.id} (#{reference}) failed: #{e.message}")
  end
end

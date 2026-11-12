# frozen_string_literal: true

class Deposit < ApplicationRecord
  belongs_to :depositable, polymorphic: true
  belongs_to :user, optional: true # Deprecated
  belongs_to :linked_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true
  belongs_to :payment_method, optional: true

  # Payment confirmation email. Card gateways like RexPay don't email the customer
  # after a successful charge, so we send our own receipt — otherwise the customer
  # is left wondering whether their money went through. Fired here (rather than in
  # a specific reconciler) so it sends exactly once no matter which path marks the
  # deposit completed: webhook, the RexPay sweeper, or verify_and_sync.
  after_update_commit :send_deposit_confirmation, if: :just_completed?

  private

  def just_completed?
    saved_change_to_status? && status == 'completed'
  end

  def send_deposit_confirmation
    return if depositable&.email.blank?

    InvoiceMailer.with(deposit: self, gateway: gateway, amount: amount)
                 .deposit_receipt_email.deliver_later
  rescue StandardError => e
    Rails.logger.error("[Deposit] confirmation email failed for deposit #{id}: #{e.message}")
  end
end

# frozen_string_literal: true

# Implements bullet-proof refunds for failed orders, providing atomic
# locks and safely handling both internal wallets and external fiat gateways.
class RefundService
  class RefundError < StandardError; end
  class DeferredCryptoRefund < StandardError; end

  def initialize(order)
    @order = order
  end

  def process!(refund_method: 'auto')
    @order.with_lock do
      raise RefundError, 'Order must be in failed state' unless @order.failed?
      raise RefundError, 'Nothing to refund' unless @order.total_amount.to_f.positive?

      owner = @order.orderable
      checkout = @order.checkout_session

      if refund_method == 'wallet' || checkout.nil?
        # Force a wallet refund, or perform one because there is no external gateway
        process_wallet_refund!(owner)
      else
        process_gateway_refund!(checkout)
      end

      # Atomically transition to refunded
      @order.refund!
    end
  end

  private

  def process_wallet_refund!(owner)
    wallet = owner.main_wallet || owner.wallet
    raise RefundError, 'Owner wallet not found' unless wallet

    # Validate that an actual debit transaction exists for this order before blindly refunding
    debit_txn = Transaction.find_by(reference: @order, transaction_type: 'debit', status: 'success')

    if debit_txn.nil?
      # Fallback: check if the order was paid as part of a Cart Checkout (where reference is the owner)
      debit_txn = Transaction.where(transactable: owner, transaction_type: 'debit', status: 'success')
                             .where("metadata->>'order_ids' LIKE ?", "%#{@order.id}%").first
    end

    raise RefundError, 'No successful payment transaction found for this order; nothing to refund' unless debit_txn

    # This debit!/credit! internally uses with_lock as well
    wallet.credit!(@order.total_amount, "Refund for failed order ##{@order.order_number}", { order_id: @order.id })

    # Notify user
    NotificationService.notify(
      recipient: owner,
      category: 'success',
      title: 'Order Refunded',
      message: "$#{@order.total_amount} has been refunded to your wallet for failed order ##{@order.order_number}."
    )
  end

  def process_gateway_refund!(checkout)
    case checkout.payment_method
    when 'bachs'
      process_bachs_refund!(checkout)
    when 'plisio', 'hundredpay', 'heleket'
      # These gateways usually require sending crypto via a withdrawal or manual transfer,
      # or they don't support automated direct refunds.
      # Create an internal Payout object instead to queue it for the admin or auto-dispatch.e caller that manual crypto claiming is required.
      raise DeferredCryptoRefund, "Order paid via crypto (#{checkout.payment_method}). User must provide wallet address from dashboard."
    else
      raise RefundError, "Unsupported gateway refund for #{checkout.payment_method}"
    end
  end

  # Bachs settles refunds later (refund.failed alerts staff) and allows one refund
  # per payment, so a second failed order from the same cart cannot go back to the card.
  def process_bachs_refund!(checkout)
    metadata = checkout.metadata.to_h
    raise RefundError, "No Bachs payment id on checkout #{checkout.id}" if metadata['bachs_charge_id'].blank?
    if metadata['bachs_refund_id'].present?
      raise RefundError, "Checkout #{checkout.id} already has a Bachs refund; use refund_method: 'wallet'"
    end

    refund = BachsService.new.create_refund(
      charge_id: metadata['bachs_charge_id'],
      reference: "REF#{@order.id.delete('-')}",
      amount: @order.total_amount,
      reason: "Order ##{@order.order_number} failed to provision"
    )
    checkout.update!(metadata: metadata.merge('bachs_refund_id' => refund['refund_id']))
  rescue BachsService::Error => e
    raise RefundError, "Bachs refused the refund: #{e.message}"
  end
end

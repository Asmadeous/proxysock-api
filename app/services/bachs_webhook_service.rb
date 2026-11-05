# frozen_string_literal: true

# Applies a signature-verified Bachs webhook event. A payment is confirmed by
# reading the checkout back from Bachs, never from the event body alone.
class BachsWebhookService
  # Raised when Bachs should redeliver the event later (the controller answers 503).
  class NotReady < StandardError; end

  def initialize(event, client: BachsService.new)
    @event = event
    @data = event['data'] || {}
    @client = client
  end

  def process!
    # Our endpoint only subscribes to our own account; ignore anything from a sub-account.
    return if @event['account'].present?

    case @event['type']
    when 'checkout.completed' then complete_checkout
    when 'refund.failed' then alert_refund_failed
    when 'dispute.created', 'dispute.updated' then alert_dispute
    end
  end

  private

  # Only checkout.completed fulfils: Bachs also sends collection.succeeded for the
  # same payment, and acting on one event type avoids a second, racing credit.
  def complete_checkout
    return unless @data['payment_status'] == 'paid'

    checkout = @client.checkout(@data['checkout_id'])
    raise NotReady, "Bachs checkout #{checkout['checkout_id']} is #{checkout['status']}" unless checkout['status'] == 'completed'
    return unless amount_matches?(checkout) && fully_paid?(checkout)

    PaymentReconciler.reconcile(
      {
        'reference' => checkout['reference'],
        'amount' => checkout['amount'],
        'currency' => checkout['currency'],
        'metadata' => checkout['metadata'] || {},
        'bachs_checkout_id' => checkout['checkout_id'],
        'bachs_charge_id' => checkout.dig('charge', 'payment_id')
      },
      'bachs'
    )
  end

  def amount_matches?(checkout)
    expected = expected_amount(checkout['reference'])
    return true if expected.nil? # unknown reference: the reconciler ignores it

    return true if checkout['currency'] == 'USD' && checkout['amount'].to_d >= expected.to_d.round(2)

    alert('Bachs payment does not match its record',
          'Reference' => checkout['reference'], 'Checkout' => checkout['checkout_id'],
          'Paid' => "#{checkout['amount']} #{checkout['currency']}", 'Expected' => "#{expected} USD")
    false
  end

  # Bachs can accept a short payment as final and still complete the checkout, whose
  # amount stays the full price. Hold it for staff instead of crediting the full price.
  def fully_paid?(checkout)
    owed = BachsService.amount_owed(checkout)
    return true unless owed.positive?

    charge = checkout['charge'] || {}
    alert('Bachs payment is short of its price',
          'Reference' => checkout['reference'], 'Checkout' => checkout['checkout_id'],
          'Payment' => charge['payment_id'], 'Status' => charge['status'],
          'Paid' => "#{charge['amount_paid']} of #{charge['amount']} #{charge['currency']}")
    false
  end

  def expected_amount(reference)
    case reference.to_s
    when /\ACHECKOUT/ then CheckoutSession.find_by(gateway_reference: reference)&.total_amount
    when /\ADEP/ then Deposit.where("metadata->>'transaction_ref' = ?", reference).first&.amount
    when /\AORD([0-9a-fA-F]{32})/ then Order.find_by(id: Regexp.last_match(1))&.total_amount
    end
  end

  def alert_refund_failed
    alert('Bachs refund failed',
          'Refund' => @data['refund_id'], 'Payment' => @data['charge_id'], 'Reference' => @data['reference'],
          'Amount' => @data['requested_amount'], 'Reason' => @data['reason'])
  end

  def alert_dispute
    alert("Bachs dispute #{@data['status']}",
          'Dispute' => @data['dispute_id'], 'Payment' => @data['charge_id'],
          'Amount' => "#{@data['amount']} #{@data['currency']}", 'Reason' => @data['reason'],
          'Respond by' => @data['response_deadline_at'])
  end

  def alert(title, fields)
    SlackNotifyJob.perform_later('bachs_alert', { 'title' => title, 'fields' => fields.transform_values(&:to_s) })
  end
end

# frozen_string_literal: true

# Top-ups for MeiSIM phone-number lines (US and UK). MeiSIM's API cannot top up most of
# these lines, so the customer pays from their balance here, staff are alerted, and
# they apply the credit in the MeiSIM portal before marking the top-up completed.
class EsimTopupService
  class NotEligible < StandardError; end
  class InvalidAmount < StandardError; end
  class InsufficientBalance < StandardError; end

  # A one-time $10 credit costs the customer $15; a monthly auto top-up costs exactly
  # the credit the customer chooses.
  PRICE_MULTIPLIER = BigDecimal('1.5')
  ONE_TIME_VALUES = [BigDecimal('10')].freeze
  MIN_SUBSCRIPTION_VALUE = BigDecimal('10')
  PHONE_LINES = %w[us_prepaid uk_prepaid].freeze

  def self.price_for(value)
    (value.to_d * PRICE_MULTIPLIER).round(2)
  end

  def self.eligible?(order)
    order.product&.provider == 'meisim' &&
      PHONE_LINES.include?(order.product.metadata&.dig('meisim_line')) &&
      order.status == 'active'
  end

  def initialize(order, actor)
    @order = order
    @actor = actor
  end

  def buy_once!(value)
    value = value.to_d
    raise InvalidAmount, 'Choose one of the available top-up amounts' unless ONE_TIME_VALUES.include?(value)

    charge!(value)
  end

  # Starts (or replaces) the monthly auto top-up and charges the first month now.
  def subscribe!(value)
    value = value.to_d
    if value < MIN_SUBSCRIPTION_VALUE || value != value.round
      raise InvalidAmount, "Auto top-up must be a whole amount of at least $#{MIN_SUBSCRIPTION_VALUE.to_i}"
    end

    ensure_eligible!
    ActiveRecord::Base.transaction do
      @order.esim_topup_subscriptions.live.find_each(&:cancel!)
      subscription = @order.esim_topup_subscriptions.create!(
        orderable: @actor, topup_value: value, price: value, next_charge_at: 1.month.from_now
      )
      charge!(value, subscription: subscription)
      subscription.update!(last_charged_at: Time.current)
      subscription
    end
  end

  # Monthly charge for a due subscription. A short balance marks it past_due and it is
  # retried the next day; nothing is charged.
  def self.renew!(subscription)
    order = subscription.order
    unless eligible?(order)
      subscription.cancel!
      return
    end

    new(order, subscription.orderable).charge!(subscription.topup_value, subscription: subscription)
    subscription.charged!
    subscription.update!(last_charged_at: Time.current, next_charge_at: subscription.next_charge_at + 1.month)
  rescue InsufficientBalance
    subscription.payment_failed! if subscription.may_payment_failed?
  end

  def self.complete!(topup, note: nil)
    topup.update!(admin_note: note) if note.present?
    topup.complete!
  end

  # Cancels a pending top-up and returns the customer's money to their balance.
  def self.cancel_and_refund!(topup, note: nil)
    ActiveRecord::Base.transaction do
      topup.lock!
      raise InvalidAmount, 'Only pending top-ups can be cancelled' unless topup.pending?

      refund = Transaction.create!(
        transactable: topup.orderable, reference: topup, amount: topup.price, transaction_type: 'credit',
        status: 'success', currency: 'USD', payment_gateway: 'wallet',
        description: "Refund: eSIM top-up #{topup.reference}"
      )
      topup.orderable.wallet.credit!(topup.price, "Refund: eSIM top-up #{topup.reference}", {}, refund)
      topup.update!(admin_note: note) if note.present?
      topup.cancel!
    end
  end

  def charge!(value, subscription: nil)
    ensure_eligible!
    wallet = @actor.wallet
    raise InsufficientBalance, 'No wallet found' unless wallet

    price = subscription ? subscription.price : self.class.price_for(value)
    topup = ActiveRecord::Base.transaction do
      topup = @order.esim_topups.create!(
        orderable: @actor, esim_topup_subscription: subscription, topup_value: value, price: price
      )
      charge = Transaction.create!(
        transactable: @actor, reference: topup, amount: price, transaction_type: 'debit', status: 'success',
        currency: 'USD', payment_gateway: 'wallet',
        description: "eSIM top-up #{topup.reference}: $#{value.to_i} credit on #{@order.product.name}"
      )
      wallet.debit!(price, "eSIM top-up #{topup.reference}", {}, charge)
      topup.update!(charge_transaction: charge)
      topup
    end
    notify_staff(topup)
    topup
  rescue LedgerService::InsufficientFundsError
    raise InsufficientBalance, "Insufficient balance: the top-up costs $#{format('%.2f', price)}"
  end

  private

  def ensure_eligible!
    raise NotEligible, 'This line cannot be topped up' unless self.class.eligible?(@order)
  end

  def notify_staff(topup)
    SlackNotifierService.notify(:esim_topup_requested, topup)
    AdminMailer.esim_topup_request(topup).deliver_later
  end
end

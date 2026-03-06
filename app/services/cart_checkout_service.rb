# frozen_string_literal: true

class CartCheckoutService
  class CheckoutError < StandardError; end

  SUPPORTED_GATEWAYS = %w[paystack plisio payvra].freeze

  def initialize(actor, cart, payment_method: 'wallet')
    @actor = actor
    @cart = cart
    @payment_method = payment_method.to_s.downcase
  end

  def process!
    return { success: false, error: 'Cart is empty' } if @cart.cart_items.empty?

    # Securely calculate grand total from source of truth
    grand_total = calculate_secure_total

    if @payment_method == 'wallet'
      process_wallet_payment!(grand_total)
    elsif SUPPORTED_GATEWAYS.include?(@payment_method)
      process_gateway_payment!(grand_total)
    else
      { success: false, error: "Unsupported payment method: #{@payment_method}" }
    end
  end

  private

  def calculate_secure_total
    @cart.cart_items.sum do |item|
      PricingService.new(
        @actor,
        item.product,
        item.product_pricing,
        quantity: item.quantity,
        metadata: item.metadata # Check if metadata exists on cart_item table
      ).calculate_total
    end
  end

  # ========== Wallet Payment ==========
  def process_wallet_payment!(grand_total)
    wallet = @actor.wallet
    if wallet.nil? || wallet.balance < grand_total
      return { success: false,
               error: "Insufficient balance. Required: #{grand_total}, Available: #{wallet&.balance || 0}" }
    end

    created_orders = []

    ActiveRecord::Base.transaction do
      # Wallet.debit! handles transaction creation internally if transaction is passed?
      # Actually line 41 creates a Transaction.
      transaction = Transaction.create!(
        transactable: @actor,
        reference: @cart,
        amount: grand_total,
        transaction_type: 'debit',
        status: 'success',
        currency: 'USD',
        description: "Cart Checkout (#{@cart.cart_items.count} items)",
        metadata: { cart_id: @cart.id }
      )

      wallet.debit!(grand_total, 'Cart Checkout', { cart_id: @cart.id }, transaction)

      # Create and provision orders
      @cart.cart_items.each do |item|
        item.quantity.times do
          order = create_order_from_item(item)
          created_orders << order
          OrderProvisioningService.new(order, @actor).process_without_deduction!
        end
      end

      @cart.cart_items.destroy_all
    end

    { success: true, orders: created_orders, payment_method: 'wallet' }
  rescue StandardError => e
    Rails.logger.error("Wallet Checkout Failed: #{e.message}")
    { success: false, error: e.message }
  end

  # ========== Gateway Payment ==========
  def process_gateway_payment!(grand_total)
    checkout_session = nil
    created_orders = []

    ActiveRecord::Base.transaction do
      # Create CheckoutSession
      checkout_session = CheckoutSession.create!(
        orderable: @actor,
        total_amount: grand_total,
        payment_method: @payment_method,
        status: 'pending',
        metadata: { cart_id: @cart.id, item_count: @cart.cart_items.count }
      )

      # Create orders with awaiting_payment status
      @cart.cart_items.each do |item|
        item.quantity.times do
          order = create_order_from_item(item, checkout_session)
          order.await_payment! if order.may_await_payment?
          created_orders << order
        end
      end

      # Generate payment reference
      checkout_session.generate_reference!

      # Clear cart
      @cart.cart_items.destroy_all
    end

    # Generate payment URL
    payment_url = generate_payment_url(checkout_session, grand_total)

    {
      success: true,
      payment_method: @payment_method,
      payment_url: payment_url,
      checkout_session_id: checkout_session.id,
      reference: checkout_session.gateway_reference,
      orders: created_orders
    }
  rescue StandardError => e
    Rails.logger.error("Gateway Checkout Failed: #{e.message}")
    { success: false, error: e.message }
  end

  def create_order_from_item(item, checkout_session = nil)
    Order.create!(
      orderable: @actor,
      product: item.product,
      product_pricing: item.product_pricing,
      checkout_session: checkout_session,
      quantity: 1,
      status: 'pending',
      total_amount: item.unit_price
    )
  end

  def generate_payment_url(session, amount)
    # The callback_url is where the USER is redirected after payment.
    # The webhook URL is configured in Paystack dashboard, or we can pass it if supported.
    # Currently we want the user back on the FRONTEND success page.
    callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=#{@payment_method}&type=cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}"
    reference = session.gateway_reference

    case @payment_method
    when 'paystack'
      PaystackService.new.initialize_transaction(
        email: @actor.email,
        amount: (amount * 100).to_i, # Kobo
        reference: reference,
        callback_url: callback_url,
        metadata: { checkout_session_id: session.id, user_id: @actor.id, type: 'cart_checkout' }
      )[:authorization_url]

    when 'plisio'
      result = PlisioService.new.create_invoice(amount, 'USD', reference)
      result[:url]

    when 'payvra'
      PayvraService.new.create_charge(amount, 'USD')
    end
  end
end

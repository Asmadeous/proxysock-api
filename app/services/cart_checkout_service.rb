# frozen_string_literal: true

class CartCheckoutService
  class CheckoutError < StandardError; end

  SUPPORTED_GATEWAYS = %w[paystack plisio payvra].freeze

  def initialize(user, cart, payment_method: 'wallet')
    @user = user
    @cart = cart
    @payment_method = payment_method.to_s.downcase
  end

  def process!
    return { success: false, error: 'Cart is empty' } if @cart.cart_items.empty?

    grand_total = @cart.cart_items.sum(&:total_price)

    if @payment_method == 'wallet'
      process_wallet_payment!(grand_total)
    elsif SUPPORTED_GATEWAYS.include?(@payment_method)
      process_gateway_payment!(grand_total)
    else
      { success: false, error: "Unsupported payment method: #{@payment_method}" }
    end
  end

  private

  # ========== Wallet Payment ==========
  def process_wallet_payment!(grand_total)
    wallet = @user.wallet
    if wallet.nil? || wallet.balance < grand_total
      return { success: false, error: "Insufficient balance. Required: #{grand_total}, Available: #{wallet&.balance || 0}" }
    end

    created_orders = []

    ActiveRecord::Base.transaction do
      # Debit Wallet
      transaction = Transaction.create!(
        transactable: @user,
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
          OrderProvisioningService.new(order, @user).process_without_deduction!
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
        user: @user,
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
      orderable: @user,
      product: item.product,
      product_pricing: item.product_pricing,
      checkout_session: checkout_session,
      quantity: 1,
      status: 'pending',
      total_amount: item.unit_price
    )
  end

  def generate_payment_url(session, amount)
    callback_url = "#{ENV['APP_URL']}/webhooks/#{@payment_method}"
    reference = session.gateway_reference

    case @payment_method
    when 'paystack'
      PaystackService.new.initialize_transaction(
        email: @user.email,
        amount: (amount * 100).to_i, # Kobo
        reference: reference,
        callback_url: callback_url,
        metadata: { checkout_session_id: session.id, user_id: @user.id, type: 'cart_checkout' }
      )[:authorization_url]

    when 'plisio'
      result = PlisioService.new.create_invoice(amount, 'USD', reference)
      result[:url]

    when 'payvra'
      PayvraService.new.create_charge(amount, 'USD')
    end
  end
end

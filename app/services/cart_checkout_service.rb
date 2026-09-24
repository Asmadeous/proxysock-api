# frozen_string_literal: true

class CartCheckoutService
  class CheckoutError < StandardError; end

  SUPPORTED_GATEWAYS = %w[rexpay plisio fastspring heleket].freeze

  def initialize(actor, cart, payment_method: 'wallet')
    @actor = actor
    @cart = cart
    @payment_method = payment_method.to_s.downcase

    # Resellers are restricted to balance-only (Wallet) payments for API operations and dashboard orders
    @payment_method = 'wallet' if @actor.is_a?(Reseller)
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
    is_infra = @actor.is_a?(Reseller) && @actor.infrastructure?

    if !is_infra && (wallet.nil? || wallet.balance < grand_total)
      return { success: false,
               error: "Insufficient balance. Required: #{grand_total}, Available: #{wallet&.balance || 0}" }
    end

    created_orders = []

    ActiveRecord::Base.transaction do
      # Transaction record and debit only for non-infrastructure actors
      unless is_infra
        transaction = Transaction.create!(
          transactable: @actor,
          reference: @cart,
          amount: grand_total,
          transaction_type: 'debit',
          status: 'success',
          currency: 'USD',
          payment_gateway: 'wallet',
          description: "Cart Checkout (#{@cart.cart_items.count} items)",
          metadata: { cart_id: @cart.id }
        )

        wallet.debit!(grand_total, 'Cart Checkout', { cart_id: @cart.id }, transaction)
      end

      # Create orders
      @cart.cart_items.each do |item|
        item.quantity.times do
          order = create_order_from_item(item)
          created_orders << order
        end
      end

      @cart.cart_items.destroy_all
    end

    # Provision in the background. Provisioning can take minutes — the provider
    # needs time to assign IPs (OrderProvisioningService sleeps while polling) —
    # so it must NOT run inline in the request, or the web/proxy timeout kills it
    # mid-provision and strands the order in `processing` (charged, no proxy).
    # Enqueued after the transaction commits so the orders are visible to the
    # worker; skip_payment: true because the balance was already debited above.
    created_orders.each do |order|
      OrderProvisioningJob.perform_later(order.id, @actor.id, @actor.class.name, skip_payment: true)
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

      # We do NOT clear the cart here. Wait for the webhook to confirm payment
      # or let the user resume/abandon the cart.
      # @cart.cart_items.destroy_all
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
      total_amount: item.unit_price,
      metadata: (item.metadata || {}).slice('imei', 'eid', 'address')
    )
  end

  def generate_payment_url(session, amount)
    # The callback_url is where the USER is redirected after payment.
    # For RexPay the callbackUrl points at our webhook, which verifies the
    # charge and then bounces the user to the FRONTEND success page.
    # Determine product type for the success page (if it's a single type or multiple)
    types = @cart.cart_items.map { |i| i.product.product_type }.uniq
    product_type = types.size == 1 ? types.first : 'mixed'

    callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=#{@payment_method}&type=cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}&product_type=#{product_type}"
    reference = session.gateway_reference

    case @payment_method
    when 'rexpay'
      # RexPay (Nigerian account) charges NGN; gross up so the customer pays the fee.
      RexpayService.new.create_payment(
        email: @actor.email,
        amount: RexpayService.ngn_charge_amount(amount),
        currency: 'NGN',
        reference: reference,
        callback_url: RexpayService.webhook_callback_url(reference, callback_url)
      )[:payment_url]

    when 'plisio'
      PlisioService.new.create_invoice(
        amount: amount,
        currency: 'USD',
        order_number: reference,
        callback_url: callback_url,
        email: @actor.email
      )[:url]

    when 'heleket'
      HeleketService.new.create_invoice(
        amount: amount,
        currency: 'USD',
        order_number: reference,
        callback_url: callback_url,
        email: @actor.email
      )[:url]

    when 'fastspring'
      fs = FastspringService.new
      # Create dynamic product for the cart
      product_path = fs.create_dynamic_product(reference, amount, "Proxysock Cart Checkout (#{reference})")

      # Create FastSpring session with tags
      fs_session_id = fs.create_session(@actor.email, product_path, {
                                          checkout_session_id: session.id,
                                          reference: reference,
                                          user_id: @actor.id
                                        })

      store_url = ENV['FASTSPRING_STORE_URL'] || 'https://proxysock.onfastspring.com'
      "#{store_url.chomp('/')}/session/#{fs_session_id}"
    end
  end
end

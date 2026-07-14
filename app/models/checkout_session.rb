# frozen_string_literal: true

class CheckoutSession < ApplicationRecord
  belongs_to :orderable, polymorphic: true
  has_many :orders, dependent: :nullify

  include AASM

  PAYMENT_METHODS = %w[wallet rexpay plisio hundredpay fastspring heleket].freeze

  # Alias for controllers that reference the gateway by this name
  alias_attribute :gateway, :payment_method

  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  # Inclusion checked on: :create so historical sessions on retired gateways
  # (e.g. paystack) can still transition state
  validates :payment_method, presence: true
  validates :payment_method, inclusion: { in: PAYMENT_METHODS }, on: :create
  validates :gateway_reference, uniqueness: true, allow_nil: true

  aasm column: :status do
    state :pending, initial: true
    state :paid
    state :processing
    state :completed
    state :failed
    state :refunded

    event :mark_paid do
      transitions from: :pending, to: :paid
    end

    event :process do
      transitions from: :paid, to: :processing
    end

    event :complete do
      transitions from: :processing, to: :completed
    end

    event :fail do
      transitions from: %i[pending paid processing], to: :failed
    end

    event :refund do
      transitions from: %i[paid completed], to: :refunded
    end
  end

  # Generate a unique reference for payment gateways
  def generate_reference!
    ref = "CHECKOUT_#{id}_#{SecureRandom.hex(4).upcase}"
    update!(gateway_reference: ref)
    ref
  end

  # Process all linked orders after successful payment
  def provision_orders!
    return false unless paid? || processing?

    process! if paid?

    is_reseller = orderable.is_a?(Reseller)

    ActiveRecord::Base.transaction do
      if orders.empty? && metadata['items'].present?
        metadata['items'].each do |item|
          product = if is_reseller
                      Product.for_resellers.find_by(id: item['product_id'] || item[:product_id])
                    else
                      Product.for_ecommerce.find_by(id: item['product_id'] || item[:product_id])
                    end
          next unless product

          pricing = product.product_pricings.find_by(active: true) || product.product_pricings.first

          order_metadata = (item['metadata'] || item[:metadata] || {}).merge(
            'payment_debug' => metadata['payment_debug'] || (is_reseller ? 'reseller_gateway' : 'gateway'),
            'client_ip' => metadata['client_ip'] || '0.0.0.0'
          )

          # Propagate customer_email for infrastructure reseller orders
          if is_reseller && metadata['customer_email'].present?
            order_metadata['customer_email'] = metadata['customer_email']
            order_metadata['credentials_email'] = metadata['customer_email']
          end

          # Propagate gateway tokens for recurring billing
          %w[fastspring_sub_id].each do |key|
            order_metadata[key] = metadata[key] if metadata[key].present?
          end

          order = Order.create!(
            orderable: orderable,
            product: product,
            product_pricing: pricing,
            quantity: item['quantity'] || item[:quantity] || 1,
            metadata: order_metadata,
            status: 'awaiting_payment',
            checkout_session: self
          )

          # Create ResellerOrder link for reseller orders
          next unless is_reseller

          ResellerOrder.create!(
            reseller: orderable,
            order_id: order.id,
            orderable: orderable
          )
        end
      end
    end

    # Provision OUTSIDE the transaction so all Order records are committed
    # and visible to Sidekiq before any background jobs are enqueued.
    orders.reload.where(status: %w[pending awaiting_payment]).find_each do |order|
      actor = is_reseller ? orderable : order.orderable
      # Provision in the background — provider IP assignment can take minutes and
      # would otherwise block the gateway webhook. Already paid via gateway, so
      # skip_payment: true (no wallet debit).
      OrderProvisioningJob.perform_later(order.id, actor.id, actor.class.name, skip_payment: true)
    end

    complete!
    true
  rescue StandardError => e
    Rails.logger.error("[CheckoutSession] Provisioning failed for session #{id}: #{e.message}")
    fail!
    false
  end
end

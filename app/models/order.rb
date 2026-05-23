# frozen_string_literal: true

class Order < ApplicationRecord
  belongs_to :orderable, polymorphic: true, optional: true # ResellOrder or EcommerceOrder (optional for direct orders)
  has_many :reseller_orders, dependent: :destroy

  # Active Storage attachment for VPN OVPN config files
  has_one_attached :ovpn_config

  # Active Storage attachment for PDF invoices
  has_one_attached :invoice_pdf

  # Active Storage attachment for RDP connection files
  has_one_attached :rdp_config
  # belongs_to :user, optional: true # Direct user orders - Replaced by orderable logic if applicable?
  # Wait, let me check if user_id exists in Schema.
  # Schema has NO user_id on orders table. So this is also broken.

  def user
    orderable if orderable_type == 'User'
  end
  belongs_to :product
  belongs_to :product_pricing
  belongs_to :checkout_session, optional: true
  # belongs_to :reseller, optional: true # Reseller orders - Replaced by orderable

  def reseller
    orderable if orderable_type == 'Reseller'
  end

  # Associations for provisioned resources
  has_one :vm_order, dependent: :destroy
  has_one :vm, through: :vm_order
  has_one :mobile_proxy_order, dependent: :destroy
  has_one :mobile_proxy, through: :mobile_proxy_order
  has_one :static_datacenter_proxy_order, dependent: :destroy
  has_one :static_isp_proxy_order, dependent: :destroy
  has_one :static_residential_proxy_order, dependent: :destroy
  has_one :residential_rotating_proxy_order, dependent: :destroy
  has_one :premium_isp_proxy_order, dependent: :destroy
  has_one :esim_order, dependent: :destroy
  has_one :usa_esim_order, dependent: :destroy
  has_one :vpn_order, dependent: :destroy
  has_one :vpn_account, through: :vpn_order, source: :vpn
  has_one :global_isp_proxy_order, dependent: :destroy
  has_one :global_isp_proxy, through: :global_isp_proxy_order

  def all_provisioned_resources
    case product.product_type
    when 'vps', 'rdp', 'vm' then [vm].compact
    when 'proxy', 'datacenter', 'isp', 'static_residential', 'residential_rotating', 'premium_isp', 'mobile', 'global_isp'
      resources = []
      resources << MobileProxy.where(order_id: id).to_a
      resources << StaticDatacenterProxy.where(order_id: id).to_a
      resources << StaticIspProxy.where(order_id: id).to_a
      resources << PremiumIspProxy.where(order_id: id).to_a
      resources << StaticResidentialProxy.where(order_id: id).to_a
      resources << ResidentialRotatingProxy.where(order_id: id).to_a
      resources << GlobalIspProxy.joins(:global_isp_proxy_order).where(global_isp_proxy_orders: { order_id: id }).to_a
      resources.flatten.compact
    when 'esim' then [esim_order].compact
    when 'usa_esim' then [usa_esim_order].compact
    when 'vpn' then [vpn_account].compact
    else []
    end
  end

  def provisioned_resource
    all_provisioned_resources.first
  end

  def proxy
    # Helper to find linked proxy across multiple tables/associations.
    # Note: mobile, static_datacenter, static_isp, residential_rotating all have direct order_id columns.
    # premium_isp and static_residential do NOT — they link via their respective proxy_order join tables.
    MobileProxy.find_by(order_id: id) ||
      StaticDatacenterProxy.find_by(order_id: id) ||
      StaticIspProxy.find_by(order_id: id) ||
      PremiumIspProxy.find_by(order_id: id) ||
      StaticResidentialProxy.find_by(order_id: id) ||
      ResidentialRotatingProxy.find_by(order_id: id) ||
      GlobalIspProxy.joins(:global_isp_proxy_order).find_by(global_isp_proxy_orders: { order_id: id })
  end

  def reorderable?(actor)
    # Check if the product is a proxy or VPN
    is_proxy_or_vpn = %w[proxy vpn].include?(product.product_type)

    if actor.is_a?(Reseller) && is_proxy_or_vpn && product.provider != 'myproxyapi' && (status == 'expired' || (expires_at.present? && expires_at < Time.current))
      # Resellers cannot reorder expired external proxies/vpn
      return false
    end

    if product.product_type == 'esim'
      return product.metadata&.dig('package_type') == 'topup'
    end

    true
  end

  before_save :calculate_total_amount
  before_create :generate_order_number
  after_create :notify_user_on_order

  private

  def notify_user_on_order
    return unless orderable

    Notification.create(
      recipient: orderable,
      category: 'success',
      title: "Order ##{order_number} Placed",
      message: "Your order for #{product&.name || 'a product'} has been placed successfully."
    )
  end

  public

  include AASM

  # Calculate total amount using centralized PricingService
  def calculate_total_amount
    return unless product_pricing && orderable

    self.total_amount = PricingService.new(
      orderable,
      product,
      product_pricing,
      quantity: quantity || 1,
      metadata: metadata
    ).calculate_total
  end

  def generate_order_number
    return if order_number.present?

    loop do
      self.order_number = "ORD-#{SecureRandom.hex(4).upcase}"
      break unless Order.exists?(order_number: order_number)
    end
  end

  def trigger_reseller_webhook
    return unless reseller

    resources = all_provisioned_resources
    payload = {
      order_id: id,
      order_number: order_number,
      product: product.name,
      status: status,
      total_amount: total_amount,
      metadata: metadata,
      resource: resources.first&.as_json,
      resources: resources.map(&:as_json),
      credentials: metadata&.dig('my_proxy_api_response') || metadata&.dig('proxy_credentials')
    }

    WebhookDispatchWorker.perform_later(reseller.id, 'order.completed', payload)
  end

  aasm column: :status do
    state :pending, initial: true
    state :awaiting_payment # For gateway checkout
    state :processing
    state :active
    state :expired
    state :cancelled
    state :failed
    state :refunded

    event :await_payment do
      transitions from: :pending, to: :awaiting_payment
    end

    event :process do
      transitions from: %i[pending awaiting_payment], to: :processing
    end

    event :activate do
      transitions from: :processing, to: :active, after: :trigger_reseller_webhook
    end

    event :expire do
      transitions from: :active, to: :expired
    end

    event :cancel do
      transitions from: %i[pending processing active], to: :cancelled
    end

    event :fail do
      transitions from: %i[pending processing], to: :failed, after: :notify_staff_on_failure
    end

    event :refund, guard: :refundable? do
      transitions from: %i[active failed cancelled], to: :refunded
    end
  end

  private

  def notify_staff_on_failure
    NotificationService.notify_staff(
      category: 'error',
      title: 'Order Provisioning Failed',
      message: "Order ##{order_number} for #{product&.name} failed during provisioning.",
      metadata: { order_id: id, order_number: order_number }
    )
  end

  # Guard: Block refunds when a provider order has already been placed and charged.
  # Any proxy/VPN purchased from MyProxyAPI — refunding the customer without
  # cancelling the provider order means eating the cost.
  def refundable?
    provider_order_id = metadata&.dig('provider_order_id')
    if provider_order_id.present?
      errors.add(:base, "Cannot refund: provider order #{provider_order_id} was already placed and charged. Cancel the provider order first.")
      return false
    end
    true
  end
end

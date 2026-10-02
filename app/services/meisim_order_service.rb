# frozen_string_literal: true

# Places and completes MeiSIM dealer orders for our `esim` orders.
#
# Outcomes of place!:
# - delivered: esims are created, the order is activated, the customer is emailed
# - pending:   the EsimOrder waits for MeisimOrderPollJob
# - failed / 402 / other 4xx: raises OrderFailed, so OrderProvisioningService
#   fails the order and refunds the customer
# - timeout / 5xx: MeiSIM may already have charged us and there is no
#   idempotency key, so the order is held for staff review instead of being
#   refunded or retried
class MeisimOrderService
  class OrderFailed < StandardError; end

  PROVIDER = 'meisim'
  FAILED_STATES = %w[failed cancelled refunded].freeze

  def initialize(order, client: MeisimService.new)
    @order = order
    @product = order.product
    @client = client
  end

  def place!
    response = create_remote_order
    return unless response

    esim_order = create_esim_order!(response)
    record_cost!(response['unitPriceUsd'])

    case response['activation']
    when 'failed' then fail_remote!(esim_order, response['failure'])
    when 'delivered' then complete_or_leave_pending(esim_order)
    end
    esim_order
  end

  # Pulls the MeiSIM order and completes, fails, or leaves it pending.
  def refresh!(esim_order)
    remote = @client.order(esim_order.provider_order_no)
    lines = Array(remote['lines'])

    if FAILED_STATES.include?(remote['state']) || lines.any? { |l| l['status'] == 'failed' }
      esim_order.update!(status: 'failed', api_response: esim_order.api_response.merge('remote_state' => remote['state']))
      fail_order_and_refund!("MeiSIM order #{remote['state']}")
    elsif lines.any? { |l| l['status'] == 'unavailable' }
      flag_unavailable!(esim_order)
    else
      complete!(esim_order, remote)
    end
  end

  private

  def owner
    @order.orderable
  end

  # Only this call may fail the order: once MeiSIM accepted it, we have paid.
  def create_remote_order
    @client.create_order(
      product_id: @product.provider_product_id,
      customer_email: support_inbox,
      customer_name: customer_name,
      quantity: @order.quantity || 1,
      **device_params
    )
  rescue MeisimService::Error => e
    raise_or_hold!(e)
  end

  # A lookup failure after a paid order must not refund the customer;
  # MeisimOrderPollJob completes it later.
  def complete_or_leave_pending(esim_order)
    complete!(esim_order)
  rescue MeisimService::Error => e
    Rails.logger.warn("[MeisimOrderService] Order #{@order.id} left pending: #{e.message}")
  end

  # MeiSIM mails its own branded delivery email to customerEmail and has no way to
  # turn it off, so it goes to our support inbox; customers get EsimMailer's email.
  def support_inbox
    Mail::Address.new(ApplicationMailer.default[:from]).address
  end

  def device_params
    return {} unless MeisimDeviceDetails.required_for?(@product)

    MeisimDeviceDetails.new(@product, @order.metadata).to_params
  end

  def customer_name
    [owner.try(:first_name), owner.try(:last_name)].compact_blank.join(' ').presence ||
      owner.try(:company_name).presence || owner.try(:username) || owner.email
  end

  def create_esim_order!(response)
    EsimOrder.create!(
      order: @order,
      esim_provider: PROVIDER,
      esim_type: @product.metadata&.dig('esim_type') || 'data_only',
      status: 'pending_provisioning',
      provider_order_no: response['orderId'],
      package_code: @product.provider_product_id,
      country_code: single_country || 'global',
      duration_days: @product.metadata&.dig('validity_days'),
      data_amount_gb: data_bytes && (data_bytes / 1.gigabyte.to_f).round(2),
      moq_quantity: @order.quantity || 1,
      api_response: response.slice('orderId', 'shortId', 'unitPriceUsd', 'totalUsd', 'activation', 'failure'),
      metadata: { 'meisim_line' => @product.metadata&.dig('meisim_line') }.compact
    )
  end

  def data_bytes
    @data_bytes ||= Esim.data_bytes(@product.metadata&.dig('data_limit'), @product.metadata&.dig('data_unit'))
  end

  def single_country
    countries = Array(@product.metadata&.dig('countries'))
    countries.first if countries.size == 1
  end

  # MeiSIM's catalogue has no dealer price, so each order's real unit price
  # keeps our recorded cost current.
  def record_cost!(unit_price)
    return if unit_price.blank?

    @product.product_pricings.find_by(currency: 'USD')&.update!(cost_price: unit_price.to_d)
  end

  def complete!(esim_order, remote = nil)
    remote ||= @client.order(esim_order.provider_order_no)
    lines = Array(remote['lines'])
    return unless lines.any? && lines.all? { |l| l['status'] == 'delivered' }

    esims = EsimOrder.transaction do
      created = lines.filter_map { |line| create_esim!(esim_order, line) }
      esim_order.update!(status: 'completed')
      @order.activate! if @order.may_activate?
      created
    end

    esims.each { |esim| EsimMailer.with(user: owner, esim: esim).delivery_email.deliver_later }
  end

  def create_esim!(esim_order, line)
    return if esim_order.esims.exists?(iccid: line['iccid'])

    esim_order.esims.create!(
      esim_provider: PROVIDER,
      iccid: line['iccid'],
      activation_code: line['activation_code'],
      qr_code_data: line['activation_code'],
      qr_code_url: line['qr_png_url'],
      msisdn: line['phone_number'],
      has_phone_number: line['phone_number'].present?,
      data_total_bytes: data_bytes,
      pin1: line['sim_pin'],
      status: 'active',
      esim_status: 'delivered',
      metadata: line.slice('line', 'smdp', 'matching_id', 'install_ios_url', 'install_android_url', 'kyc_url',
                           'qr_source', 'qr_available')
    )
  end

  def fail_remote!(esim_order, failure)
    failure ||= {}
    esim_order.update!(status: 'failed')
    unless failure['refunded']
      SlackNotifierService.notify(:provisioning_failed, @order,
                                  error: "MeiSIM failed order #{esim_order.provider_order_no} was NOT refunded to our wallet")
    end
    raise OrderFailed, "MeiSIM activation failed: #{failure['meaning'] || failure['reason'] || 'unknown reason'}"
  end

  def fail_order_and_refund!(reason)
    Rails.logger.error("[MeisimOrderService] Order #{@order.id}: #{reason}")
    @order.fail! if @order.may_fail?
    RefundService.new(@order).process!
  rescue RefundService::DeferredCryptoRefund => e
    Rails.logger.info("[MeisimOrderService] Order #{@order.id} awaits crypto refund address: #{e.message}")
  end

  def raise_or_hold!(error)
    if error.ambiguous?
      hold_for_review!(error)
    elsif error.status == 402
      SlackNotifierService.notify(:provisioning_failed, @order, error: 'MeiSIM dealer wallet balance is too low')
      raise OrderFailed, 'eSIM provider balance too low'
    else
      raise OrderFailed, error.message
    end
  end

  # MeiSIM: "unavailable — order finished with nothing recorded. Won't change on its own —
  # contact us." We have paid, so staff take it up with MeiSIM instead of a refund.
  def flag_unavailable!(esim_order)
    return if esim_order.metadata['unavailable_alerted']

    esim_order.update!(metadata: esim_order.metadata.merge('unavailable_alerted' => true))
    @order.update!(metadata: (@order.metadata || {}).merge('meisim_review_required' => true))
    SlackNotifierService.notify(:provisioning_failed, @order,
                                error: "MeiSIM order #{esim_order.provider_order_no} is unavailable (nothing recorded); " \
                                       'contact MeiSIM support')
  end

  def hold_for_review!(error)
    @order.update!(metadata: (@order.metadata || {}).merge('meisim_review_required' => true,
                                                           'meisim_error' => error.message))
    SlackNotifierService.notify(:provisioning_failed, @order,
                                error: "MeiSIM order outcome unknown (#{error.message}); check the dealer portal before refunding")
    nil
  end
end

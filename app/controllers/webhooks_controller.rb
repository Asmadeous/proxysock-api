# frozen_string_literal: true

require 'digest'
require 'base64'

class WebhooksController < ApplicationController
  def plisio
    # Plisio (with `json=true` on the callback URL) POSTs the invoice update as a JSON body
    # with a `verify_hash` field. Verification (Plisio docs, Node example): take the raw JSON,
    # remove verify_hash, re-encode the REMAINING fields in their received order (NO sorting),
    # then HMAC-SHA1 with the secret key. We must work from the raw body, not Rails `params`,
    # because params stringify values and can change ordering.
    data =
      begin
        JSON.parse(request.raw_post)
      rescue StandardError
        params.to_unsafe_h.except('controller', 'action', 'format')
      end

    received_hash = data['verify_hash']

    if ENV['PLISIO_SECRET_KEY'].present? && received_hash.present?
      payload = JSON.generate(data.except('verify_hash'))
      expected = OpenSSL::HMAC.hexdigest('SHA1', ENV['PLISIO_SECRET_KEY'], payload)

      unless Rack::Utils.secure_compare(expected, received_hash.to_s)
        Rails.logger.warn("[Webhook] Plisio verify_hash mismatch — rejecting. Expected: #{expected}, Got: #{received_hash}")
        return head :bad_request
      end
    end

    handle_payment(data, 'plisio') if data['status'] == 'completed'
    head :ok
  end

  def heleket
    # Heleket (a Cryptomus rebrand) POSTs the payment update as a JSON body that
    # carries a `sign` field = md5(base64(json_without_sign) + PAYMENT_API_KEY).
    # It does NOT send a signature header. Work from the raw body so values and
    # key ordering are preserved (Rails params stringify/re-order).
    data =
      begin
        JSON.parse(request.raw_post)
      rescue StandardError
        {}
      end

    api_key = ENV['HELEKET_PAYMENT_API_KEY'] || ENV['HELEKET_API_KEY']
    received_sign = data['sign']

    if api_key.present? && received_sign.present?
      body_for_sign = data.except('sign')
      # Cryptomus signs PHP's json_encode output, which escapes forward slashes
      # (`/` -> `\/`); Ruby's JSON leaves them unescaped. Accept either variant —
      # both require knowledge of the secret API key, so neither is forgeable.
      candidates = [
        JSON.generate(body_for_sign),
        JSON.generate(body_for_sign).gsub('/') { '\\/' }
      ].map { |json| Digest::MD5.hexdigest(Base64.strict_encode64(json) + api_key) }

      unless candidates.any? { |c| Rack::Utils.secure_compare(c, received_sign.to_s) }
        Rails.logger.warn("[Webhook] Heleket sign mismatch — rejecting. Expected one of: #{candidates}, Got: #{received_sign}")
        return head :bad_request
      end
    end

    # Heleket success statuses: `paid` (exact) and `paid_over` (overpaid).
    if %w[paid paid_over completed].include?(data['status'].to_s.downcase)
      # Cryptomus echoes our reference back as `order_id`; `uuid` is its own id.
      reference = data['order_id'] || data['uuid']
      handle_payment(
        {
          'reference' => reference,
          'order_number' => reference,
          'status' => data['status'],
          'amount' => data['amount'],
          'currency' => data['currency']
        },
        'heleket'
      )
    end

    head :ok
  end

  def hundredpay
    # We'll use the chargeId to verify the transaction status server-side for security.
    data = params.to_unsafe_h
    charge_id = data['chargeId'] || data['id'] || data.dig('data', 'chargeId')

    unless charge_id
      Rails.logger.warn('[Webhook] 100Pay: Missing chargeId in payload')
      return head :bad_request
    end

    # Server-side verification to confirm status
    verification = HundredpayService.new.verify_transaction(charge_id)

    if verification[:status] == 'success'
      # 100Pay metadata may contain order_number/reference or we use ref_id
      reference = data['ref_id'] || data.dig('data', 'charge', 'ref_id') || charge_id

      # Prepare data for handle_payment
      payment_data = {
        'reference' => reference,
        'amount' => verification[:amount],
        'currency' => verification[:currency],
        'metadata' => data['metadata'] || data.dig('data', 'charge', 'metadata') || {}
      }

      handle_payment(payment_data, 'hundredpay')
    else
      Rails.logger.info("[Webhook] 100Pay: Payment not success yet (status: #{verification[:internal_status]})")
    end
    head :ok
  end

  def fastspring
    payload = request.raw_post
    signature = request.headers['X-FS-Signature']
    secret = ENV['FASTSPRING_WEBHOOK_SECRET']

    if secret.present? && signature.present?
      expected = Base64.strict_encode64(OpenSSL::HMAC.digest('sha256', secret, payload))
      unless Rack::Utils.secure_compare(expected, signature)
        Rails.logger.warn('[Webhook] FastSpring signature mismatch — rejecting')
        return head :unauthorized
      end
    end

    data = begin
      JSON.parse(payload)
    rescue StandardError
      {}
    end
    events = data['events'] || []

    events.each do |event|
      next unless event['type'] == 'order.completed'

      fs_data = event['data']
      # Extract tags from the session/order if present
      metadata = fs_data['tags'] || {}

      # Determine reference from tags or product path (e.g. checkout-xyz)
      reference = metadata['reference']
      if reference.nil? && fs_data['items'].present?
        product_path = fs_data['items'].first['product'].to_s
        if product_path.start_with?('checkout-')
          reference = product_path.sub('checkout-', '').upcase
        end
      end

      payment_data = {
        'reference' => reference,
        'amount' => fs_data['total'],
        'currency' => fs_data['currency'],
        'metadata' => metadata.merge('fastspring_order_id' => fs_data['order']),
        'raw_data' => fs_data # Pass raw data to handle_payment for token extraction
      }

      handle_payment(payment_data, 'fastspring')
    end

    head :ok
  end

  # Unlike the other gateways, a missing secret or signature is a rejection, not a pass.
  def bachs
    unless BachsService.valid_signature?(request.raw_post, request.headers['X-Bachs-Signature-V2'], ENV['BACHS_WEBHOOK_SECRET'])
      Rails.logger.warn('[Webhook] Bachs signature mismatch, rejecting')
      return head :bad_request
    end

    BachsWebhookService.new(JSON.parse(request.raw_post)).process!
    head :ok
  rescue JSON::ParserError
    head :bad_request
  rescue BachsService::Error, BachsWebhookService::NotReady => e
    # Any 5xx makes Bachs redeliver the event later.
    Rails.logger.warn("[Webhook] Bachs: #{e.message}")
    head :service_unavailable
  end

  private

  # Confirmed-payment reconciliation lives in PaymentReconciler so the webhook and
  # other callers apply identical effects. Callers must have verified
  # the payment before calling this.
  def handle_payment(data, gateway)
    PaymentReconciler.reconcile(data, gateway)
  end
end

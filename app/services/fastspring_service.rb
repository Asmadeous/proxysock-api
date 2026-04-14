# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'
require 'base64'

class FastspringService
  # FastSpring strictly uses Basic Auth
  def initialize
    @username = ENV['FASTSPRING_USERNAME']
    @password = ENV['FASTSPRING_PASSWORD']
    @base_url = 'https://api.fastspring.com'
  end

  def create_dynamic_product(reference, amount, display_name = 'Proxysock Checkout')
    # FastSpring product paths must be alphanumeric and hyphens
    product_path = "checkout-#{reference.to_s.downcase.gsub(/[^a-z0-9]/, '-')}"

    payload = {
      products: [
        {
          product: product_path,
          display: {
            en: display_name
          },
          pricing: {
            price: { USD: amount.to_f.round(2) }
          }
        }
      ]
    }

    response = request(:post, '/products', payload)
    
    unless response['result'] == 'success' || response.dig('products', 0, 'result') == 'success'
      # Sometimes FastSpring responds with products array detailing success per item
      # We'll consider it successful if not an explicit error at root level.
      Rails.logger.warn("[FastSpring] Create product response: #{response.inspect}")
    end

    product_path
  end

  def create_session(email, product_path, tags = {})
    payload = {
      account: email,
      items: [
        {
          product: product_path,
          quantity: 1
        }
      ],
      tags: tags
    }

    response = request(:post, '/sessions', payload)

    # FastSpring returns `{ "id": "session-id-...", ... }`
    unless response['id']
      raise "FastSpring Session Creation Failed: #{response['error']&.dig('message') || response.inspect}"
    end

    response['id']
  end

  def charge_subscription(subscription_id, amount)
    request(:post, "/subscriptions/#{subscription_id}/charge", { amount: amount.to_f.round(2) })
  end

  private

  def request(method, endpoint, body = nil)
    uri = URI("#{@base_url}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = case method
          when :get then Net::HTTP::Get.new(uri)
          when :post then Net::HTTP::Post.new(uri)
          when :delete then Net::HTTP::Delete.new(uri)
          end

    req.basic_auth(@username, @password)
    req['Content-Type'] = 'application/json'
    req.body = body.to_json if body

    response = http.request(req)
    
    begin
      JSON.parse(response.body)
    rescue JSON::ParserError
      { 'error' => { 'message' => "Invalid JSON from FastSpring: #{response.body}" } }
    end
  end
end

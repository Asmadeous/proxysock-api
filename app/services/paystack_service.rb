# frozen_string_literal: true

class PaystackService
  BASE_URL = 'https://api.paystack.co'

  def initialize
    @secret_key = ENV['PAYSTACK_SECRET_KEY']
  end

  def initialize_transaction(params)
    response = request(:post, '/transaction/initialize', {
                         email: params[:email],
                         amount: params[:amount],
                         reference: params[:reference],
                         callback_url: params[:callback_url],
                         metadata: params[:metadata]
                       })

    { authorization_url: response['data']['authorization_url'] }
  end

  def generate_payment_link(email, amount_kobo, reference)
    initialize_transaction(
      email: email,
      amount: amount_kobo,
      reference: reference,
      callback_url: "#{ENV['APP_URL']}/webhooks/paystack/callback"
    )[:authorization_url]
  end

  def verify_transaction(reference)
    response = request(:get, "/transaction/verify/#{reference}")

    if response['data']['status'] == 'success'
      return {
        status: 'success',
        amount: response['data']['amount'],
        customer_email: response['data']['customer']['email']
      }
    end

    { status: 'failed' }
  end

  private

  def request(method, endpoint, body = nil)
    uri = URI("#{BASE_URL}#{endpoint}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = case method
              when :get then Net::HTTP::Get.new(uri)
              when :post then Net::HTTP::Post.new(uri)
              end

    request['Authorization'] = "Bearer #{@secret_key}"
    request['Content-Type'] = 'application/json'
    request.body = body.to_json if body

    response = http.request(request)
    JSON.parse(response.body)
  end
end

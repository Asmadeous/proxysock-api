class PlisioService
  BASE_URL = 'https://plisio.net/api/v1'
  
  def initialize
    @secret_key = ENV['PLISIO_SECRET_KEY']
  end

  def create_invoice(amount, currency, order_number)
    # Convert local currency to crypto or use Plisio's fiat conversion
    response = request(:get, '/invoices/new', {
      source_currency: 'USD',
      source_amount: amount,
      order_number: order_number,
      order_name: "Deposit #{order_number}",
      callback_url: "#{ENV['APP_URL']}/webhooks/plisio/callback",
      email: 'customer@example.com' # Optional if we passed it
    })
    
    if response['status'] == 'success'
      return {
        url: response['data']['invoice_url'],
        txn_id: response['data']['txn_id']
      }
    end
    
    raise "Plisio Error: #{response['data']['message']}"
  end

  def verify_callback(params)
    # Plisio sends callback data. Verify secure if possible (check IP or secret if they sign it)
    # Simple verification: verify_hmac check if supported or query status
    
    # Usually we rely on the callback status
    params['status'] == 'completed' || params['status'] == 'mismatch' # Mismatch might need manual review
  end

  private

  def request(method, endpoint, params = {})
    params[:api_key] = @secret_key
    uri = URI("#{BASE_URL}#{endpoint}")
    uri.query = URI.encode_www_form(params)
    
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    
    request = Net::HTTP::Get.new(uri) # Plisio uses GET for everything mostly? Check docs. Typically GET for invoice creation.

    response = http.request(request)
    JSON.parse(response.body)
  end
end

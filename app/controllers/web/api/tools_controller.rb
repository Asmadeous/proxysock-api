module Web
  module Api
    class ToolsController < BaseController
      skip_before_action :authenticate_user!, raise: false

      def ip_lookup
        ip = params[:ip].presence || request.remote_ip
        # Handle localhost/private IPs by using a default public IP for testing if needed
        # or just let external API handle it (it might verify the IP).
        
        # Using ip-api.com (free for non-commercial, 45 requests/min)
        # For production enterprise usage, use a paid key or different provider.
        require 'net/http'
        require 'json'
        
        url = "http://ip-api.com/json/#{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting"
        uri = URI(url)
        response = Net::HTTP.get(uri)
        data = JSON.parse(response)
        
        if data['status'] == 'fail'
          render json: { error: data['message'] }, status: :unprocessable_entity
        else
          render json: transform_to_frontend_format(data)
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      private

      def transform_to_frontend_format(data)
        # Basic transformation to match client IPResult interface partially
        {
          ip: data['query'],
          city: data['city'],
          region: data['regionName'],
          region_code: data['region'],
          country_name: data['country'],
          country_code: data['countryCode'],
          latitude: data['lat'],
          longitude: data['lon'],
          postal: data['zip'],
          timezone: {
             name: data['timezone'],
             # Simple offset not provided by basic query without formatting
          },
          asn: split_asn(data['as']),
          company: {
            name: data['org'],
            network: data['isp']
          },
          carrier: data['mobile'] ? { name: data['isp'] } : nil,
          threat: {
            is_proxy: data['proxy'] || false,
            is_datacenter: data['hosting'] || false,
            # ip-api free doesn't give full threat scores like "tor", "vpn" etc reliably without paid plan features usually?
            # Actually fields=proxy,hosting are available in some plans or strict usage.
            # We'll just pass what we have.
          }
        }
      end

      def split_asn(asn_string)
         # "AS12345 Name" -> { asn: "AS12345", name: "Name" }
         return nil unless asn_string
         parts = asn_string.split(" ", 2)
         { asn: parts[0], name: parts[1] || parts[0] }
      end
    end
  end
end

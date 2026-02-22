<<<<<<< HEAD
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
=======
# frozen_string_literal: true

module Web
  module Api
    class ToolsController < BaseController
      skip_before_action :authenticate_request, only: [:ip_checker]

      # public endpoint
      def ip_checker
        ip = params[:ip]
        if ip.blank?
          ip = request.headers['X-Forwarded-For']&.split(',')&.first&.strip || 
               request.headers['X-Real-IP'] || 
               request.headers['CF-Connecting-IP'] ||
               request.remote_ip
        end

        if ip.blank?
          return render json: { error: 'Unable to detect IP address' }, status: :bad_request
        end
        
        # Determine valid IPv4 or IPv6
        unless ip =~ Resolv::IPv4::Regex || ip =~ Resolv::IPv6::Regex
          return render json: { error: 'Invalid IP address format' }, status: :bad_request
        end

        api_key = ENV['IPDATA_API_KEY']
        if api_key.blank?
          return render json: { error: 'IPDATA_API_KEY not configured' }, status: :internal_server_error
        end

        requested_fields = [
          'ip', 'is_eu', 'city', 'region', 'region_code', 'country_name', 'country_code',
          'continent_name', 'continent_code', 'latitude', 'longitude', 'postal', 
          'calling_code', 'flag', 'emoji_flag', 'emoji_unicode', 'asn', 'company',
          'carrier', 'timezone', 'currency', 'threat', 'usage_type', 'languages', 'count'
        ].join(',')

        response = HTTParty.get(
          "https://api.ipdata.co/#{ip}?api-key=#{api_key}&fields=#{requested_fields}",
          headers: {
            'Accept' => 'application/json',
            'User-Agent' => 'Rails-Backend-IP-Intelligence/1.0'
          }
        )

        unless response.success?
          error_message = 'Failed to fetch IP data from ipdata.co'
          case response.code
          when 400 then error_message = 'Invalid IP address provided'
          when 401 then error_message = 'Invalid ipdata.co API key'
          when 403 then error_message = 'ipdata.co API key quota exceeded or access denied'
          when 429 then error_message = 'Rate limit exceeded. Please try again later.'
          when 422 then error_message = 'Unprocessable IP address'
          end

          return render json: { error: error_message, status_code: response.code }, status: response.code
        end

        data = response.parsed_response

        # Optional Advanced ASN Call
        if data['asn'] && data['asn']['asn'].present?
          asn_resp = HTTParty.get(
            "https://api.ipdata.co/asn/#{data['asn']['asn']}?api-key=#{api_key}",
            headers: { 'Accept' => 'application/json' }
          )
          if asn_resp.success?
            data['asn_details'] = asn_resp.parsed_response
          end
        end

        # Enhancements for backwards compatibility based on JS code
        score, risk = calculate_risk_score(data['threat'])
        
        enhanced_result = data.merge(
          'score' => score,
          'risk' => risk,
          'url' => "https://ipdata.co/#{ip}",
          'ip_country_name' => data['country_name'],
          'ip_country_code' => data['country_code'],
          'ip_state_name' => data['region'],
          'ip_city' => data['city'],
          'ip_postcode' => data['postal'],
          'ISP_Name' => data.dig('asn', 'name') || data.dig('company', 'name'),
          'ISP_Fraud_Score' => data.dig('threat', 'scores') ? (data['threat']['scores'].values.sum / data['threat']['scores'].length.to_f).floor : nil,
          'proxy_type' => get_proxy_type(data['threat']),
          'connection_type' => data['usage_type'] || data.dig('asn', 'type') || data.dig('company', 'type')
        )

        render json: enhanced_result
      rescue => e
        Rails.logger.error("IP Checker Error: #{e.message}")
        render json: { error: 'Internal server error occurred while processing IP data' }, status: :internal_server_error
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      end

      private

<<<<<<< HEAD
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
=======
      def calculate_risk_score(threat)
        return [0, 'low'] if threat.blank?

        score = 0
        score += 35 if threat['is_known_attacker']
        score += 30 if threat['is_known_abuser']
        score += 40 if threat['is_bogon']
        score += 25 if threat['is_tor']
        score += 20 if threat['is_proxy']
        score += 15 if threat['is_vpn']
        score += 12 if threat['is_datacenter']
        score += 8  if threat['is_icloud_relay']

        if threat['blocklists'].present? && threat['blocklists'].is_a?(Array)
          score += [threat['blocklists'].size * 10, 30].min
        end

        if threat['scores'].present? && threat['scores'].is_a?(Hash) && threat['scores'].any?
          avg_score = threat['scores'].values.sum.to_f / threat['scores'].size
          score += (avg_score / 10).floor
        end

        score = [score, 100].min

        risk = if score >= 75
                 'very high'
               elsif score >= 50
                 'high'
               elsif score >= 25
                 'medium'
               else
                 'low'
               end

        [score, risk]
      end

      def get_proxy_type(threat)
        return 'Clean' if threat.blank?
        return 'TOR' if threat['is_tor']
        return 'VPN' if threat['is_vpn']
        return 'iCloud Relay' if threat['is_icloud_relay']
        return 'Proxy' if threat['is_proxy']
        return 'Datacenter' if threat['is_datacenter']
        
        'Clean'
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      end
    end
  end
end

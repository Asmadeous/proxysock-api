# frozen_string_literal: true

require 'resolv'
require 'ipaddr'

module Web
  module Api
    class ToolsController < BaseController
      skip_before_action :authenticate_request, only: %i[ip_checker ip_lookup]

      before_action :ensure_env_loaded

      def ip_checker
        perform_ip_lookup(params[:ip])
      end

      def ip_lookup
        perform_ip_lookup(params[:ip])
      end

      private

      def perform_ip_lookup(ip_param)
        # 1. Use user-provided IP if present
        # 2. Otherwise detect from headers
        # 3. If detecting local (dev) or missing, let IPData detect the machine's public IP
        ip = ip_param.presence || get_client_ip

        # Validation Regex
        ipv4_regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        ipv6_regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
        ipv6_compressed_regex = /^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/

        # If IP is present and not loopback, validate it
        if ip.present? && ip != '127.0.0.1' && ip != '::1' && !(ip =~ ipv4_regex || ip =~ ipv6_regex || ip =~ ipv6_compressed_regex)
          return render json: { error: 'Invalid IP address format' }, status: :bad_request
        end

        # If IP is loopback or private, we call IPData without the IP segment
        # This makes IPData detect the machine's public IP (useful for local dev)
        ip_path = ip.blank? || private_ip?(ip) ? '' : "/#{ip}"

        # Handle private/loopback IPs locally to avoid external API failure
        # REMOVED MOCK - Let IPData detect the public IP instead

        api_key = ENV['IPDATA_API_KEY']
        return render json: { error: 'IPDATA_API_KEY not configured' }, status: :internal_server_error if api_key.blank?

        requested_fields = %w[
          ip is_eu city region region_code country_name country_code
          continent_name continent_code latitude longitude postal
          calling_code flag emoji_flag emoji_unicode asn company
          carrier timezone currency threat usage_type languages count
        ].join(',')

        response = HTTParty.get(
          "https://api.ipdata.co#{ip_path}?api-key=#{api_key}&fields=#{requested_fields}",
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
          data['asn_details'] = asn_resp.parsed_response if asn_resp.success?
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
          'ISP_Fraud_Score' => if data.dig('threat', 'scores').present?
                                 scores = data['threat']['scores'].values
                                 (scores.sum.to_f / scores.length).floor if scores.any?
                               end,
          'proxy_type' => get_proxy_type(data['threat']),
          'connection_type' => data['usage_type'] || data.dig('asn', 'type') || data.dig('company', 'type')
        )

        render json: enhanced_result
      rescue StandardError => e
        Rails.logger.error("IP Checker Error: #{e.message}")
        render json: { error: "Internal server error: #{e.message}" }, status: :internal_server_error
      end

      def get_client_ip
        # In development, prioritize common public-facing headers if they exist
        # This helps when using ngrok or similar tunnels
        request.headers['CF-Connecting-IP'] ||
          request.headers['X-Forwarded-For']&.split(',')&.first&.strip ||
          request.headers['X-Real-IP'] ||
          request.headers['X-Client-IP'] ||
          request.headers['True-Client-IP'] ||
          request.headers['Fastly-Client-IP'] ||
          request.remote_ip
      end

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
      end

      def ensure_env_loaded
        return if ENV['IPDATA_API_KEY'].present?

        # Fallback for dev environments where server might have been started before .env was populated
        Dotenv.load('.env') if defined?(Dotenv)
      end

      def private_ip?(ip)
        addr = IPAddr.new(ip)
        addr.private? || addr.loopback?
      rescue StandardError
        false
      end
    end
  end
end

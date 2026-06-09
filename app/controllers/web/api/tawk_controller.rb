# frozen_string_literal: true

module Web
  module Api
    class TawkController < BaseController
      before_action :authenticate_actor!

      def secure_hash
        unless ENV['TAWK_API_KEY'].present?
          return render json: { error: 'Tawk.to API key not configured' }, status: :internal_server_error
        end

        email = current_actor.email
        hash = OpenSSL::HMAC.hexdigest('SHA256', ENV['TAWK_API_KEY'], email)

        render json: {
          hash: hash,
          email: email,
          name: current_actor.try(:name) || current_actor.try(:company_name) || email
        }
      end
    end
  end
end

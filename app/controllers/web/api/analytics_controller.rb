module Web
  module Api
    class AnalyticsController < BaseController
      skip_before_action :authenticate_request, only: [:reddit_capi]

      # POST /web/api/analytics/reddit-capi
      def reddit_capi
        # Log the valid conversion event (stub for now)
        Rails.logger.info "Reddit CAPI Event received: #{params.inspect}"

        # Ideally, this is where you would call the Reddit Conversion API
        # RedditConversionService.new(params).track

        render json: { message: 'Conversion tracked successfully' }, status: :ok
      end
    end
  end
end

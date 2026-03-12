# frozen_string_literal: true

module Web
  module Api
    class AnalyticsController < BaseController
      skip_before_action :authenticate_request, only: [:reddit_capi]

      # POST /web/api/analytics/reddit-capi
      def reddit_capi
        result = RedditConversionService.new(params).track

        if result[:success]
          render json: { message: 'Conversion tracked successfully', reddit: result[:response] }, status: :ok
        else
          render json: { error: 'Failed to track conversion', details: result[:error] }, status: :unprocessable_entity
        end
      end
    end
  end
end

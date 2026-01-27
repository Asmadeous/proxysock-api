# frozen_string_literal: true

module Admin
  module Api
    class AnalyticsController < BaseController
      def dashboard
        # Return summary for date range or last 30 days
        start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today

        summaries = DailyAnalyticsSummary.where(date: start_date..end_date).order(date: :asc)

        render json: {
          metrics: {
            total_revenue: summaries.sum(:total_revenue),
            total_orders: summaries.sum(:total_orders),
            total_visitors: summaries.sum(:total_visitors),
            avg_conversion_rate: summaries.average(:conversion_rate)
          },
          chart_data: summaries.map { |s| { date: s.date, revenue: s.total_revenue, visitors: s.total_visitors } }
        }
      end

      def traffic
        # Aggregate traffic sources
        render json: { sources: UserSession.group(:referrer).count } # simplified
      end

      def products
        # Product performance
        render json: {
          products: ProductAnalytics.where(date: Date.yesterday).includes(:product).map do |p|
            { name: p.product.name, views: p.views, revenue: p.revenue }
          end
        }
      end
    end
  end
end

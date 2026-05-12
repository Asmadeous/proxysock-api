# frozen_string_literal: true

class DailyAnalyticsSummaryWorker < ApplicationJob
  queue_as :low_priority

  def perform(date = Date.yesterday)
    date = date.to_date
    range = date.beginning_of_day..date.end_of_day

    # Aggregate Metrics
    summary = DailyAnalyticsSummary.find_or_initialize_by(date: date)

    # 1. Traffic
    summary.total_visitors = UserSession.where(started_at: range).count
    summary.total_page_views = PageAnalytics.where(date: date).sum(:views)
    summary.traffic_sources = UserSession.where(started_at: range).group(:referrer).count

    # 2. Orders & Revenue
    daily_orders = Order.where(created_at: range, status: 'active') # or paid status
    summary.total_orders = daily_orders.count
    summary.total_revenue = daily_orders.sum(:total_amount)
    summary.avg_order_value = summary.total_orders.positive? ? (summary.total_revenue / summary.total_orders) : 0

    # 3. Conversion Rate
    # Simple conversion: Orders / Visitors
    summary.conversion_rate = summary.total_visitors.positive? ? (summary.total_orders.to_f / summary.total_visitors * 100) : 0

    # 4. Top Products
    summary.top_products = Order.where(created_at: range)
                                .group(:product_id)
                                .order('count_all DESC')
                                .limit(5)
                                .count
                                .transform_keys do |k|
      Product.find(k).name
    rescue StandardError
      'Unknown'
    end

    summary.save!
  end
end

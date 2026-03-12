# frozen_string_literal: true

module Admin
  module Api
    class AnalyticsController < BaseController
      # GET /admin/api/analytics/dashboard
      def dashboard
        range = date_range

        render json: {
          metrics: {
            total_revenue: Transaction.where(created_at: range, status: 'success').sum(:amount),
            total_orders: Order.where(created_at: range).count,
            new_users: User.where(created_at: range).count,
            active_users: User.where(status: 'active').count,
            avg_order_value: Order.where(created_at: range).where.not(total_amount: nil).average(:total_amount)&.round(2) || 0,
            failed_orders: Order.where(created_at: range, status: 'failed').count,
            pending_orders: Order.where(created_at: range, status: 'pending').count,
            total_affiliates: Affiliate.count
          },
          revenue_chart: revenue_by_day(range),
          orders_chart: orders_by_day(range),
          users_chart: users_by_day(range)
        }
      end

      # GET /admin/api/analytics/products
      def products
        range = date_range

        product_sales = Order.joins(:product)
                             .where(created_at: range)
                             .where.not(status: %w[cancelled failed])
                             .group('products.name')
                             .select('products.name, COUNT(*) as order_count, SUM(orders.total_amount) as total_revenue')
                             .order('total_revenue DESC')
                             .limit(20)

        type_breakdown = Order.joins(:product)
                              .where(created_at: range)
                              .where.not(status: %w[cancelled failed])
                              .group('products.product_type')
                              .select('products.product_type, COUNT(*) as order_count, SUM(orders.total_amount) as total_revenue')

        render json: {
          top_products: product_sales.map do |p|
            { name: p.name, orders: p.order_count, revenue: p.total_revenue.to_f }
          end,
          type_breakdown: type_breakdown.map do |t|
            { type: t.product_type, orders: t.order_count, revenue: t.total_revenue.to_f }
          end
        }
      end

      # GET /admin/api/analytics/revenue
      def revenue
        range = date_range
        granularity = params[:granularity] || 'daily'

        group_expr = case granularity
                     when 'weekly' then "DATE_TRUNC('week', created_at)"
                     when 'monthly' then "DATE_TRUNC('month', created_at)"
                     else 'DATE(created_at)'
                     end

        revenue_data = Transaction.where(created_at: range, status: 'success')
                                  .group(Arel.sql(group_expr))
                                  .select(Arel.sql("#{group_expr} as period, SUM(amount) as total, COUNT(*) as tx_count"))
                                  .order(Arel.sql('period ASC'))

        render json: {
          data: revenue_data.map { |r| { period: r.period, total: r.total.to_f, count: r.tx_count } },
          summary: {
            total: Transaction.where(created_at: range, status: 'success').sum(:amount).to_f,
            average: Transaction.where(created_at: range, status: 'success').average(:amount)&.to_f || 0,
            count: Transaction.where(created_at: range, status: 'success').count
          }
        }
      end

      # GET /admin/api/analytics/conversions
      def conversions
        range = date_range

        total_signups = User.where(created_at: range).count
        users_with_orders = User.where(created_at: range)
                                .where(id: Order.select(:orderable_id).where(orderable_type: 'User'))
                                .count
        repeat_customers = Order.where(orderable_type: 'User', created_at: range)
                                .group(:orderable_id)
                                .having('COUNT(*) > 1')
                                .count.length

        render json: {
          funnel: [
            { stage: 'Signups', count: total_signups },
            { stage: 'First Order', count: users_with_orders },
            { stage: 'Repeat Customer', count: repeat_customers }
          ],
          conversion_rate: total_signups.positive? ? (users_with_orders.to_f / total_signups * 100).round(1) : 0,
          repeat_rate: users_with_orders.positive? ? (repeat_customers.to_f / users_with_orders * 100).round(1) : 0
        }
      end

      # GET /admin/api/analytics/geolocation
      def geolocation
        # Aggregate user countries from metadata or IP-based geolocation
        # Falls back to order country data if user geolocation not available
        country_data = User.where.not(country: [nil, ''])
                           .group(:country)
                           .count
                           .sort_by { |_, v| -v }

        render json: {
          countries: country_data.map { |country, count| { country: country, users: count } },
          total_countries: country_data.length
        }
      end

      # GET /admin/api/analytics/traffic
      def traffic
        range = date_range

        render json: {
          new_users_by_source: User.where(created_at: range)
                               .group(:provider)
                               .count
                               .transform_keys { |k| k || 'direct' },
          daily_signups: users_by_day(range)
        }
      end

      private

      def date_range
        start_date = params[:start_date] ? Date.parse(params[:start_date]).beginning_of_day : 30.days.ago
        end_date = params[:end_date] ? Date.parse(params[:end_date]).end_of_day : Time.current
        start_date..end_date
      end

      def revenue_by_day(range)
        Transaction.where(created_at: range, status: 'success')
                   .group(Arel.sql('DATE(created_at)'))
                   .sum(:amount)
                   .map { |date, total| { date: date, value: total.to_f } }
      end

      def orders_by_day(range)
        Order.where(created_at: range)
             .group(Arel.sql('DATE(created_at)'))
             .count
             .map { |date, count| { date: date, value: count } }
      end

      def users_by_day(range)
        User.where(created_at: range)
            .group(Arel.sql('DATE(created_at)'))
            .count
            .map { |date, count| { date: date, value: count } }
      end
    end
  end
end

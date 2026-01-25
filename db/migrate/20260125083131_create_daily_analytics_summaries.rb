class CreateDailyAnalyticsSummaries < ActiveRecord::Migration[8.1]
  def change
    create_table :daily_analytics_summaries do |t|
      t.date :date
      t.integer :total_visitors
      t.integer :total_page_views
      t.integer :total_orders
      t.decimal :total_revenue
      t.decimal :avg_order_value
      t.decimal :conversion_rate
      t.jsonb :top_products
      t.jsonb :traffic_sources

      t.timestamps
    end
    add_index :daily_analytics_summaries, :date
  end
end

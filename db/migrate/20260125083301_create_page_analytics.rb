class CreatePageAnalytics < ActiveRecord::Migration[8.1]
  def change
    create_table :page_analytics do |t|
      t.date :date
      t.string :page_url
      t.integer :views
      t.integer :unique_visitors
      t.decimal :bounce_rate
      t.decimal :avg_time_on_page_seconds
      t.decimal :conversion_rate

      t.timestamps
    end
  end
end

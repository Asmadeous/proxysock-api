# frozen_string_literal: true

class CreateBlogPosts < ActiveRecord::Migration[8.1]
  def change
    create_table :blog_posts do |t|
      t.string  :slug,         null: false
      t.string  :title,        null: false
      t.text    :excerpt,      null: false
      t.text    :content,      null: false
      t.string  :category,     null: false
      t.string  :author,       null: false
      t.string  :read_time
      t.boolean :featured,     null: false, default: false
      t.boolean :published,    null: false, default: false
      t.string  :image_url
      t.jsonb   :tags,         null: false, default: []
      t.datetime :published_at
      t.integer :views_count,  null: false, default: 0
      t.timestamps
    end

    add_index :blog_posts, :slug,      unique: true
    add_index :blog_posts, :category
    add_index :blog_posts, :published
    add_index :blog_posts, :featured
    add_index :blog_posts, :published_at
  end
end

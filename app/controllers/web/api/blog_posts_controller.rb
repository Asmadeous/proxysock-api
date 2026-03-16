# frozen_string_literal: true

module Web
  module Api
    class BlogPostsController < ApplicationController
      # GET /web/api/blog_posts
      def index
        posts = BlogPost.published.recent
        posts = posts.by_category(params[:category]) if params[:category].present?
        posts = posts.where('title ILIKE :q OR excerpt ILIKE :q', q: "%#{params[:q]}%") if params[:q].present?
        posts = posts.where(featured: true) if params[:featured] == 'true'

        category_counts = BlogPost.published.group(:category).count

        categories_data = BlogPost::CATEGORIES.map do |name|
          { name: name, count: category_counts[name] || 0 }
        end

        render json: {
          posts: posts.map(&:as_blog_json),
          total: BlogPost.published.count,
          categories: categories_data
        }
      end

      # GET /web/api/blog_posts/:slug
      def show
        post = BlogPost.published.find_by!(slug: params[:slug])
        post.increment_views!

        render json: post.as_blog_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Post not found' }, status: :not_found
      end
    end
  end
end

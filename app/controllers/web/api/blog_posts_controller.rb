# frozen_string_literal: true

module Web
  module Api
    class BlogPostsController < ApplicationController


      # GET /web/api/blog_posts
      def index
        posts = BlogPost.published.recent
        posts = posts.by_category(params[:category]) if params[:category].present?
        posts = posts.where("title ILIKE :q OR excerpt ILIKE :q", q: "%#{params[:q]}%") if params[:q].present?
        posts = posts.where(featured: true) if params[:featured] == 'true'

        render json: {
          posts: posts.map(&:as_blog_json),
          total: posts.count,
          categories: BlogPost::CATEGORIES
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

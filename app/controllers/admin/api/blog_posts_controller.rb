# frozen_string_literal: true

module Admin
  module Api
    class BlogPostsController < Admin::Api::BaseController
      before_action :set_post, only: %i[show update destroy publish unpublish]

      # GET /admin/api/blog_posts
      def index
        posts = BlogPost.order(created_at: :desc)
                        .page(params[:page]).per(25)
        posts = posts.where(published: params[:published] == 'true') if params[:published].present?
        posts = posts.by_category(params[:category]) if params[:category].present?

        render json: {
          posts: posts.map(&:as_blog_json),
          total: posts.total_count,
          categories: BlogPost::CATEGORIES
        }
      end

      # GET /admin/api/blog_posts/:slug
      def show
        render json: @post.as_blog_json
      end

      # POST /admin/api/blog_posts
      def create
        post = BlogPost.create!(blog_post_params)
        render json: post.as_blog_json, status: :created
      end

      # PATCH /admin/api/blog_posts/:slug
      def update
        @post.update!(blog_post_params)
        render json: @post.as_blog_json
      end

      # DELETE /admin/api/blog_posts/:slug
      def destroy
        @post.destroy!
        render json: { message: 'Post deleted' }
      end

      # PATCH /admin/api/blog_posts/:slug/publish
      def publish
        @post.update!(published: true, published_at: Time.current)
        render json: { message: 'Post published', slug: @post.slug }
      end

      # PATCH /admin/api/blog_posts/:slug/unpublish
      def unpublish
        @post.update!(published: false)
        render json: { message: 'Post unpublished', slug: @post.slug }
      end

      private

      def set_post
        @post = BlogPost.find_by!(slug: params[:slug])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Post not found' }, status: :not_found
      end

      def blog_post_params
        # Handle both flat and wrapped (Rails style) parameters
        data = params.key?(:blog_post) ? params.require(:blog_post) : params
        data.permit(:slug, :title, :excerpt, :content, :category, :author,
                    :read_time, :featured, :published, :image_url,
                    :published_at, tags: [])
      end
    end
  end
end

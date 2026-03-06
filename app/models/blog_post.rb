# frozen_string_literal: true

class BlogPost < ApplicationRecord
  CATEGORIES = %w[Proxies RDP VPS eSIM VPN Tutorials News].freeze

  validates :slug,     presence: true, uniqueness: true
  validates :title,    presence: true
  validates :excerpt,  presence: true
  validates :content,  presence: true
  validates :category, inclusion: { in: CATEGORIES }
  validates :author,   presence: true

  scope :published,    -> { where(published: true) }
  scope :featured,     -> { where(featured: true) }
  scope :recent,       -> { order(published_at: :desc, created_at: :desc) }
  scope :by_category,  ->(c) { where(category: c) }

  before_validation :generate_slug, on: :create, if: -> { slug.blank? }
  before_create     :set_published_at

  def increment_views!
    increment!(:views_count)
  end

  # Serialised format matching the existing TypeScript Post interface
  def as_blog_json
    {
      id: slug,
      title: title,
      excerpt: excerpt,
      category: category,
      author: author,
      date: published_at&.strftime('%Y-%m-%d') || created_at.strftime('%Y-%m-%d'),
      readTime: read_time,
      featured: featured,
      tags: tags || [],
      content: content,
      imageUrl: image_url
    }
  end

  private

  def generate_slug
    base = title.downcase.gsub(/[^a-z0-9\s-]/, '').gsub(/\s+/, '-').squeeze('-').strip
    self.slug = base

    # Handle uniqueness
    counter = 1
    while BlogPost.exists?(slug: slug)
      self.slug = "#{base}-#{counter}"
      counter += 1
    end
  end

  def set_published_at
    self.published_at ||= Time.current if published?
  end
end

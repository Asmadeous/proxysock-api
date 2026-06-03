# frozen_string_literal: true

class ResourceAlert < ApplicationRecord
  RESOURCE_TYPES = %w[proxmox_server vm container].freeze
  METRICS = %w[cpu memory disk storage].freeze
  STATUSES = %w[firing resolved].freeze
  RECIPIENT_TYPES = %w[admin user reseller].freeze

  validates :resource_type, presence: true, inclusion: { in: RESOURCE_TYPES }
  validates :metric, presence: true, inclusion: { in: METRICS }
  validates :value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :threshold, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :firing, -> { where(status: 'firing') }
  scope :resolved, -> { where(status: 'resolved') }
  scope :for_resource, ->(type, id) { where(resource_type: type, resource_id: id) }
  scope :for_metric, ->(metric) { where(metric: metric) }
  scope :recent, -> { order(created_at: :desc) }

  def firing?
    status == 'firing'
  end

  def resolved?
    status == 'resolved'
  end

  def resolve!
    update!(status: 'resolved', resolved_at: Time.current)
  end

  # Check if we should suppress this alert (cooldown period)
  # Returns true if an alert for this resource+metric was already sent within the cooldown window
  def self.in_cooldown?(resource_type, resource_id, metric, cooldown_hours: 4)
    where(resource_type: resource_type, resource_id: resource_id, metric: metric)
      .where('notified_at > ?', cooldown_hours.hours.ago)
      .exists?
  end

  # Find or create a firing alert for a resource+metric combo
  def self.find_or_create_firing(resource_type:, resource_id:, metric:, value:, threshold: 90.0, resource_name: nil)
    existing = firing.find_by(resource_type: resource_type, resource_id: resource_id, metric: metric)

    if existing
      # Update the value on the existing firing alert
      existing.update!(value: value)
      existing
    else
      create!(
        resource_type: resource_type,
        resource_id: resource_id,
        metric: metric,
        value: value,
        threshold: threshold,
        resource_name: resource_name,
        status: 'firing'
      )
    end
  end
end

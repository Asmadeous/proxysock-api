# frozen_string_literal: true

module Api
  module V1
    class NotificationsController < BaseController
      def index
        notifications = Notification.where(recipient: current_reseller).recent.limit(50)
        render json: { notifications: notifications, unread_count: notifications.select { |n| n.read_at.nil? }.count }
      end

      def mark_as_read
        Notification.where(recipient: current_reseller, read_at: nil).update_all(read_at: Time.current)
        NotificationChannel.broadcast_to(current_reseller, action: 'notifications_read_all')
        render json: { success: true }
      end
    end
  end
end

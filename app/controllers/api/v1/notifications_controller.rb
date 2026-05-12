# frozen_string_literal: true

module Api
  module V1
    class NotificationsController < BaseController
      def index
        notifications = Notification.where(recipient: current_reseller).recent.limit(50)
        render json: {
          notifications: notifications,
          unread_count: Notification.where(recipient: current_reseller, read_at: nil).count
        }
      end

      def show
        notification = Notification.where(recipient: current_reseller).find(params[:id])
        render json: notification
      end

      def mark_as_read
        Notification.where(recipient: current_reseller, read_at: nil).update_all(read_at: Time.current)
        NotificationChannel.broadcast_to(current_reseller, action: 'notifications_read_all')
        render json: { success: true }
      end

      def read_all
        mark_as_read
      end

      def read
        notification = Notification.where(recipient: current_reseller).find(params[:id])
        notification.mark_as_read!
        NotificationChannel.broadcast_to(current_reseller, action: 'notification_read', id: notification.id)
        render json: { success: true, notification: notification }
      end

      def unread_count
        count = Notification.where(recipient: current_reseller, read_at: nil).count
        render json: { unread_count: count }
      end
    end
  end
end

# frozen_string_literal: true

module Web
  module Api
<<<<<<< HEAD
    class NotificationsController < ApplicationController
      include JwtAuthenticated
      before_action :authenticate_request
      before_action :set_notification, only: [:show, :read]

      # GET /web/api/notifications
      def index
        @notifications = current_user.notifications
                                      .recent
                                      .page(params[:page])
                                      .per(params[:per_page] || 20)

        render json: {
          notifications: @notifications.map { |n| serialize_notification(n) },
          meta: {
            current_page: @notifications.current_page,
            total_pages: @notifications.total_pages,
            total_count: @notifications.total_count
=======
    class NotificationsController < BaseController
      def index
        notifications = Notification.where(recipient: current_user).recent.page(params[:page]).per(50)
        render json: { 
          notifications: notifications, 
          unread_count: Notification.where(recipient: current_user, read_at: nil).count,
          meta: {
            current_page: notifications.current_page,
            total_pages: notifications.total_pages,
            total_count: notifications.total_count
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          }
        }
      end

<<<<<<< HEAD
      # GET /web/api/notifications/:id
      def show
        render json: { notification: serialize_notification(@notification) }
      end

      # GET /web/api/notifications/unread_count
      def unread_count
        count = current_user.notifications.unread.count
        render json: { unread_count: count }
      end

      # PUT /web/api/notifications/:id/read
      def read
        @notification.mark_as_read!
        render json: { notification: serialize_notification(@notification) }
      end

      # PUT /web/api/notifications/read_all
      def read_all
        current_user.notifications.unread.update_all(read_at: Time.current)
        render json: { message: 'All notifications marked as read' }
      end

      private

      def set_notification
        @notification = current_user.notifications.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Notification not found' }, status: :not_found
      end

      def serialize_notification(notification)
        {
          id: notification.id,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          read: notification.read_at.present?,
          read_at: notification.read_at,
          created_at: notification.created_at
        }
=======
      def mark_as_read
        Notification.where(recipient: current_user, read_at: nil).update_all(read_at: Time.current)
        render json: { success: true }
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      end
    end
  end
end

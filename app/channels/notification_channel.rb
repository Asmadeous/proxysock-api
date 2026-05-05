# frozen_string_literal: true

class NotificationChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_for current_user
    elsif current_reseller
      stream_for current_reseller
    elsif current_employee
      stream_for current_employee
    else
      reject
    end
  end

  def unsubscribed
    # Any custom cleanup logic can go here.
    # Note: ActionCable automatically handles stop_all_streams on unsubscribe.
  end
end

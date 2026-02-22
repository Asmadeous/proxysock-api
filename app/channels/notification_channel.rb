class NotificationChannel < ApplicationCable::Channel
  def subscribed
    # The current connection identifier defines the recipient
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
    stop_all_streams
  end
end

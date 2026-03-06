# frozen_string_literal: true

class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_from "user_#{current_user.id}"
    elsif current_reseller
      stream_from "reseller_#{current_reseller.id}"
    elsif current_employee
      stream_from "employee_#{current_employee.id}"
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end

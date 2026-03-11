# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def confirmation_email(user)
    @user = user
    @confirmation_url = "#{ENV.fetch('APP_URL', 'http://localhost:3000')}/web/api/auth/confirm_email?token=#{@user.email_confirmation_token}"
    mail(to: @user.email, subject: 'Confirm your ProxySock Account')
  end

  def password_reset_email(user)
    @user = user
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3001')}/reset-password?token=#{@user.password_reset_token}"
    mail(to: @user.email, subject: 'Reset your ProxySock Password')
  end
end

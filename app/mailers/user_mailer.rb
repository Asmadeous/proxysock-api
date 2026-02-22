# frozen_string_literal: true

class UserMailer < ApplicationMailer
  default from: 'noreply@proxysock.com'

  def confirmation_email(user)
    @user = user
    @confirmation_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3001')}/auth/callback?type=email_confirmation&token=#{user.email_confirmation_token}"
    mail(to: @user.email, subject: 'Confirm your ProxySock account')
  end

  def password_reset_email(user)
    @user = user
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3001')}/reset-password?token=#{user.password_reset_token}"
    mail(to: @user.email, subject: 'Reset your ProxySock password')
  end

  def welcome_email(user)
    @user = user
    mail(to: @user.email, subject: 'Welcome to ProxySock!')
  end
end

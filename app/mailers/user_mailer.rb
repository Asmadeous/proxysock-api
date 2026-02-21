<<<<<<< HEAD
class UserMailer < ApplicationMailer
  default from: 'notifications@proxysock.com'

  def verification_email(user, token)
    @user = user
    @token = token
    @url = "http://localhost:5173/verify-email?token=#{@token}"
    mail(to: @user.email, subject: 'Verify your ProxySock account')
  end

  def password_reset_email(user, token)
    @user = user
    @token = token
    @url = "http://localhost:5173/reset-password?token=#{@token}"
    mail(to: @user.email, subject: 'Reset your ProxySock password')
  end
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
end

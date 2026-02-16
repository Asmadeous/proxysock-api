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
end

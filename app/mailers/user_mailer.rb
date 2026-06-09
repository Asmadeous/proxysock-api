# frozen_string_literal: true

class UserMailer < ApplicationMailer
  def confirmation_email(account)
    @user = account
    @account_type = account.is_a?(Reseller) ? 'reseller' : 'user'
    @name = account.is_a?(Reseller) ? (account.company_name || account.username) : account.first_name

    @confirmation_url = "#{ENV.fetch('APP_URL', 'http://localhost:3000')}/web/api/auth/confirm_email?token=#{account.email_confirmation_token}"

    mail(to: account.email, subject: 'Confirm your ProxySock account')
  end

  def reseller_welcome_email(reseller, plain_password)
    @user = reseller
    @name = reseller.company_name || reseller.username
    @password = plain_password
    @confirmation_url = "#{ENV.fetch('APP_URL', 'http://localhost:3000')}/web/api/auth/confirm_email?token=#{reseller.email_confirmation_token}"
    @login_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3001')}/reseller/login"
    @swagger_url = "#{ENV.fetch('APP_URL', 'http://localhost:3000')}/api-docs"

    mail(to: reseller.email, subject: 'Welcome to ProxySock - Reseller Account Created')
  end

  def password_reset_email(account)
    @user = account
    @name = account.is_a?(Reseller) ? (account.company_name || account.username) : account.first_name

    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3001')}/reset-password?token=#{account.password_reset_token}"

    mail(to: account.email, subject: 'Reset your ProxySock password')
  end

  def unlock_account_email(account)
    @user = account
    @name = account.is_a?(Reseller) ? (account.company_name || account.username) : account.first_name

    @unlock_url = "#{ENV.fetch('APP_URL', 'http://localhost:3000')}/web/api/auth/unlock_account?token=#{account.unlock_token}"

    mail(to: account.email, subject: 'Your ProxySock account has been locked')
  end
end

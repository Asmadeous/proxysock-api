# frozen_string_literal: true

class ResellerMailer < ApplicationMailer
  def welcome_email
    @reseller = params[:reseller]
    @credentials = params[:credentials]

    mail(to: @reseller.email, subject: 'Welcome to ProxySock - Your API Credentials')
  end
end

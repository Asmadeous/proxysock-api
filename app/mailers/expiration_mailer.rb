# frozen_string_literal: true

class ExpirationMailer < ApplicationMailer
  def warning_email
    @resource = params[:resource]
    @order = params[:order]
    @owner = params[:owner]
    @hours = params[:hours]
    @title = "#{@resource.class.name.titleize} Expiring Soon"

    mail(
      to: @owner.email,
      subject: "⚠️ Action Required: Your #{@resource.class.name.titleize} expires in #{@hours} hours"
    )
  end
end

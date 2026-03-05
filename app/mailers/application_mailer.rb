# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: 'noreply@proxysock-api.com'
  layout 'mailer'
end

# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  # Preview this email at http://localhost:3000/rails/mailers/user_mailer/verification_email
  def verification_email
    UserMailer.verification_email
  end

  # Preview this email at http://localhost:3000/rails/mailers/user_mailer/password_reset_email
  def password_reset_email
    UserMailer.password_reset_email
  end
end

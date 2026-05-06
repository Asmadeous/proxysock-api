# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserMailer, type: :mailer do
  let(:user) { User.create!(username: 'testuser', email: 'test@example.com', first_name: 'Test', last_name: 'User', password: 'password123', country_code: 'US', city: 'New York') }

  describe 'confirmation_email' do
    let(:mail) { UserMailer.confirmation_email(user) }

    it 'renders the headers' do
      expect(mail.subject).to eq('Confirm your ProxySock account')
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(['support@proxysock.com'])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match('Thanks for signing up for ProxySock!')
    end
  end

  describe 'password_reset_email' do
    let(:mail) { UserMailer.password_reset_email(user) }

    it 'renders the headers' do
      expect(mail.subject).to eq('Reset your ProxySock password')
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(['support@proxysock.com'])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match('We received a request to reset your ProxySock password.')
    end
  end
end

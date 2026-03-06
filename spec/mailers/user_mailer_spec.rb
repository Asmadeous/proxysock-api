# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserMailer, type: :mailer do
  describe 'verification_email' do
    let(:mail) { UserMailer.verification_email }

    it 'renders the headers' do
      expect(mail.subject).to eq('Verification email')
      expect(mail.to).to eq(['to@example.org'])
      expect(mail.from).to eq(['from@example.com'])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match('Hi')
    end
  end

  describe 'password_reset_email' do
    let(:mail) { UserMailer.password_reset_email }

    it 'renders the headers' do
      expect(mail.subject).to eq('Password reset email')
      expect(mail.to).to eq(['to@example.org'])
      expect(mail.from).to eq(['from@example.com'])
    end

    it 'renders the body' do
      expect(mail.body.encoded).to match('Hi')
    end
  end
end

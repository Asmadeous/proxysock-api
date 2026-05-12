# frozen_string_literal: true

require_relative '../config/environment'

user = User.find('4f5c3d5a-b045-44d0-ae1e-d40103314336')
user.update!(jellyfin_account_created: true)
user.metadata ||= {}
user.metadata['jellyfin_password'] = 'TEST_PASSWORD_123'
user.save!

vm = Vm.last
puts "Sending test email to #{user.email}..."
VmMailer.with(owner: user, vm: vm).credentials_email.deliver_now
puts 'DONE.'

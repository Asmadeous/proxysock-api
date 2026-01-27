# frozen_string_literal: true

require 'test_helper'


class ProxySyncJobTest < ActiveJob::TestCase
  test 'performs sync' do
    ProxySyncService.any_instance.expects(:sync_all)
    ProxySyncJob.perform_now
  end
end

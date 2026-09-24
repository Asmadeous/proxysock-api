# frozen_string_literal: true

require 'test_helper'

class MeisimCatalogSyncJobTest < ActiveJob::TestCase
  test 'runs the catalog sync' do
    MeisimCatalogSyncService.any_instance.expects(:sync!).once

    MeisimCatalogSyncJob.perform_now
  end

  test 'is scheduled daily' do
    entry = YAML.load_file(Rails.root.join('config/schedule.yml')).fetch('meisim_catalog_sync')

    assert_equal 'MeisimCatalogSyncJob', entry['class']
    assert_equal '30 4 * * *', entry['cron']
  end
end

# frozen_string_literal: true

require 'test_helper'

class MeisimCatalogSyncJobTest < ActiveJob::TestCase
  test 'runs the catalog sync' do
    MeisimCatalogSyncService.any_instance.expects(:sync!).once

    MeisimCatalogSyncJob.perform_now
  end

  test 'is scheduled hourly' do
    entry = YAML.load_file(Rails.root.join('config/schedule.yml')).fetch('meisim_catalog_sync')

    assert_equal 'MeisimCatalogSyncJob', entry['class']
    assert_equal '15 * * * *', entry['cron']
  end

  test 'forces the product list and show caches to rebuild' do
    MeisimCatalogSyncService.any_instance.stubs(:sync!)
    product = Product.first || flunk('needs a product fixture')
    list_version = Product.catalog_cache_version
    show_version = product.cache_version

    MeisimCatalogSyncJob.perform_now

    assert_not_equal list_version, Product.catalog_cache_version
    assert_not_equal show_version, product.cache_version
  end

  test 'clears the caches even when MeiSIM is unreachable' do
    MeisimCatalogSyncService.any_instance.stubs(:sync!).raises(MeisimService::Error.new('timeout'))
    version = Product.catalog_cache_version

    assert_raises(MeisimService::Error) { MeisimCatalogSyncJob.perform_now }
    assert_not_equal version, Product.catalog_cache_version
  end
end

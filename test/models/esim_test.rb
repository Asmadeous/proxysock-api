# frozen_string_literal: true

require 'test_helper'

class EsimTest < ActiveSupport::TestCase
  test 'reads a fixed allowance as bytes and leaves the rest alone' do
    assert_equal 1.gigabyte, Esim.data_bytes('1', 'GB')
    assert_equal 1000.megabytes, Esim.data_bytes('1000 MB')
    assert_equal (1.95 * 1.gigabyte).round, Esim.data_bytes('1.95 GB')
    assert_nil Esim.data_bytes('Unlimited')
    assert_nil Esim.data_bytes('8GB UK · 8GB roaming')
    assert_nil Esim.data_bytes(nil)
  end

  test 'builds the one-tap install links from the activation code' do
    esim = Esim.new(activation_code: 'LPA:1$smdp.example.com$ABC')

    assert_equal 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=LPA%3A1%24smdp.example.com%24ABC',
                 esim.install_links['ios']
    assert_match(%r{\Ahttps://esimsetup\.android\.com/}, esim.install_links['android'])
    assert_empty Esim.new(activation_code: nil).install_links
  end

  test 'shows the recorded allowance when the plan has no wording' do
    assert_equal '1 GB', Esim.new(data_total_bytes: 1.gigabyte).data_label
    assert_equal '1.5 GB', Esim.new(data_total_bytes: 1.5.gigabytes).data_label
    assert_nil Esim.new.data_label
  end
end

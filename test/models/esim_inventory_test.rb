# frozen_string_literal: true

require 'test_helper'

class EsimInventoryTest < ActiveSupport::TestCase
  # ──────────────────────────────────────────────────────────────
  # moq_for
  # ──────────────────────────────────────────────────────────────
  test 'moq_for lyca returns 1' do
    assert_equal 1, EsimInventory.moq_for('lyca')
  end

  test 'moq_for non-lyca provider returns 5' do
    assert_equal 5, EsimInventory.moq_for('lebara')
    assert_equal 5, EsimInventory.moq_for('colt')
  end

  # ──────────────────────────────────────────────────────────────
  # customer_accessible?
  # ──────────────────────────────────────────────────────────────
  test 'lyca is customer accessible' do
    assert EsimInventory.customer_accessible?('lyca')
  end

  test 'non-lyca providers are not customer accessible' do
    assert_not EsimInventory.customer_accessible?('lebara')
    assert_not EsimInventory.customer_accessible?('colt')
  end

  # ──────────────────────────────────────────────────────────────
  # esim_type validation
  # ──────────────────────────────────────────────────────────────
  test 'invalid esim_type fails validation' do
    inv = EsimInventory.new(
      provider: 'lyca', iccid: 'TEST999', esim_type: 'invalid_type',
      activation_code: 'LPA:1$test', status: 'available'
    )
    assert_not inv.valid?
    assert_includes inv.errors[:esim_type], 'is not included in the list'
  end

  test 'valid esim_type passes validation' do
    %w[data_only voice_data_sms].each do |type|
      inv = EsimInventory.new(
        provider: 'lyca', iccid: "TEST#{type}", esim_type: type,
        activation_code: 'LPA:1$test', status: 'available'
      )
      assert inv.valid?, "Expected #{type} to be valid: #{inv.errors.full_messages}"
    end
  end

  # ──────────────────────────────────────────────────────────────
  # scopes
  # ──────────────────────────────────────────────────────────────
  test 'voice_data_sms scope only returns voice type' do
    voice = EsimInventory.voice_data_sms
    assert(voice.all? { |i| i.esim_type == 'voice_data_sms' })
  end

  test 'data_only scope only returns data type' do
    data = EsimInventory.data_only
    assert(data.all? { |i| i.esim_type == 'data_only' })
  end

  # ──────────────────────────────────────────────────────────────
  # instance helpers
  # ──────────────────────────────────────────────────────────────
  test 'voice_data_sms? returns true for voice type' do
    inv = EsimInventory.new(esim_type: 'voice_data_sms')
    assert inv.voice_data_sms?
  end

  test 'voice_data_sms? returns false for data_only type' do
    inv = EsimInventory.new(esim_type: 'data_only')
    assert_not inv.voice_data_sms?
  end
end

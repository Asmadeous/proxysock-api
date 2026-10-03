# frozen_string_literal: true

require 'test_helper'

class MeisimVerifyPollJobTest < ActiveJob::TestCase
  setup do
    @employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                 role: 'admin', active: true, department: departments(:one))
    user = create_user_with_balance(0)
    product = Product.create!(name: 'World 1 GB', product_type: 'esim', provider: 'meisim', provider_product_id: 'mm-1',
                              available_to: 'both', product_category: product_categories(:three))
    pricing = ProductPricing.create!(product: product, currency: 'USD', selling_price: 5, active: true)
    order = Order.create!(orderable: user, product: product, product_pricing: pricing, status: 'active', metadata: {})
    @esim_order = EsimOrder.create!(order: order, provider_order_no: 'mo-1', package_code: 'mm-1', status: 'completed')
    @esim = add_esim('8901', 'b-1')
  end

  def add_esim(iccid, batch_id, submitted_at: 2.minutes.ago)
    @esim_order.esims.create!(esim_provider: 'meisim', iccid: iccid, activation_code: 'LPA:1$X$Y', status: 'active',
                              metadata: { 'verification' => { 'batch_id' => batch_id, 'status' => 'pending',
                                                              'submitted_at' => submitted_at.iso8601,
                                                              'requested_by' => @employee.id } })
  end

  def progress(buckets)
    { 'ok' => true, 'progress' => { 'total' => 1, 'pending' => 0, 'in_progress' => 0 }.merge(buckets) }
  end

  test 'saves the verdict and tells the staff member who asked' do
    MeisimService.any_instance.expects(:esim_verify_batch).with('b-1').returns(progress('used' => 1))

    assert_difference -> { Notification.where(recipient: @employee).count }, 1 do
      MeisimVerifyPollJob.perform_now
    end

    assert_equal 'used', @esim.reload.verification_status
    assert_includes Notification.where(recipient: @employee).last.message, 'Used — already installed'
  end

  test 'a check MeiSIM is still running is left for the next run' do
    MeisimService.any_instance.stubs(:esim_verify_batch).returns(progress('pending' => 1))

    assert_no_difference -> { Notification.count } do
      MeisimVerifyPollJob.perform_now
    end

    assert_equal 'pending', @esim.reload.verification_status
  end

  test 'gives up after 24 hours, even while MeiSIM keeps failing, so the eSIM can be verified again' do
    @esim.update_verification!('submitted_at' => 25.hours.ago.iso8601)
    MeisimService.any_instance.stubs(:esim_verify_batch).raises(MeisimService::Error.new('boom', status: 503))

    MeisimVerifyPollJob.perform_now

    assert_equal 'timed_out', @esim.reload.verification_status
    assert_equal 'warning', Notification.where(recipient: @employee).last.category
    assert_empty Esim.verification_pending
  end

  test 'one failing check does not stop the others' do
    other = add_esim('8902', 'b-2')
    MeisimService.any_instance.stubs(:esim_verify_batch).with('b-1').raises(MeisimService::Error.new('boom'))
    MeisimService.any_instance.stubs(:esim_verify_batch).with('b-2').returns(progress('available' => 1))

    MeisimVerifyPollJob.perform_now

    assert_equal 'pending', @esim.reload.verification_status
    assert_equal 'available', other.reload.verification_status
  end

  test 'checks submitted before status was saved still count as pending' do
    @esim.update!(metadata: { 'verification' => { 'batch_id' => 'b-1', 'submitted_at' => 1.minute.ago.iso8601 } })

    assert_includes Esim.verification_pending, @esim
  end

  test 'runs every five minutes' do
    entry = YAML.load_file(Rails.root.join('config/schedule.yml')).fetch('meisim_verify_poll')

    assert_equal 'MeisimVerifyPollJob', entry['class']
    assert_equal '*/5 * * * *', entry['cron']
  end
end

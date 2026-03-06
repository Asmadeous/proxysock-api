require 'test_helper'

class NotificationServiceTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @notification = Notification.new(recipient: @user, title: 'Test', message: 'Content', category: 'info')
  end

  test 'should create notification and broadcast' do
    assert_difference 'Notification.count', 1 do
      NotificationService.notify(
        recipient: @user,
        category: 'success',
        title: 'Order Done',
        message: 'Order 123 completed.'
      )
    end

    assert_difference 'Notification.count', 1 do
      NotificationService.notify(
        recipient: @user,
        category: 'success',
        title: 'Order Done',
        message: 'Order 123 completed.'
      )
    end
  end

  test 'should notify employees on system alert' do
    employee = employees(:one)
    
    assert_difference 'Notification.count', 1 do
      NotificationService.notify(
        recipient: employee,
        category: 'system_alert',
        title: 'Alert',
        message: 'Something broke'
      )
    end
    
    n = Notification.find_by(category: 'system_alert', recipient: employee)
    assert_not_nil n
    assert_equal 'system_alert', n.category
    assert_equal employee, n.recipient
  end
end

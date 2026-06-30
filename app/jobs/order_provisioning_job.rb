# frozen_string_literal: true

# Background job to handle order provisioning synchronously
# allowing for delays (like IP assignment) without timing out web requests.
class OrderProvisioningJob < ApplicationJob
  queue_as :default

  def perform(order_id, actor_id, actor_type = 'Reseller', skip_payment: false)
    order = Order.find(order_id)
    actor = actor_type.constantize.find(actor_id)

    service = OrderProvisioningService.new(order, actor)
    # skip_payment: the balance was already debited at checkout (e.g. wallet cart
    # checkout), so provisioning here must NOT deduct again.
    skip_payment ? service.process_without_deduction! : service.process!
  rescue StandardError => e
    Rails.logger.error("OrderProvisioningJob failed for order #{order_id}: #{e.message}")
    # Error handling is inside OrderProvisioningService#handle_failure
  end
end

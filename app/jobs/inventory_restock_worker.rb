class InventoryRestockWorker < ApplicationJob
  queue_as :maintenance

  def perform
    Rails.logger.info "Checking Inventory Levels..."
    
    # Check eSIM Inventory
    check_esim_inventory
    
    # Check VM capacity if applicable (Proxmox node stats?)
    # check_vm_capacity
  end
  
  private
  
  def check_esim_inventory
    # Alert if Lyca/Colt stock is low
    ['lyca', 'colt'].each do |provider|
      count = EsimInventory.where(provider: provider, status: 'available').count
      threshold = 10 # Configurable
      
      if count < threshold
        Rails.logger.warn "LOW STOCK ALERT: #{provider} eSIM inventory is at #{count} (Threshold: #{threshold})"
        # AdminMailer.low_stock_alert(provider, count).deliver_later
      end
    end
  end
end

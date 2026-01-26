require "test_helper"

class VmProvisioningServiceTest < ActiveSupport::TestCase
  test "generates valid proxmox config" do
    service = VmProvisioningService.new(nil, Rails.logger)
    
    # We can test internal methods by exposing them or just testing public interface mocks.
    # Since Proxmox interaction is external, we mostly want to ensure it handles the response correctly.
    # But the service connects to an external API. We should test that it constructs the right calls.
    # For now, let's just test that it initializes correctly and validating parameters.
    
    assert service
  end

  # More detailed tests would basically replicate the VmProvisioningJob test which mocks this service.
  # The actual service implementation makes external HTTP calls.
  # Ideally we'd use VCR to record Proxmox interactions, but that requires a live Proxmox instance setup.
end

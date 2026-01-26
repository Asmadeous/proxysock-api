require "test_helper"

class ProxySyncJobTest < ActiveJob::TestCase
  test "performs sync" do
    # Mock the service
    mock_service = Minitest::Mock.new
    mock_service.expect :sync!, true
    
    ProxySyncService.stub :new, mock_service do
      perform_enqueued_jobs do
        ProxySyncJob.perform_later
      end
    end
    
    mock_service.verify
  end
end

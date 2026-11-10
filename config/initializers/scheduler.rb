# frozen_string_literal: true

# Start the scheduler in a Sidekiq initialization hook
Sidekiq.configure_server do |config|
  config.on(:startup) do
    # Load the schedule. The bang version also deletes cron jobs that were
    # removed from schedule.yml, so they don't keep firing for deleted classes.
    schedule_file = 'config/schedule.yml'
    Sidekiq::Cron::Job.load_from_hash! YAML.load_file(schedule_file) if File.exist?(schedule_file)
  end
end

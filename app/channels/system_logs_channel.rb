# frozen_string_literal: true

class SystemLogsChannel < ApplicationCable::Channel
  def subscribed
    @source = params[:source] || "rails"
    stream_from "system_logs_#{@source}"

    @log_file = determine_log_file(@source)
    return unless @log_file && File.exist?(@log_file)

    # Security check: Ensure log_file is within the log directory and is an allowed file
    allowed_files = ["sidekiq.log", "#{Rails.env}.log", "#{Rails.env}.web.log", "#{Rails.env}.job.log"]
    return unless allowed_files.include?(@log_file.basename.to_s) && @log_file.to_s.start_with?(Rails.root.join("log").to_s)

    @stop_streaming = false
    @thread = Thread.new do
      last_pos = File.size(@log_file)

      while !@stop_streaming
        sleep 1
        next unless File.exist?(@log_file)

        current_size = File.size(@log_file)
        last_pos = 0 if current_size < last_pos # Handle log rotation

        next if current_size <= last_pos

        begin
          File.open(@log_file) do |f|
            f.seek(last_pos)
            new_content = f.read
            @last_pos = f.pos # Use instance var to keep track across loops if needed

            next if new_content.blank?

            # Convert raw lines to the format expected by the frontend
            lines = new_content.split("\n").reject(&:blank?).map do |line|
              {
                id: SecureRandom.uuid,
                text: line,
                severity: determine_severity(line)
              }
            end

            ActionCable.server.broadcast("system_logs_#{@source}", { lines: lines })
            last_pos = @last_pos
          end
        rescue StandardError => e
          Rails.logger.error("[SystemLogsChannel] Error reading log file: #{e.message}")
          sleep 2
        end
      end
    end
  end

  def unsubscribed
    @stop_streaming = true
    @thread&.kill
  end

  private

  def determine_log_file(source)
    if source == "sidekiq"
      Rails.root.join("log", "sidekiq.log")
    else
      role_log = Rails.root.join("log", "#{Rails.env}.web.log")
      File.exist?(role_log) ? role_log : Rails.root.join("log", "#{Rails.env}.log")
    end
  end

  def determine_severity(line)
    case line
    when /ERROR|FATAL|exception|failed/i then "error"
    when /WARN/i then "warn"
    when /DEBUG/i then "info"
    when /Started (GET|POST|PUT|PATCH|DELETE)/ then "request"
    when /Completed \d+ \w+/ then "response"
    else "info"
    end
  end
end

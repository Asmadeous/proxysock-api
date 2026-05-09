# frozen_string_literal: true

class SystemLogsChannel < ApplicationCable::Channel
  def subscribed
    @source = params[:source].to_s
    stream_from "system_logs_#{@source}"

    # Security: Use an explicit case statement with literal strings to satisfy Brakeman
    source_key = @source.to_s.downcase.strip
    @log_file = case source_key
                when 'sidekiq'
                  # Try role-specific log, then standard sidekiq.log, then fallback to environment log
                  role_log = Rails.root.join('log', "#{Rails.env}.sidekiq.log")
                  if File.exist?(role_log)
                    role_log
                  else
                    std_log = Rails.root.join('log', 'sidekiq.log')
                    File.exist?(std_log) ? std_log : Rails.root.join('log', "#{Rails.env}.log")
                  end
                when 'web'
                  role_log = Rails.root.join('log', "#{Rails.env}.web.log")
                  File.exist?(role_log) ? role_log : Rails.root.join('log', "#{Rails.env}.log")
                else
                  # Default to environment log
                  Rails.root.join('log', "#{Rails.env}.log")
                end

    return unless File.exist?(@log_file)

    @stop_streaming = false
    @thread = Thread.new do
      last_pos = File.size(@log_file)

      until @stop_streaming
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
              # Force UTF-8 and scrub invalid bytes
              safe_line = line.to_s.force_encoding('UTF-8').scrub
              {
                id: SecureRandom.uuid,
                text: safe_line,
                severity: determine_severity(safe_line)
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

  def determine_severity(line)
    case line
    when /ERROR|FATAL|exception|failed/i then 'error'
    when /WARN/i then 'warn'
    when /DEBUG/i then 'info'
    when /Started (GET|POST|PUT|PATCH|DELETE)/ then 'request'
    when /Completed \d+ \w+/ then 'response'
    else 'info'
    end
  end
end

# frozen_string_literal: true

require 'open3'
require 'sidekiq/api'

module Admin
  module Api
    class MonitoringController < Admin::Api::BaseController
      # GET /admin/api/monitoring/summary_counts
      def summary_counts
        counts = {
          orders: Order.where(status: 'pending').count,
          tickets: Ticket.where(status: 'open').count,
          payouts: AffiliatePayout.where(status: 'pending').count,
          new_users: User.where('created_at >= ?', Time.current.beginning_of_day).count,
          new_resellers: Reseller.where('created_at >= ?', Time.current.beginning_of_day).count,
          support_chats: SupportChat.where(status: 'active').count,
          guest_chats: GuestChat.where(status: 'active').count,
          dead_jobs: (defined?(Sidekiq::DeadSet) ? Sidekiq::DeadSet.new.size : 0)
        }
        render json: counts
      end

      # GET /admin/api/monitoring
      # Returns system metrics for the SuperAdmin monitoring dashboard
      def index
        render json: {
          system: system_metrics,
          application: application_metrics,
          database: database_metrics,
          jobs: job_metrics,
          vms: vm_metrics,
          services: service_statuses,
          redis: redis_details,
          websockets: websocket_health,
          containers: container_info,
          proxmox: proxmox_node_info,
          timestamp: Time.current.iso8601
        }
      end

      # ─── Sidekiq Job Management ───────────────────────────────────

      # GET /admin/api/monitoring/queues
      def queues
        if defined?(Sidekiq::Queue)
          queues = Sidekiq::Queue.all.map do |q|
            { name: q.name, size: q.size, latency: q.latency.round(2) }
          end
          render json: { queues: queues }
        else
          render json: { queues: [], message: 'Sidekiq not available' }
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # GET /admin/api/monitoring/jobs
      def jobs
        queue_name = params[:queue] || 'default'
        page = (params[:page] || 1).to_i
        per = (params[:per] || 25).to_i

        result = { jobs: [], total: 0, queue: queue_name, page: page }

        if defined?(Sidekiq::Queue)
          queue = Sidekiq::Queue.new(queue_name)
          result[:total] = queue.size
          all_jobs = queue.entries
          offset = (page - 1) * per
          result[:jobs] = all_jobs[offset, per]&.map { |j| sidekiq_job_json(j) } || []
        end

        render json: result
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # GET /admin/api/monitoring/retries
      def retries
        page = (params[:page] || 1).to_i
        per = (params[:per] || 25).to_i
        result = { jobs: [], total: 0, page: page }

        if defined?(Sidekiq::RetrySet)
          retry_set = Sidekiq::RetrySet.new
          result[:total] = retry_set.size
          all = retry_set.to_a
          offset = (page - 1) * per
          result[:jobs] = all[offset, per]&.map { |j| sidekiq_sorted_job_json(j) } || []
        end

        render json: result
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # GET /admin/api/monitoring/dead_jobs
      def dead_jobs
        page = (params[:page] || 1).to_i
        per = (params[:per] || 25).to_i
        result = { jobs: [], total: 0, page: page }

        if defined?(Sidekiq::DeadSet)
          dead_set = Sidekiq::DeadSet.new
          result[:total] = dead_set.size
          all = dead_set.to_a
          offset = (page - 1) * per
          result[:jobs] = all[offset, per]&.map { |j| sidekiq_sorted_job_json(j) } || []
        end

        render json: result
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # GET /admin/api/monitoring/scheduled_jobs
      def scheduled_jobs
        page = (params[:page] || 1).to_i
        per = (params[:per] || 25).to_i
        result = { jobs: [], total: 0, page: page }

        if defined?(Sidekiq::ScheduledSet)
          scheduled = Sidekiq::ScheduledSet.new
          result[:total] = scheduled.size
          all = scheduled.to_a
          offset = (page - 1) * per
          result[:jobs] = all[offset, per]&.map { |j| sidekiq_sorted_job_json(j) } || []
        end

        render json: result
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/retry_job
      def retry_job
        jid = params[:jid]
        return render(json: { error: 'jid required' }, status: :bad_request) unless jid

        found = false

        # Search retries
        if defined?(Sidekiq::RetrySet)
          Sidekiq::RetrySet.new.each do |job|
            next unless job.jid == jid

            job.retry
            found = true
            break
          end
        end

        # Search dead set
        if !found && defined?(Sidekiq::DeadSet)
          Sidekiq::DeadSet.new.each do |job|
            next unless job.jid == jid

            job.retry
            found = true
            break
          end
        end

        if found
          render json: { message: "Job #{jid} queued for retry" }
        else
          render json: { error: "Job #{jid} not found in retry or dead sets" }, status: :not_found
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/delete_job
      def delete_job
        jid = params[:jid]
        return render(json: { error: 'jid required' }, status: :bad_request) unless jid

        found = false

        # Search all sets
        [Sidekiq::RetrySet, Sidekiq::DeadSet, Sidekiq::ScheduledSet].each do |klass|
          next unless defined?(klass)

          klass.new.each do |job|
            next unless job.jid == jid

            job.delete
            found = true
            break
          end
          break if found
        end

        # Search queues
        unless found
          Sidekiq::Queue.all.each do |queue|
            queue.each do |job|
              next unless job.jid == jid

              job.delete
              found = true
              break
            end
            break if found
          end
        end

        if found
          render json: { message: "Job #{jid} deleted" }
        else
          render json: { error: "Job #{jid} not found" }, status: :not_found
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/clear_queue
      def clear_queue
        queue_name = params[:queue]
        return render(json: { error: 'queue name required' }, status: :bad_request) unless queue_name

        if defined?(Sidekiq::Queue)
          q = Sidekiq::Queue.new(queue_name)
          size = q.size
          q.clear
          render json: { message: "Cleared #{size} jobs from #{queue_name}" }
        else
          render json: { error: 'Sidekiq not available' }, status: :service_unavailable
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/clear_retries
      def clear_retries
        if defined?(Sidekiq::RetrySet)
          rs = Sidekiq::RetrySet.new
          size = rs.size
          rs.clear
          render json: { message: "Cleared #{size} retries" }
        else
          render json: { error: 'Sidekiq not available' }, status: :service_unavailable
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/clear_dead
      def clear_dead
        if defined?(Sidekiq::DeadSet)
          ds = Sidekiq::DeadSet.new
          size = ds.size
          ds.clear
          render json: { message: "Cleared #{size} dead jobs" }
        else
          render json: { error: 'Sidekiq not available' }, status: :service_unavailable
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # POST /admin/api/monitoring/retry_all
      def retry_all
        set_type = params[:set] || 'retries'
        klass = set_type == 'dead' ? Sidekiq::DeadSet : Sidekiq::RetrySet

        if defined?(klass)
          set = klass.new
          size = set.size
          set.retry_all
          render json: { message: "Retrying all #{size} jobs from #{set_type}" }
        else
          render json: { error: 'Sidekiq not available' }, status: :service_unavailable
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end

      # ─── Audit Logs ──────────────────────────────────────────────

      # GET /admin/api/monitoring/audit_logs
      def audit_logs
        page = (params[:page] || 1).to_i
        per = (params[:per] || 50).to_i

        logs = AuditLog.order(created_at: :desc)
        logs = logs.where(action: params[:action_filter]) if params[:action_filter].present?
        logs = logs.where(auditable_type: params[:auditable_type]) if params[:auditable_type].present?

        total = logs.count
        records = logs.offset((page - 1) * per).limit(per)

        render json: {
          logs: records.map do |log|
            {
              id: log.id,
              action: log.action,
              auditable_type: log.auditable_type,
              auditable_id: log.auditable_id,
              user_type: log.user_type,
              user_id: log.user_id,
              ip_address: log.ip_address,
              object_changes: log.object_changes,
              created_at: log.created_at.iso8601
            }
          end,
          total: total,
          page: page,
          per: per
        }
      rescue StandardError => e
        render json: { logs: [], total: 0, error: e.message }
      end

      # ─── System Logs (Rails log files) ────────────────────────────

      # GET /admin/api/monitoring/system_logs
      def system_logs
        lines = (params[:lines] || 200).to_i.clamp(50, 2000)
        search = params[:search].to_s.strip
        source = params[:source] || 'rails'

        # Security: Use an explicit case statement with literal strings to satisfy Brakeman
        source_key = source.to_s.downcase.strip
        log_file = case source_key
                   when 'sidekiq', 'job'
                     # Try role-specific logs (.job or .sidekiq), then standard sidekiq.log, then fallback to production.log
                     role_log_job = Rails.root.join('log', "#{Rails.env}.job.log")
                     role_log_sidekiq = Rails.root.join('log', "#{Rails.env}.sidekiq.log")

                     if File.exist?(role_log_job)
                       role_log_job
                     elsif File.exist?(role_log_sidekiq)
                       role_log_sidekiq
                     elsif File.exist?(Rails.root.join('log', 'sidekiq.log'))
                       Rails.root.join('log', 'sidekiq.log')
                     else
                       # Final fallback for Docker/Consolidated environments
                       Rails.root.join('log', "#{Rails.env}.log")
                     end
                   when 'web'
                     role_log = Rails.root.join('log', "#{Rails.env}.web.log")
                     File.exist?(role_log) ? role_log : Rails.root.join('log', "#{Rails.env}.log")
                   else
                     # Default to environment log
                     Rails.root.join('log', "#{Rails.env}.log")
                   end

        unless File.exist?(log_file)
          return render json: { lines: [], total: 0, source: source, error: 'Log file not found' }
        end

        # Use native Ruby helper to read last N lines safely
        raw_lines = read_last_lines(log_file, lines)

        # Apply search filter
        if search.present?
          raw_lines = raw_lines.select { |l| l.downcase.include?(search.downcase) }
        end

        # Parse lines with timestamps and severity
        parsed = raw_lines.map.with_index do |line, idx|
          # Force UTF-8 and scrub invalid sequences to prevent JSON encoding warnings
          safe_line = line.to_s.force_encoding('UTF-8').scrub

          severity = if safe_line.match?(/\b(FATAL|fatal)\b/)
                       'fatal'
                     elsif safe_line.match?(/\b(ERROR|error)\b/i) && !safe_line.match?(/error_logs|error_class|error_message/)
                       'error'
                     elsif safe_line.match?(/\b(WARN|warn)\b/i)
                       'warn'
                     elsif safe_line.match?(/\bStarted\b/)
                       'request'
                     elsif safe_line.match?(/\bCompleted\b/)
                       'response'
                     else
                       'info'
                     end

          { id: idx, text: safe_line, severity: severity }
        end

        render json: { lines: parsed, total: parsed.size, source: source, file: log_file.to_s }
      rescue StandardError => e
        render json: { lines: [], total: 0, error: e.message }
      end

      # GET /admin/api/monitoring/error_logs
      def error_logs
        lines = (params[:lines] || 500).to_i.clamp(100, 5000)
        log_file = Rails.root.join('log', "#{Rails.env}.log")

        unless File.exist?(log_file)
          return render json: { errors: [], total: 0, error: 'Log file not found' }
        end

        # Use native Ruby helper to read last N lines safely
        raw = read_last_lines(log_file, lines)

        errors = []
        current_error = nil

        raw.each do |line|
          # Force UTF-8 and scrub invalid sequences
          safe_line = line.to_s.force_encoding('UTF-8').scrub

          if safe_line.match?(/\b(ERROR|FATAL|error|fatal)\b/) && !safe_line.match?(/error_logs|error_class|error_message/)
            # Start new error block
            if current_error
              errors << current_error
            end
            current_error = { message: safe_line, trace: [], timestamp: extract_timestamp(safe_line) }
          elsif current_error && (safe_line.match?(/^\s+/) || safe_line.match?(/^from /))
            # Continuation of stack trace
            current_error[:trace] << safe_line.strip
          elsif current_error
            errors << current_error
            current_error = nil
          end
        end
        errors << current_error if current_error

        render json: { errors: errors.reverse.first(50), total: errors.size }
      rescue StandardError => e
        render json: { errors: [], total: 0, error: e.message }
      end

      # GET /admin/api/monitoring/resource_alerts
      def resource_alerts
        status = params[:status] || 'firing'
        limit = (params[:limit] || 50).to_i
        
        alerts = ResourceAlert.order(updated_at: :desc).limit(limit)
        alerts = alerts.where(status: status) if status != 'all'
        
        render json: { alerts: alerts }
      end

      # POST /admin/api/monitoring/resource_alerts/:id/acknowledge
      def acknowledge_alert
        alert = ResourceAlert.find(params[:id])
        alert.resolve! # Using resolve! as pseudo-acknowledge
        render json: { success: true, alert: alert }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Alert not found' }, status: :not_found
      end

      private

      def system_metrics
        {
          ruby_version: RUBY_VERSION,
          rails_version: Rails.version,
          environment: Rails.env,
          uptime_seconds: uptime,
          memory_mb: process_memory_mb,
          cpu_count: Etc.nprocessors,
          load_average: load_average,
          disk_usage: disk_usage
        }
      end

      def application_metrics
        {
          total_users: User.count,
          total_resellers: Reseller.count,
          total_orders: Order.count,
          orders_today: Order.where('created_at >= ?', Time.current.beginning_of_day).count,
          revenue_today: Order.where('created_at >= ?', Time.current.beginning_of_day)
                         .where(status: 'active').sum(:total_amount).to_f,
          revenue_this_month: Order.where('created_at >= ?', Time.current.beginning_of_month)
                              .where(status: 'active').sum(:total_amount).to_f,
          active_checkout_sessions: CheckoutSession.where(status: 'pending').count,
          pending_orders: Order.where(status: 'pending').count,
          failed_orders_today: Order.where(status: 'failed')
                               .where('created_at >= ?', Time.current.beginning_of_day).count
        }
      end

      def database_metrics
        pool = ActiveRecord::Base.connection_pool
        {
          pool_size: pool.size,
          connections_in_use: pool.connections.count(&:in_use?),
          connections_available: pool.size - pool.connections.count(&:in_use?),
          database_size_mb: database_size
        }
      end

      def job_metrics
        if defined?(Sidekiq::Stats)
          stats = Sidekiq::Stats.new
          processes = begin
            Sidekiq::ProcessSet.new
          rescue StandardError
            []
          end
          {
            enqueued: stats.enqueued,
            processed: stats.processed,
            failed: stats.failed,
            retry_size: stats.retry_size,
            scheduled_size: stats.scheduled_size,
            dead_size: begin
              Sidekiq::DeadSet.new.size
            rescue StandardError
              0
            end,
            workers_size: stats.workers_size,
            processes_count: processes.size,
            default_queue_latency: stats.default_queue_latency.round(2),
            processes: processes.map do |p|
              {
                hostname: p['hostname'],
                pid: p['pid'],
                started_at: p['started_at'] ? Time.at(p['started_at']).iso8601 : nil,
                queues: p['queues'],
                concurrency: p['concurrency'],
                busy: p['busy'],
                tag: p['tag']
              }
            end
          }
        else
          { message: 'Sidekiq not available' }
        end
      rescue StandardError => e
        { message: "Could not fetch job metrics: #{e.message}" }
      end

      def vm_metrics
        {
          total: Vm.count,
          active: Vm.where(status: 'active').count,
          provisioning: Vm.where(status: 'provisioning').count,
          failed: Vm.where(status: 'failed').count,
          terminated: Vm.where(status: 'terminated').count,
          pending: Vm.where(status: 'pending').count,
          recent_backups: ProxmoxOperation.where(operation_type: 'backup')
                          .order(created_at: :desc)
                          .limit(5)
                          .map { |op| { status: op.status, vm_id: op.proxmox_vm_id, at: op.created_at.iso8601 } }
        }
      end

      def service_statuses
        services = []
        services << check_service('Redis') { Redis.new(url: ENV['REDIS_URL']).ping == 'PONG' }
        services << check_service('Sidekiq') do
          redis_error = nil
          process_count = 0

          redis_up = begin
            # First check if we can connect at all
            Sidekiq.redis { |c| c.ping == 'PONG' }

            # If so, get stats
            stats = Sidekiq::Stats.new
            process_count = stats.processes_size
            true
          rescue StandardError => e
            redis_error = e.message
            Rails.logger.error "[Monitoring] Sidekiq connection error: #{e.message}"
            false
          end

          {
            status: if redis_up && process_count.positive?
                      'healthy'
                    else
                      (redis_up ? 'warning' : 'down')
                    end,
            details: redis_up ? "#{process_count} active processes" : "Redis Error: #{redis_error}",
            description: redis_up && process_count.zero? ? 'Sidekiq connected to Redis but no active processes found' : redis_error
          }
        end
        services << check_service('Database') { ActiveRecord::Base.connection.active? }
        services << check_service('Prometheus') { defined?(PROMETHEUS_REGISTRY) }
        services << check_service('ActionCable') { ActionCable.server.pubsub.respond_to?(:subscribe) }
        services << check_service('Proxmox') { proxmox_reachable? }
        services
      end

      def redis_details
        redis = Redis.new(url: ENV['REDIS_URL'])
        info = redis.info
        {
          version: info['redis_version'],
          uptime_seconds: info['uptime_in_seconds'].to_i,
          connected_clients: info['connected_clients'].to_i,
          used_memory_human: info['used_memory_human'],
          used_memory_peak_human: info['used_memory_peak_human'],
          total_commands_processed: info['total_commands_processed'].to_i,
          keyspace_hits: info['keyspace_hits'].to_i,
          keyspace_misses: info['keyspace_misses'].to_i,
          db_size: redis.dbsize,
          maxmemory_human: info['maxmemory_human'].presence || 'unlimited',
          role: info['role'],
          rdb_last_save_time: info['rdb_last_save_time'] ? Time.at(info['rdb_last_save_time'].to_i).iso8601 : nil,
          rdb_changes_since_last_save: info['rdb_changes_since_last_save'].to_i,
          evicted_keys: info['evicted_keys'].to_i
        }
      rescue StandardError => e
        { error: e.message }
      end

      def websocket_health
        {
          adapter: ActionCable.server.config.cable.fetch('adapter', 'unknown'),
          allowed_origins: ActionCable.server.config.allowed_request_origins,
          pubsub_connected: begin
            ActionCable.server.pubsub.respond_to?(:subscribe)
          rescue StandardError
            false
          end,
          connection_count: begin
            ActionCable.server.connections.size
          rescue StandardError
            'N/A'
          end
        }
      rescue StandardError => e
        { error: e.message }
      end

      def container_info
        info = {}
        # Docker container ID
        if File.exist?('/proc/1/cpuset')
          cpuset = File.read('/proc/1/cpuset').strip
          info[:container_id] = cpuset.split('/').last if cpuset.include?('docker')
        end
        # Hostname (typically container name)
        info[:hostname] = begin
          Socket.gethostname
        rescue StandardError
          'unknown'
        end
        # Memory limit (cgroup v2 or v1)
        cgroup_mem = '/sys/fs/cgroup/memory/memory.limit_in_bytes'
        cgroup_mem_v2 = '/sys/fs/cgroup/memory.max'
        if File.exist?(cgroup_mem_v2)
          val = File.read(cgroup_mem_v2).strip
          info[:memory_limit_mb] = val == 'max' ? 'unlimited' : (val.to_i / 1024 / 1024)
        elsif File.exist?(cgroup_mem)
          val = File.read(cgroup_mem).strip.to_i
          info[:memory_limit_mb] = val > 1_000_000_000_000 ? 'unlimited' : (val / 1024 / 1024)
        end
        # CPU limit
        cpu_quota = '/sys/fs/cgroup/cpu/cpu.cfs_quota_us'
        cpu_period = '/sys/fs/cgroup/cpu/cpu.cfs_period_us'
        cpu_max_v2 = '/sys/fs/cgroup/cpu.max'
        if File.exist?(cpu_max_v2)
          parts = File.read(cpu_max_v2).strip.split
          info[:cpu_limit] = parts[0] == 'max' ? 'unlimited' : (parts[0].to_f / parts[1]).round(2)
        elsif File.exist?(cpu_quota) && File.exist?(cpu_period)
          quota = File.read(cpu_quota).strip.to_i
          period = File.read(cpu_period).strip.to_i
          info[:cpu_limit] = quota.negative? ? 'unlimited' : (quota.to_f / period).round(2)
        end
        info[:running_in_docker] = File.exist?('/.dockerenv')
        info
      rescue StandardError => e
        { error: e.message }
      end

      def proxmox_node_info
        return { error: 'Proxmox not configured' } unless proxmox_configured?

        svc = VmProvisioningService.new(nil, Rails.logger)
        node = ENV['PROXMOX_NODE'] || 'pve'

        # Node status
        node_status = begin
          svc.send(:proxmox_get, "/nodes/#{node}/status")['data']
        rescue StandardError
          {}
        end
        # Node Storage
        storage = begin
          svc.send(:proxmox_get, "/nodes/#{node}/storage")['data']
        rescue StandardError
          []
        end
        # Running VMs
        qemu = begin
          svc.send(:proxmox_get, "/nodes/#{node}/qemu")['data']
        rescue StandardError
          []
        end

        cpu_info = node_status['cpuinfo'] || {}
        memory = node_status['memory'] || {}

        {
          node: node,
          status: node_status['status'] || (node_status.any? ? 'online' : 'unknown'),
          uptime: node_status['uptime'],
          cpu_model: cpu_info['model'] || 'N/A',
          cpu_cores: cpu_info['cores'],
          cpu_sockets: cpu_info['sockets'],
          cpu_usage: node_status['cpu'] ? (node_status['cpu'] * 100).round(1) : nil,
          memory_total_gb: memory['total'] ? (memory['total'] / 1_073_741_824.0).round(1) : nil,
          memory_used_gb: memory['used'] ? (memory['used'] / 1_073_741_824.0).round(1) : nil,
          memory_free_gb: memory['free'] ? (memory['free'] / 1_073_741_824.0).round(1) : nil,
          kernel_version: node_status['kversion'],
          pve_version: node_status['pveversion'],
          storage: storage.map do |s|
            {
              name: s['storage'],
              type: s['type'],
              total_gb: s['total'] ? (s['total'] / 1_073_741_824.0).round(1) : nil,
              used_gb: s['used'] ? (s['used'] / 1_073_741_824.0).round(1) : nil,
              available_gb: s['avail'] ? (s['avail'] / 1_073_741_824.0).round(1) : nil,
              usage_pct: s['total']&.positive? ? ((s['used'].to_f / s['total']) * 100).round(1) : 0,
              active: s['active'] == 1,
              enabled: s['enabled'] == 1
            }
          end,
          vms_running: qemu.count { |v| v['status'] == 'running' },
          vms_stopped: qemu.count { |v| v['status'] == 'stopped' },
          vms_total: qemu.size
        }
      rescue StandardError => e
        { error: "Failed to fetch Proxmox data: #{e.message}" }
      end

      def check_service(name)
        result = begin
          yield
        rescue StandardError => e
          { status: 'down', details: e.message }
        end

        base = { name: name, checked_at: Time.current.iso8601 }

        if result.is_a?(Hash)
          base.merge(result)
        else
          base.merge(status: result ? 'healthy' : 'down')
        end
      end

      def proxmox_configured?
        ENV['PROXMOX_API_URL'].present? && ENV['PROXMOX_API_TOKEN_ID'].present? && ENV['PROXMOX_API_TOKEN_SECRET'].present?
      end

      def proxmox_reachable?
        return false unless proxmox_configured?

        Timeout.timeout(2) do
          svc = VmProvisioningService.new(nil, Rails.logger)
          node = ENV['PROXMOX_NODE'] || 'pve'
          result = svc.send(:proxmox_get, "/nodes/#{node}/status")
          result['data'].present?
        end
      rescue StandardError
        false
      end

      def uptime
        if File.exist?('/proc/uptime')
          File.read('/proc/uptime').split.first.to_f.round(0)
        else
          0
        end
      end

      def process_memory_mb
        if File.exist?("/proc/#{Process.pid}/status")
          mem_line = File.readlines("/proc/#{Process.pid}/status").find { |l| l.start_with?('VmRSS:') }
          mem_line ? (mem_line.split[1].to_i / 1024.0).round(1) : 0
        else
          0
        end
      end

      def load_average
        if File.exist?('/proc/loadavg')
          parts = File.read('/proc/loadavg').split
          { one: parts[0].to_f, five: parts[1].to_f, fifteen: parts[2].to_f }
        else
          { one: 0, five: 0, fifteen: 0 }
        end
      rescue StandardError
        { one: 0, five: 0, fifteen: 0 }
      end

      def disk_usage
        output = `df -h / 2>/dev/null`.split("\n").last
        return {} unless output

        parts = output.split
        { total: parts[1], used: parts[2], available: parts[3], usage_pct: parts[4] }
      rescue StandardError
        {}
      end

      def database_size
        result = ActiveRecord::Base.connection.execute(
          'SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_mb'
        )
        result.first['size_mb'].to_f.round(1)
      rescue StandardError
        0
      end

      def extract_timestamp(line)
        # Try ISO timestamp
        if (m = line.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/))
          m[1]
        # Try Rails log timestamp
        elsif (m = line.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/))
          m[1]
        end
      end

      def sidekiq_job_json(job)
        {
          jid: job.jid,
          klass: job.klass,
          args: job.args.first(3), # Limit displayed args
          queue: job.queue,
          created_at: job.created_at ? Time.at(job.created_at).iso8601 : nil,
          enqueued_at: job.enqueued_at ? Time.at(job.enqueued_at).iso8601 : nil
        }
      rescue StandardError
        { jid: 'unknown', klass: 'unknown' }
      end

      def sidekiq_sorted_job_json(job)
        {
          jid: job.jid,
          klass: job.item['class'],
          args: (job.item['args'] || []).first(3),
          queue: job.queue,
          error_class: job.item['error_class'],
          error_message: job.item['error_message']&.first(200),
          retry_count: job.item['retry_count'],
          failed_at: job.item['failed_at'] ? Time.at(job.item['failed_at']).iso8601 : nil,
          created_at: job.item['created_at'] ? Time.at(job.item['created_at']).iso8601 : nil,
          at: job.score ? Time.at(job.score).iso8601 : nil
        }
      rescue StandardError
        { jid: 'unknown', klass: 'unknown' }
      end

      def read_last_lines(file_path, count, buffer_size = 65_536)
        raw_lines = []
        File.open(file_path, 'r') do |f|
          f.seek(0, IO::SEEK_END)
          pos = f.pos
          while raw_lines.size <= count && pos.positive?
            seek_pos = [0, pos - buffer_size].max
            read_len = pos - seek_pos
            f.seek(seek_pos, IO::SEEK_SET)
            chunk = f.read(read_len)
            pos = seek_pos
            chunk_lines = chunk.split("\n", -1)
            raw_lines[0] = chunk_lines.pop + raw_lines[0] if raw_lines.any? && !chunk.end_with?("\n")
            raw_lines = chunk_lines + raw_lines
          end
        end
        raw_lines.last(count + 1).reject(&:blank?)
      end

      def determine_log_severity(line)
        if line.match?(/\b(FATAL|fatal)\b/)
          'fatal'
        elsif line.match?(/\b(ERROR|error)\b/i) && !line.match?(/error_logs|error_class|error_message/)
          'error'
        elsif line.match?(/\b(WARN|warn)\b/i)
          'warn'
        elsif line.match?(/\bStarted\b/)
          'request'
        elsif line.match?(/\bCompleted\b/)
          'response'
        else
          'info'
        end
      end
    end
  end
end

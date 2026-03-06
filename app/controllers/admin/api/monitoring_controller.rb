# frozen_string_literal: true

module Admin
  module Api
    class MonitoringController < Admin::Api::BaseController
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
          timestamp: Time.current.iso8601
        }
      end

      private

      def system_metrics
        {
          ruby_version: RUBY_VERSION,
          rails_version: Rails.version,
          environment: Rails.env,
          uptime_seconds: uptime,
          memory_mb: process_memory_mb,
          cpu_count: Etc.nprocessors
        }
      end

      def application_metrics
        {
          total_users: User.count,
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
          {
            enqueued: stats.enqueued,
            processed: stats.processed,
            failed: stats.failed,
            retry_size: stats.retry_size,
            scheduled_size: stats.scheduled_size,
            workers_size: stats.workers_size,
            default_queue_latency: stats.default_queue_latency.round(2)
          }
        else
          { message: 'Sidekiq not available' }
        end
      rescue StandardError
        { message: 'Could not fetch job metrics' }
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
                                          .map do |op|
                                            { status: op.status, vm_id: op.proxmox_vm_id,
                                              at: op.created_at.iso8601 }
          end
        }
      end

      def service_statuses
        services = []

        # Redis
        services << check_service('Redis') { Redis.new.ping == 'PONG' }

        # Sidekiq
        services << check_service('Sidekiq') do
          defined?(Sidekiq::Stats) && Sidekiq::Stats.new.processes_size.positive?
        end

        # Database
        services << check_service('Database') { ActiveRecord::Base.connection.active? }

        # Prometheus
        services << check_service('Prometheus') { defined?(PROMETHEUS_REGISTRY) }

        services
      end

      def check_service(name)
        status = begin
          yield
        rescue StandardError
          false
        end
        { name: name, status: status ? 'healthy' : 'down', checked_at: Time.current.iso8601 }
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

      def database_size
        result = ActiveRecord::Base.connection.execute(
          'SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_mb'
        )
        result.first['size_mb'].to_f.round(1)
      rescue StandardError
        0
      end
    end
  end
end

# frozen_string_literal: true

module Admin
  module Api
    class DatabaseController < BaseController
      before_action :require_admin!

      # GET /admin/api/database/tables
      def tables
        # List all tables and their columns
        tables = ActiveRecord::Base.connection.tables.sort.map do |table|
          columns = ActiveRecord::Base.connection.columns(table).map do |c|
            { name: c.name, type: c.type.to_s }
          end
          { name: table, columns: columns }
        end
        render json: { tables: tables }
      end

      # POST /admin/api/database/query
      def query
        query_string = params[:query].to_s.strip
        return render json: { error: 'Query is missing' }, status: :unprocessable_entity if query_string.blank?

        # Allow all queries for SuperAdmins; security is handled by :require_admin! and audit logging
        record_audit_log('database.query', current_employee, { query: query_string })

        begin
          result = ActiveRecord::Base.connection.exec_query(query_string)

          # Convert value arrays to strings or safe types to avoid JSON serialization errors with PG types like dates/UUIDs
          rows = result.rows.map { |row| row.map { |v| v&.to_s } }

          render json: {
            columns: result.columns,
            rows: rows,
            count: result.rows.size,
            message: 'Query executed successfully'
          }
        rescue StandardError => e
          record_audit_log('database.query_error', current_employee, { query: query_string, error: e.message })
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end

# frozen_string_literal: true

module Admin
  module Api
    class UsaEsimCredentialsController < BaseController
      before_action :require_admin!

      def index
        credentials = UsaEsimCredential.all.order(created_at: :desc)
        
        # Simple pagination or limit
        render json: {
          credentials: credentials.map { |c| 
            {
              id: c.id,
              iccid: c.iccid,
              provider: c.provider,
              status: c.status,
              has_qr_image: c.qr_code_image.attached?,
              qr_image_url: c.qr_code_image.attached? ? url_for(c.qr_code_image) : nil,
              qr_activation_code: c.qr_activation_code,
              created_at: c.created_at,
              assigned_at: c.assigned_at,
              order_id: c.order_id
            }
          }
        }
      end

      def import
        file = params[:file]
        images = params[:images] || []
        provider = params[:provider] || 'lyca'

        if file.blank?
          return render json: { error: 'No Excel file provided' }, status: :unprocessable_entity
        end

        service = Admin::UsaEsimImportService.new(
          excel_file: file,
          images: images,
          provider: provider
        )

        results = service.call

        render json: results
      end

      def destroy
        credential = UsaEsimCredential.find(params[:id])
        
        if credential.status == 'assigned'
          return render json: { error: 'Cannot delete assigned credential' }, status: :forbidden
        end

        credential.destroy
        head :no_content
      end
    end
  end
end

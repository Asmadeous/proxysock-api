# frozen_string_literal: true

module Api
  module V1
    # Resellers top up their own MeiSIM phone-number lines exactly as customers do.
    class EsimTopupsController < Web::Api::EsimTopupsController
      skip_before_action :set_order
      before_action :authenticate_reseller!
      before_action :set_order
    end
  end
end

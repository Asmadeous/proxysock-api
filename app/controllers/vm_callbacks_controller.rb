# frozen_string_literal: true

class VmCallbacksController < ApplicationController
  # Skip CSRF and authentication — this endpoint is called by Ansible playbooks
  skip_before_action :verify_authenticity_token, raise: false
  before_action :verify_callback_token

  # POST /vm/:id/status
  # Called by Ansible playbooks to report provisioning success or failure.
  #
  # Expected params:
  #   status:            "configured" | "failed"
  #   vm_id:             the VM record ID
  #   hostname:          configured hostname
  #   os_template:       e.g. "ubuntu-22-04"
  #   management_type:   "managed" | "unmanaged"
  #   error:             (optional) error message on failure
  #   services_verified: (optional) list of verified services
  #   proxy_configured:  (optional) boolean
  #   monitoring_enabled: (optional) boolean
  def status
    vm = Vm.find_by(id: params[:id])
    return render json: { error: 'VM not found' }, status: :not_found unless vm

    Rails.logger.info("[VmCallback] Received status '#{params[:status]}' for VM #{vm.id}")

    case params[:status]
    when 'configured'
      handle_configured(vm)
    when 'failed'
      handle_failed(vm)
    else
      Rails.logger.warn("[VmCallback] Unknown status '#{params[:status]}' for VM #{vm.id}")
    end

    render json: { ok: true }, status: :ok
  end

  private

  def verify_callback_token
    expected = ENV.fetch('VM_CALLBACK_API_KEY', 'internal-provisioning-key')
    token = request.headers['Authorization']&.sub(/^Bearer\s+/, '')

    unless token == expected
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def handle_configured(vm)
    # Update VM metadata from callback
    vm.update(
      metadata: (vm.metadata || {}).merge(
        ansible_status: 'configured',
        services_verified: params[:services_verified],
        proxy_configured: params[:proxy_configured],
        monitoring_enabled: params[:monitoring_enabled],
        configuration_timestamp: params[:configuration_timestamp]
      )
    )

    # If still in provisioning state, ansible finished before the job did —
    # don't transition yet, let VmProvisioningJob handle mark_active!
    Rails.logger.info("[VmCallback] VM #{vm.id} reported as configured via Ansible")
  end

  def handle_failed(vm)
    error_msg = params[:error] || 'Unknown Ansible error'
    Rails.logger.error("[VmCallback] VM #{vm.id} Ansible configuration FAILED: #{error_msg}")

    vm.update(
      metadata: (vm.metadata || {}).merge(
        ansible_status: 'failed',
        ansible_error: error_msg
      )
    )

    # If still provisioning, fail it
    vm.fail! if vm.may_fail?

    # Notify owner
    owner = vm.vm_order&.order&.orderable
    if owner
      NotificationService.notify(
        recipient: owner,
        category: 'error',
        title: 'VM Configuration Failed',
        message: "VM ##{vm.id} Ansible configuration failed: #{error_msg}",
        metadata: { vm_id: vm.id, error: error_msg }
      )
    end
  end
end

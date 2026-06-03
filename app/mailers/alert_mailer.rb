# frozen_string_literal: true

class AlertMailer < ApplicationMailer
  # Send a resource usage alert email
  #
  # @param recipient_email [String] email address to send to
  # @param alert_data [Hash] alert details:
  #   - :resource_type (String) 'proxmox_server', 'vm', 'container'
  #   - :resource_name (String) hostname, container name, etc.
  #   - :resource_id (String) identifier
  #   - :metric (String) 'cpu', 'memory', 'disk', 'storage'
  #   - :value (Float) current percentage
  #   - :threshold (Float) threshold percentage
  #   - :owner_name (String, optional) name of the owner
  def resource_alert(recipient_email, alert_data)
    @alert = alert_data
    @resource_label = resource_type_label(alert_data[:resource_type])
    @metric_label = alert_data[:metric].capitalize
    @value = alert_data[:value].round(1)
    @threshold = alert_data[:threshold].round(1)
    @resource_name = alert_data[:resource_name] || alert_data[:resource_id]
    @timestamp = Time.current

    mail(
      to: recipient_email,
      subject: "🔴 [ALERT] #{@resource_label} — #{@metric_label} at #{@value}% — #{@resource_name}"
    )
  end

  # Send a resolution email when usage drops back below threshold
  def resource_resolved(recipient_email, alert_data)
    @alert = alert_data
    @resource_label = resource_type_label(alert_data[:resource_type])
    @metric_label = alert_data[:metric].capitalize
    @value = alert_data[:value].round(1)
    @threshold = alert_data[:threshold].round(1)
    @resource_name = alert_data[:resource_name] || alert_data[:resource_id]
    @timestamp = Time.current

    mail(
      to: recipient_email,
      subject: "🟢 [RESOLVED] #{@resource_label} — #{@metric_label} back to #{@value}% — #{@resource_name}"
    )
  end

  private

  def resource_type_label(type)
    case type
    when 'proxmox_server' then 'Proxmox Server'
    when 'vm' then 'Virtual Machine'
    when 'container' then 'Docker Container'
    else type.humanize
    end
  end
end

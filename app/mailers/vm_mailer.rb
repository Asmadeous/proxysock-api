# frozen_string_literal: true

class VmMailer < ApplicationMailer
  def credentials_email
    @vm = params[:vm]
    @order = @vm.vm_order.order
    @owner = params[:owner] || @order.orderable
    @title = "Your VM Credentials - Order ##{@order.order_number}"
    @is_rdp = @vm.vm_type.to_s == 'rdp' || @vm.rdp_port.present?
    @rdp_filename = "#{@vm.hostname.presence || "RDP-#{@vm.id}"}.rdp"

    # Attach a ready-to-use Remote Desktop (.rdp) connection file so the customer
    # can connect by opening it — it carries the host:port and username (the
    # password is entered manually; .rdp files store passwords as per-machine
    # DPAPI blobs that can't be embedded portably).
    if @is_rdp
      attachments[@rdp_filename] = {
        mime_type: 'application/x-rdp',
        content: RdpConfigService.new(@vm).generate
      }
    end

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your VM is Ready - #{@vm.connection_host}"
    )
  end
end

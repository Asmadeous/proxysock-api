# frozen_string_literal: true

class AdminMailer < ApplicationMailer
  ADMIN_EMAIL = ENV.fetch('ADMIN_PAYOUT_EMAIL', 'admin@proxysock.com')

  # Notify admin of a reseller payout request that requires manual processing.
  # Includes reseller details, amount, payment method, and account details.
  def payout_request(payout)
    @payout = payout
    @reseller = payout.reseller
    @payment_details = payout.payment_details || {}

    mail(
      to: ADMIN_EMAIL,
      subject: "[ACTION REQUIRED] Payout Request — $#{payout.amount} — #{@reseller.company_name || @reseller.username}"
    )
  end

  # A paid eSIM top-up staff must apply by hand in the MeiSIM portal. Goes to the
  # support inbox (MAILER_FROM), where MeiSIM's own emails also land.
  def esim_topup_request(topup)
    @topup = topup
    @order = topup.order
    @esim = @order.esim_order&.esims&.first
    @owner = topup.orderable

    mail(
      to: Mail::Address.new(ApplicationMailer.default[:from]).address,
      subject: "[ACTION REQUIRED] eSIM top-up — $#{topup.topup_value.to_i} — #{@esim&.msisdn.presence || @order.order_number}"
    )
  end

  # Notify admin of an affiliate payout request that requires manual processing.
  def affiliate_payout_request(affiliate_payout)
    @payout = affiliate_payout
    @affiliate = affiliate_payout.affiliate
    @owner = @affiliate.affiliatable
    @payment_details = affiliate_payout.payment_details || {}

    mail(
      to: ADMIN_EMAIL,
      subject: "[ACTION REQUIRED] Affiliate Payout — $#{affiliate_payout.amount} — #{@owner&.email || @affiliate.referral_code}"
    )
  end
end

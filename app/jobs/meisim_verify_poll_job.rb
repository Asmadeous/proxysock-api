# frozen_string_literal: true

# MeiSIM eSIM Verify has no webhooks. The admin page polls only while it stays open, so this
# job finishes the checks it leaves: it saves MeiSIM's verdict and tells the staff member who
# asked. A check with no verdict after a day is closed as timed_out so it can be run again.
class MeisimVerifyPollJob < ApplicationJob
  queue_as :default

  GIVE_UP_AFTER = 24.hours
  VERDICTS = {
    'available' => 'Available — not installed yet',
    'used' => 'Used — already installed',
    'invalid' => 'Invalid activation code',
    'unknown' => 'Unknown — carrier gave no answer',
    'error' => 'Check failed (refunded by MeiSIM)',
    'timed_out' => 'No answer from MeiSIM within 24 hours — verify again'
  }.freeze

  def perform
    Esim.verification_pending.find_each do |esim|
      poll(esim)
    rescue StandardError => e
      Rails.logger.error("[MeisimVerifyPoll] eSIM #{esim.id}: #{e.message}")
    end
  end

  private

  def poll(esim)
    status = begin
      esim.refresh_verification!.first
    rescue MeisimService::Error => e
      Rails.logger.error("[MeisimVerifyPoll] eSIM #{esim.id}: #{e.message}")
      'pending'
    end

    if status == 'pending'
      return unless stale?(esim)

      status = 'timed_out'
      esim.update_verification!('status' => status, 'checked_at' => Time.current.iso8601)
    end
    notify_requester(esim, status)
  end

  def stale?(esim)
    submitted_at = Time.zone.parse(esim.verification['submitted_at'].to_s)
    submitted_at.nil? || submitted_at < GIVE_UP_AFTER.ago
  end

  def notify_requester(esim, status)
    employee = Employee.find_by(id: esim.verification['requested_by'])
    return unless employee

    NotificationService.notify(
      recipient: employee,
      category: status == 'timed_out' ? 'warning' : 'info',
      title: 'eSIM Verify: result',
      message: "eSIM #{esim.iccid.presence || esim.id}: #{VERDICTS.fetch(status, status)}",
      metadata: { esim_id: esim.id, iccid: esim.iccid, status: status }
    )
  end
end

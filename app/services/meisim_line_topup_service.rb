# frozen_string_literal: true

# Staff recharge of a MeiSIM phone line through MeiSIM's top-up API, paid from our MeiSIM
# wallet. Every recharge checks the line first (topup/confirm) and only sends a plan or an
# amount MeiSIM offered for it. Each attempt is written to the audit log; a recharge for a
# customer's queued top-up completes that request, and never runs twice for it.
#
# MeiSIM documents the request fields but not the response shapes of these endpoints, so
# the readers below accept the documented names (BundleList, BundleProductCode, TopUpList)
# wherever they sit in the response, and pass the raw answer through for staff to read.
class MeisimLineTopupService
  class Refused < StandardError; end

  AUDIT_ACTION = 'meisim.line_topup'
  ICCID = /\A89\d{16,20}\z/.freeze

  Result = Struct.new(:status, :message, :response, keyword_init: true) do
    def applied?
      status == 'applied'
    end
  end

  # Carrier names to choose from, cached for an hour once MeiSIM has listed some.
  def self.networks
    cached = Rails.cache.read('meisim/topup/networks')
    return cached if cached

    body = MeisimService.new.topup_networks
    list = body.is_a?(Array) ? body : body.values.find { |v| v.is_a?(Array) } || []
    names = list.filter_map do |n|
      n.is_a?(Hash) ? n.values_at('networkName', 'NetworkName', 'name', 'Name').compact.first : n.to_s.presence
    end
    Rails.cache.write('meisim/topup/networks', names, expires_in: 1.hour) if names.any?
    names
  end

  def initialize(actor)
    @actor = actor
  end

  # The line's plans and credit amounts: { plans: [{ code, name, value }], credit_amounts:, raw: }
  def check(network:, line:)
    body = MeisimService.new.topup_confirm(network: network, **line_params(line))
    plans = list_in(body, 'BundleList').filter_map { |b| plan(b) }
    credits = list_in(body, 'TopUpList').filter_map { |t| credit(t) }
    { plans: plans, credit_amounts: credits, raw: body }
  end

  # Returns a Result: applied, failed (MeiSIM refused, nothing charged) or unknown (no clear
  # answer, so MeiSIM may have charged: check the MeiSIM portal before trying again).
  def recharge!(network:, line:, value:, plan_code: nil, esim_topup: nil)
    raise Refused, 'Enter an amount above zero' unless value.to_d.positive?
    return recharge_for_request!(esim_topup, network, line, value, plan_code) if esim_topup

    attempt(network, line, value, plan_code, nil)
  end

  private

  def recharge_for_request!(topup, network, line, value, plan_code)
    topup.with_lock do
      raise Refused, 'Only pending top-ups can be recharged' unless topup.pending?

      previous = AuditLog.where(action: AUDIT_ACTION, auditable: topup)
                         .where("object_changes->>'result' IN ('applied', 'unknown')").exists?
      raise Refused, 'MeiSIM was already asked to recharge this top-up. Check the MeiSIM portal, then mark it done or cancel it.' if previous

      result = attempt(network, line, value, plan_code, topup)
      EsimTopupService.complete!(topup, note: "Recharged via MeiSIM API: #{result.message}") if result.applied?
      result
    end
  end

  def attempt(network, line, value, plan_code, topup)
    offer = check(network: network, line: line)
    credit_only = validate_choice!(offer, value, plan_code)
    response = MeisimService.new.topup_recharge(network: network, value: value, plan_code: plan_code,
                                                credit_only: credit_only, **line_params(line))
    record(network, line, value, plan_code, topup, Result.new(status: 'applied', message: describe(value, plan_code), response: response))
  rescue MeisimService::Error => e
    status = e.ambiguous? && offer ? 'unknown' : 'failed'
    message = status == 'unknown' ? "No clear answer from MeiSIM (#{e.message}). Check the MeiSIM portal before trying again." : e.message
    record(network, line, value, plan_code, topup, Result.new(status: status, message: message))
  end

  # A plan must be one MeiSIM listed for the line; plain credit must be a listed amount, and
  # on a line that has plans it is asked for by name (creditOnly).
  def validate_choice!(offer, value, plan_code)
    if plan_code.present?
      raise Refused, "#{plan_code} is not one of this line's plans" unless offer[:plans].any? { |p| p[:code] == plan_code }

      return false
    end
    if offer[:plans].empty? && offer[:credit_amounts].empty?
      raise Refused, 'MeiSIM offered no plans or amounts for this line'
    end
    unless offer[:credit_amounts].any? { |amount| amount.to_d == value.to_d }
      raise Refused, "#{value} is not one of this line's credit amounts (#{offer[:credit_amounts].join(', ')})"
    end

    offer[:plans].any?
  end

  def record(network, line, value, plan_code, topup, result)
    AuditLog.create!(action: AUDIT_ACTION, user_id: @actor.id, user_type: @actor.class.name,
                     auditable: topup || @actor,
                     object_changes: { network: network, line: line, value: value.to_s, plan_code: plan_code.presence,
                                       esim_topup_id: topup&.id, result: result.status, message: result.message,
                                       response: result.response })
    result
  end

  def describe(value, plan_code)
    plan_code.present? ? "plan #{plan_code} (#{value})" : "#{value} credit"
  end

  def line_params(line)
    digits = line.to_s.gsub(/[\s-]/, '')
    digits.match?(ICCID) ? { iccid: digits } : { number: line.to_s.strip }
  end

  # The list named `key`, at the top of the response or one level down.
  def list_in(body, key)
    return [] unless body.is_a?(Hash)

    found = body[key] || body.values.grep(Hash).filter_map { |v| v[key] }.first
    found.is_a?(Array) ? found : []
  end

  def plan(bundle)
    return unless bundle.is_a?(Hash) && bundle['BundleProductCode'].present?

    code = bundle['BundleProductCode'].to_s
    { code: code, name: bundle.values_at('BundleName', 'Name', 'Description').compact.first || code,
      value: bundle.values_at('BundleValue', 'Price', 'Amount', 'TopUpValue').compact.first }
  end

  # A listed credit amount as a plain number (20, 9.99).
  def credit(entry)
    amount = (entry.is_a?(Hash) ? entry.values_at('TopUpValue', 'Value', 'Amount').compact.first : entry).to_s.to_d
    return unless amount.positive?

    amount.frac.zero? ? amount.to_i : amount.to_f
  end
end

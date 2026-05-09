# frozen_string_literal: true

class InfrastructureMonthlyBillingJob < ApplicationJob
  queue_as :billing

  # Runs on the 1st of every month to consolidate usage and subscription fees
  # for infrastructure-tier resellers.
  def perform
    Reseller.infrastructure.find_each do |reseller|
      process_monthly_bill(reseller)
    end
  end

  private

  def process_monthly_bill(reseller)
    # Calculate for the previous month
    start_date = 1.month.ago.beginning_of_month
    end_date = 1.month.ago.end_of_month

    # 1. Aggregate Wholesale Costs for ALL orders (Self + Managed Users)
    # Since we credited them 100% of retail in real-time, we must collect the cost now.
    reseller_orders = reseller.orders.where(created_at: start_date..end_date)
    managed_user_orders = Order.where(orderable: reseller.managed_users, created_at: start_date..end_date)
    
    total_wholesale_cost = reseller_orders.sum(:cost_price) + managed_user_orders.sum(:cost_price)
    
    # 2. Negotiated Infrastructure Cost (Backend overhead)
    infra_cost = reseller.subscription_fee.to_f
    
    grand_total = (total_wholesale_cost + infra_cost).round(2)
    
    return if grand_total <= 0

    # 3. Create Consolidated Billing History Record
    history = BillingHistory.create!(
      billable: reseller,
      billing_period_start: start_date.to_date,
      billing_period_end: end_date.to_date,
      total_revenue: grand_total, # Wholesale Cost + Negotiated Fee
      amount_due: grand_total,
      amount_paid: 0,
      status: 'pending',
      currency: 'USD',
      total_orders: reseller_orders.count + managed_user_orders.count,
      generated_at: Time.current
    )

    # 4. Attempt Auto-Payment from Unified Wallets
    attempt_payment(reseller, history)
  end

  def attempt_payment(reseller, history)
    amount = history.amount_due
    
    main_balance = reseller.main_wallet&.balance || 0
    earnings_balance = reseller.earnings_wallet&.balance || 0
    total_available = main_balance + earnings_balance

    if total_available >= amount
      ActiveRecord::Base.transaction do
        transaction = Transaction.create!(
          transactable: reseller,
          reference: history,
          amount: amount,
          transaction_type: 'debit',
          status: 'success',
          currency: 'USD',
          payment_gateway: 'wallet',
          description: "Monthly Infrastructure Bill (#{history.billing_period_start} to #{history.billing_period_end})",
          metadata: { billing_history_id: history.id }
        )

        # Deduct from earnings first (as per user's "transfer income is dumb" logic)
        if earnings_balance >= amount
          reseller.earnings_wallet.debit!(amount, "Monthly Bill Payment", { bill_id: history.id }, transaction)
        else
          # Use all earnings then take from main
          reseller.earnings_wallet.debit!(earnings_balance, "Monthly Bill Payment (Partial)", { bill_id: history.id }, transaction) if earnings_balance.positive?
          remainder = amount - earnings_balance
          reseller.main_wallet.debit!(remainder, "Monthly Bill Payment (Remainder)", { bill_id: history.id }, transaction)
        end

        history.update!(status: 'paid', amount_paid: amount, amount_due: 0)
        
        # After billing is done, the remaining balance in earnings is the profit available for payout
        reseller.update!(withdrawable_profit: (reseller.withdrawable_profit || 0) + reseller.earnings_wallet.balance)
      end
      
      NotificationService.notify(
        recipient: reseller,
        category: 'success',
        title: 'Monthly Bill Paid',
        message: "Your monthly infrastructure bill for $#{amount} has been paid from your wallets.",
        metadata: { billing_history_id: history.id }
      )
    else
      # Insufficient funds
      history.update!(status: 'overdue')
      
      NotificationService.notify(
        recipient: reseller,
        category: 'error',
        title: 'Monthly Bill Overdue',
        message: "Your monthly infrastructure bill for $#{amount} is overdue. Please top up your wallet to avoid service suspension.",
        metadata: { billing_history_id: history.id, amount_due: amount }
      )
      
      # Notify Admin of overdue reseller bill
      Employee.admins.find_each do |admin|
        NotificationService.notify(
          recipient: admin,
          category: 'system_alert',
          title: 'Reseller Bill Overdue',
          message: "Infrastructure reseller #{reseller.company_name} has an overdue bill of $#{amount}.",
          metadata: { reseller_id: reseller.id, billing_history_id: history.id }
        )
      end
    end
  end
end

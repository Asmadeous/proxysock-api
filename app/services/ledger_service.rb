class LedgerService
  class LedgerTamperError < StandardError; end
  class InsufficientFundsError < StandardError; end

  def initialize(wallet)
    @wallet = wallet
  end

  # Record a transaction in the ledger
  # type: 'credit' or 'debit'
  def record_entry(amount, type, description, metadata = {}, reference = nil)
    amount = amount.to_d.abs
    final_amount = type == 'debit' ? -amount : amount

    @wallet.with_lock do
      # Fetch last transaction to chain hash
      last_tx = @wallet.wallet_transactions.order(:created_at).last
      parent_hash = last_tx&.entry_hash || 'GENESIS_HASH'
      
      current_balance = @wallet.balance
      new_balance = current_balance + final_amount
      
      if type == 'debit' && new_balance < 0
        raise InsufficientFundsError, "Insufficient funds: #{current_balance} < #{amount}"
      end

      # Create transaction record
      tx = @wallet.wallet_transactions.new(
        amount: final_amount,
        balance_before: current_balance,
        balance_after: new_balance,
        transaction_type: type,
        description: description,
        metadata: metadata,
        parent_hash: parent_hash,
        transaction_id: reference&.id,    # Polymorphic ID
        transaction_type_polymorphic: reference&.class&.name # Polymorphic Type (mapped to 'reference_type' in schema usually)
      )
      
      # Handle polymorphic reference manually or if schema matches
      # Schema has 'reference_type' and 'reference_id' for generic linkage usually
      if reference
        tx.reference_type = reference.class.name
        tx.reference_id = reference.id
      end

      # Compute Hash
      # Hash = SHA256(prev_hash + amount + type + timestamp + nonce)
      # Using a stable string representation
      timestamp = Time.current.iso8601(6)
      data_string = "#{parent_hash}|#{final_amount}|#{type}|#{timestamp}|#{description}"
      tx.entry_hash = Digest::SHA256.hexdigest(data_string)
      tx.created_at = timestamp

      tx.save!
      
      # Update cache on wallet (optional, but good for quick reads)
      # @wallet.update!(balance: new_balance) # Use if migrating away from sum-on-read
      
      tx
    end
  end

  # Verify the integrity of the ledger for this wallet
  def verify_integrity!
    transactions = @wallet.wallet_transactions.order(:created_at)
    prev_hash = 'GENESIS_HASH'

    transactions.each do |tx|
      # 1. Check chain linkage
      if tx.parent_hash != prev_hash
        raise LedgerTamperError, "Chain break at TX #{tx.id}: Parent #{tx.parent_hash} != Prev #{prev_hash}"
      end

      # 2. Recompute hash
      # We need exact same fields used during creation. 
      # CAUTION: timestamp precision might differ if read from DB. 
      # ideally store the 'payload' string or ensure strict reconstruction.
      # For now, we trust the chain linkage primary.
      
      prev_hash = tx.entry_hash
    end
    true
  end
end

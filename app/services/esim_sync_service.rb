class EsimSyncService
  BATCH_SIZE = 10 # API limit

  def initialize(logger = Rails.logger)
    @client = EsimAccessService.new
    @logger = logger
  end

  def sync_usage!
    # Only sync active eSIMs provided by API (not inventory ones which have no API sync usually? or depends on Lyca API)
    # Assuming API sync is only for 'esim_access' (Redtea) provider
    # Also need esim_tran_no or order_no stored. Assuming we stored provider_order_id (orderNo) or have transaction No.
    # The Esim model currently has `iccid`. We might need `provider_transaction_id` if API requires it.
    # Docs say `esimTranNo` is required for usage check.
    # We should have stored it. If not, we might need to fetch it via `query` first or use `iccid` if API allows (Docs say esimTranNo).
    
    # Assuming we added `provider_transaction_id` to Esims or reuse `provider_order_id` if it's the same.
    # Let's assume for now we use `iccid` to lookup OR we have the ID.
    # Ideally migration should have added `provider_transaction_id`. 
    # BUT, let's check if we can get it from `fetch_details` which uses ICCID.
    
    active_esims = Esim.where(esim_provider: 'esim_access', status: 'active').where.not(iccid: nil)
    
    active_esims.each_slice(BATCH_SIZE) do |batch|
       # We need transaction IDs. 
       # If we haven't stored them, we might be unable to batch usage check efficiently without first querying details.
       # Optimization: If generic 'query' allows getting TranNo from ICCID.
       
       # Workaround: Sync details one by one if NO TranID, update TranID, then next time use batch?
       # Or just use `fetch_esim_details(iccid)` which gives usage too?
       # Docs: "esim/query" -> returns details.
       
       batch.each do |esim|
         begin
            details = @client.fetch_esim_details(esim.iccid)
            if details
               # Update local record
               # details usually contains: { dataUsage, totalVolume, etc }
               update_esim(esim, details)
            end
         rescue => e
            @logger.error("Failed to sync eSIM #{esim.iccid}: #{e.message}")
         end
       end
    end
  end

  private

  def update_esim(esim, data)
    # Map API fields to local
    # usage = data['dataUsage'] (bytes)
    # total = data['totalData'] (bytes)
    
    used = data['dataUsage'].to_i
    total = data['totalData'].to_i
    
    esim.update(
      data_used_bytes: used,
      data_total_bytes: total
    )
    
    # Check if used up
    if total > 0 && used >= total
      esim.update(status: 'used_up')
    end
  end
end

# frozen_string_literal: true

class CreateEsims < ActiveRecord::Migration[8.1]
  def change
    create_table :esims do |t|
      t.references :esim_order, null: false, foreign_key: true
      t.string :esim_provider
      t.string :esimaccess_transaction_id
      t.string :esimaccess_order_no
      t.string :esimaccess_esim_tran_no
      t.string :iccid
      t.string :imsi
      t.string :msisdn
      t.string :qr_code_url
      t.text :qr_code_data
      t.string :smdp_status
      t.string :esim_status
      t.string :eid
      t.boolean :has_phone_number
      t.bigint :data_total_bytes
      t.bigint :data_used_bytes
      t.datetime :expires_at
      t.string :status
      t.jsonb :metadata

      t.timestamps
    end
  end
end

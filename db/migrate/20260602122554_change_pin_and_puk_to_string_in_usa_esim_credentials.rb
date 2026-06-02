class ChangePinAndPukToStringInUsaEsimCredentials < ActiveRecord::Migration[8.1]
  def up
    change_column :usa_esim_credentials, :PIN1, :string, default: '1111', null: false
    change_column :usa_esim_credentials, :PIN2, :string, default: '2222', null: false
    change_column :usa_esim_credentials, :PUK1, :string, null: false
    change_column :usa_esim_credentials, :PUK2, :string, null: false
  end

  def down
    change_column :usa_esim_credentials, :PIN1, :bigint, default: 1111, null: false, using: '"PIN1"::bigint'
    change_column :usa_esim_credentials, :PIN2, :bigint, default: 2222, null: false, using: '"PIN2"::bigint'
    change_column :usa_esim_credentials, :PUK1, :bigint, null: false, using: '"PUK1"::bigint'
    change_column :usa_esim_credentials, :PUK2, :bigint, null: false, using: '"PUK2"::bigint'
  end
end

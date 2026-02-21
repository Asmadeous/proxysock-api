class CreateSupportChatMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :support_chat_messages do |t|
      t.references :support_chat, null: false, foreign_key: true
      t.references :sender, polymorphic: true, null: false
      t.text :body
      t.datetime :read_at

      t.timestamps
    end
  end
end

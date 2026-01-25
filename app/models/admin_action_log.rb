class AdminActionLog < ApplicationRecord
  belongs_to :employee
  belongs_to :target, polymorphic: true
end

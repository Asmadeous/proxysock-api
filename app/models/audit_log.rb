class AuditLog < ApplicationRecord
  belongs_to :auditable, polymorphic: true
end

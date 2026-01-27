# frozen_string_literal: true

class UserImpersonationLog < ApplicationRecord
  belongs_to :employee
  belongs_to :user
end

# frozen_string_literal: true

# Runs a side effect only after the current (outermost) DB transaction commits,
# or immediately if no transaction is open.
#
# Use this for anything that acts on the OUTSIDE world based on data you just
# wrote — websocket broadcasts, cache invalidation, enqueuing refetch signals,
# external API calls. Doing those inline risks acting on data that can still be
# rolled back, and (for broadcasts) makes clients refetch BEFORE the rows are
# visible — the classic "websocket fired but the data isn't there yet" bug.
#
# Guidance:
#   - In MODEL code, prefer `after_commit`/`after_create_commit` callbacks.
#   - In SERVICE / CONTROLLER / JOB code (where you may be nested inside a
#     transaction opened elsewhere), use AfterCommit.run.
#
#   AfterCommit.run do
#     SomeChannel.broadcast_to(user, payload)
#     Rails.cache.delete(key)
#   end
module AfterCommit
  def self.run(&block)
    raise ArgumentError, 'AfterCommit.run requires a block' unless block

    ActiveRecord.after_all_transactions_commit(&block)
  end
end

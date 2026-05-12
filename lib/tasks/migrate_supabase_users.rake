# frozen_string_literal: true

namespace :migrate do
  desc 'Migrate users from Supabase (auth.users + public.profiles) to Rails'
  task supabase_users: :environment do
    # ─── Configuration ───────────────────────────────────────────────
    supabase_url = ENV.fetch('SUPABASE_DB_URL') do
      abort <<~MSG
        ✖ SUPABASE_DB_URL not set.

        Usage:
          SUPABASE_DB_URL="postgres://user:pass@host:port/dbname" bin/rails migrate:supabase_users

        You can find your Supabase DB URL in:
          Supabase Dashboard → Project Settings → Database → Connection string (URI)
      MSG
    end

    dry_run = ENV.fetch('DRY_RUN', 'false') == 'true'

    puts '=' * 60
    puts dry_run ? '🔍 DRY RUN MODE (no records will be created)' : '🚀 LIVE MIGRATION'
    puts '=' * 60

    # ─── Connect to Supabase ─────────────────────────────────────────
    require 'pg'

    begin
      supabase = PG.connect(supabase_url)
      puts '✔ Connected to Supabase database'
    rescue PG::Error => e
      abort "✖ Failed to connect to Supabase: #{e.message}"
    end

    # ─── Fetch users from Supabase ───────────────────────────────────
    # Only fields that exist in Supabase:
    #   auth.users:      id, email, encrypted_password, email_confirmed_at, created_at, updated_at
    #   public.profiles: id, role, username, city, country, email, balance, created_at, updated_at
    query = <<~SQL
      SELECT
        au.id,
        au.email,
        au.encrypted_password,
        au.email_confirmed_at,
        au.created_at    AS auth_created_at,
        au.updated_at    AS auth_updated_at,
        p.username,
        p.city,
        p.country,
        p.role,
        p.balance,
        p.created_at     AS profile_created_at,
        p.updated_at     AS profile_updated_at
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.id = au.id
      ORDER BY au.created_at ASC
    SQL

    rows = supabase.exec(query)
    total = rows.ntuples
    puts "📋 Found #{total} users in Supabase"

    if total.zero?
      puts 'Nothing to migrate.'
      supabase.close
      next
    end

    # ─── Migration counters ──────────────────────────────────────────
    created   = 0
    skipped   = 0
    failed    = 0
    balances_credited = 0
    errors = []

    # ─── Process each user ───────────────────────────────────────────
    rows.each_with_index do |row, index|
      supabase_id = row['id']
      email       = row['email']&.downcase&.strip
      progress    = "[#{index + 1}/#{total}]"

      # Skip if already migrated (by UUID or email)
      if User.exists?(id: supabase_id) || (email.present? && User.exists?(email: email))
        puts "#{progress} ⏭  Skipping #{email} (already exists)"
        skipped += 1
        next
      end

      # Username: from profiles, or derive from email
      username = row['username'] || email&.split('@')&.first
      base_username = username || "user_#{SecureRandom.hex(4)}"
      final_username = base_username
      counter = 0
      while User.where('LOWER(username) = ?', final_username.downcase).exists?
        counter += 1
        final_username = "#{base_username}_#{counter}"
      end

      # Supabase bcrypt hashes ($2a$) are compatible with Rails has_secure_password
      password_digest = row['encrypted_password']

      email_verified_at = row['email_confirmed_at'].present? ? Time.parse(row['email_confirmed_at']) : nil

      balance = BigDecimal(row['balance'] || '0')

      # Only Rails users table columns
      attrs = {
        id: supabase_id,
        email: email,
        username: final_username,
        first_name: 'User', # Not in Supabase — default
        last_name: 'Migrated', # Not in Supabase — default
        password_digest: password_digest,
        city: row['city'],
        country: row['country'],
        status: 'active',
        owner_type: 'platform',
        email_verified_at: email_verified_at,
        metadata: { migrated_from: 'supabase', supabase_role: row['role'], migrated_at: Time.current.iso8601 },
        created_at: Time.parse(row['profile_created_at'] || row['auth_created_at']),
        updated_at: Time.parse(row['profile_updated_at'] || row['auth_updated_at'])
      }

      if dry_run
        puts "#{progress} 🔍 Would create: #{email} (#{final_username}) balance=$#{balance}"
        created += 1
        balances_credited += 1 if balance.positive?
        next
      end

      begin
        ActiveRecord::Base.transaction do
          user = User.new(attrs)
          user.save!(validate: false)

          # Credit Supabase balance into wallet (auto-created via after_create)
          if balance.positive? && user.wallet.present?
            user.wallet.credit!(
              balance,
              'Migrated balance from Supabase',
              { source: 'supabase_migration', original_balance: balance.to_s }
            )
            balances_credited += 1
          end

          puts "#{progress} ✔ Created: #{email} (#{final_username}) balance=$#{balance}"
          created += 1
        end
      rescue StandardError => e
        failed += 1
        error_msg = "#{progress} ✖ Failed: #{email} — #{e.message}"
        errors << error_msg
        puts error_msg
      end
    end

    supabase.close

    # ─── Summary ─────────────────────────────────────────────────────
    puts ''
    puts '=' * 60
    puts "Migration Summary#{' (DRY RUN)' if dry_run}"
    puts '=' * 60
    puts "  Total in Supabase:    #{total}"
    puts "  Created:              #{created}"
    puts "  Skipped (existing):   #{skipped}"
    puts "  Failed:               #{failed}"
    puts "  Balances credited:    #{balances_credited}"
    puts '=' * 60

    if errors.any?
      puts ''
      puts '⚠ Errors:'
      errors.each { |e| puts "  #{e}" }
    end

    puts ''
    puts dry_run ? 'Run without DRY_RUN=true to execute for real.' : '✔ Migration complete!'
  end
end

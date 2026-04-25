# frozen_string_literal: true

puts '🌱 Seeding Users, Employees, Resellers, and Affiliates...'

# ─── Regular Users ───────────────────────────────────────────────────────────

users = [
  { first_name: 'Demo',    last_name: 'User',      email: 'ndegwaian001@gmail.com',   username: 'demo', country_code: 'US', city: 'New York' },
  { first_name: 'Alice',   last_name: 'Johnson',   email: 'alice@proxysock.com',      username: 'alice_j', country_code: 'GB', city: 'London' },
  { first_name: 'Bob',     last_name: 'Smith',     email: 'bob@proxysock.com',        username: 'bob_smith', country_code: 'CA', city: 'Toronto' },
  { first_name: 'Carol',   last_name: 'Williams',  email: 'carol@proxysock.com',      username: 'carol_w', country_code: 'AU', city: 'Sydney' },
  { first_name: 'David',   last_name: 'Brown',     email: 'david@proxysock.com',      username: 'david_b', country_code: 'DE', city: 'Berlin' },
  { first_name: 'Eva',     last_name: 'Martinez',  email: 'eva@proxysock.com',        username: 'eva_m', country_code: 'ES', city: 'Madrid' },
  { first_name: 'Frank',   last_name: 'Lee',       email: 'frank@proxysock.com',      username: 'frank_lee', country_code: 'KR', city: 'Seoul' },
  { first_name: 'Grace',   last_name: 'Kim',       email: 'grace@proxysock.com',      username: 'grace_k', country_code: 'JP', city: 'Tokyo' },
  { first_name: 'Test',    last_name: 'Customer',  email: 'test@proxysock.com',       username: 'testcustomer', country_code: 'US', city: 'San Francisco' }
]

users.each do |attrs|
  user = User.find_or_initialize_by(email: attrs[:email])
  user.assign_attributes(attrs.merge(
                           password: 'Password123!',
                           password_confirmation: 'Password123!',
                           status: 'active',
                           email_verified_at: Time.current
                         ))
  user.save!
end

puts "  ✅ #{User.count} users"

# ─── Departments ─────────────────────────────────────────────────────────────

support_dept    = Department.find_or_create_by!(name: 'Support')
management_dept = Department.find_or_create_by!(name: 'Management')
sales_dept      = Department.find_or_create_by!(name: 'Sales')
ops_dept        = Department.find_or_create_by!(name: 'Operations')

# ─── Employees ───────────────────────────────────────────────────────────────

begin
  employees = [
    { first_name: 'Super',   last_name: 'Admin', email: 'admin@proxysock.com', role: 'admin', active: true,
      department: management_dept },
    { first_name: 'Test',    last_name: 'Employee',  email: 'employee@proxysock.com',  role: 'support', active: true,
      department: support_dept },
    { first_name: 'Sarah',   last_name: 'Connor',    email: 'sarah@proxysock.com',     role: 'support', active: true,
      department: support_dept },
    { first_name: 'James',   last_name: 'Wilson',    email: 'james@proxysock.com',     role: 'sales',   active: true,
      department: sales_dept },
    { first_name: 'Nina',    last_name: 'Patel',     email: 'nina@proxysock.com',      role: 'ops',     active: true,
      department: ops_dept }
  ]

  employees.each do |attrs|
    emp = Employee.find_or_initialize_by(email: attrs[:email])
    emp.assign_attributes(attrs.merge(password: 'Password123!', password_confirmation: 'Password123!'))
    emp.save!
  end

  puts "  ✅ #{Employee.count} employees"
rescue NameError
  puts '  ⚠️  Employee model not found, skipping.'
end

# ─── Resellers ────────────────────────────────────────────────────────────────

begin
  resellers = [
    { email: 'reseller@proxysock.com', username: 'testreseller', company_name: 'Reseller Inc.',
      discount_percentage: 10.0, country_code: 'US', city: 'Delaware', reseller_type: 'api_only' },
    { email: 'infra_reseller@proxysock.com', username: 'infra_pro', company_name: 'Global Infrastructure Ltd.',
      discount_percentage: 20.0, country_code: 'GB', city: 'London', reseller_type: 'infrastructure',
      infrastructure_surcharge_percentage: 5.0, subscription_fee: 499.99 },
    { email: 'vps_only_reseller@proxysock.com', username: 'vps_expert', company_name: 'VPS Specialty Reseller',
      discount_percentage: 15.0, country_code: 'CA', city: 'Toronto', reseller_type: 'single_product',
      allowed_product_category: ProductCategory.find_by(slug: 'vps') }
  ]

  resellers.each do |attrs|
    r = Reseller.find_or_initialize_by(email: attrs[:email])
    r.assign_attributes(attrs.merge(password: 'Password123!', password_confirmation: 'Password123!'))
    r.save!
  end

  puts "  ✅ #{Reseller.count} resellers"
rescue NameError
  puts '  ⚠️  Reseller model not found, skipping.'
end

# ─── Affiliates ───────────────────────────────────────────────────────────────

begin
  affiliate_users = User.where(email: ['test@proxysock.com', 'alice@proxysock.com', 'bob@proxysock.com'])

  affiliate_data = {
    'test@proxysock.com' => { code: 'PROXY_TEST', commission: 10.0 },
    'alice@proxysock.com' => { code: 'ALICE_REF', commission: 12.0 },
    'bob@proxysock.com' => { code: 'BOB_REFER', commission: 8.0 }
  }

  affiliate_users.each do |u|
    data = affiliate_data[u.email]
    Affiliate.find_or_create_by!(affiliatable: u) do |a|
      a.referral_code      = data[:code]
      a.commission_rate    = data[:commission]
    end
  end

  puts "  ✅ #{Affiliate.count} affiliates"
rescue NameError
  puts '  ⚠️  Affiliate model not found, skipping.'
end

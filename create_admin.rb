# Create Department if not exists
dept = Department.find_or_create_by!(name: 'Headquarters')

# Create Admin Employee
admin = Employee.find_or_create_by!(email: 'admin@proxysock.com') do |e|
  e.first_name = 'Admin'
  e.last_name = 'User'
  e.department = dept
  e.role = 'admin'
  e.active = true
  e.password = 'password123'
  e.work_email = 'admin@proxysock.com'
end

# Generate JWT
token = admin.generate_jwt

puts "\n"
puts "=" * 50
puts "Admin User Created: #{admin.email}"
puts "JWT Token:"
puts token
puts "=" * 50
puts "\n"

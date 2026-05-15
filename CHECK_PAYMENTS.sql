-- Check for existing payment requests
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_payments
FROM payment_requests;

-- Show all pending payments with details
SELECT 
  pr.id,
  pr.user_id,
  up.email,
  up.full_name,
  pr.plan_id,
  sp.name as plan_name,
  pr.amount,
  pr.payment_method,
  pr.status,
  pr.requested_at
FROM payment_requests pr
LEFT JOIN user_profiles up ON pr.user_id = up.id
LEFT JOIN subscription_plans sp ON pr.plan_id = sp.id
WHERE pr.status = 'pending'
ORDER BY pr.requested_at DESC;

-- Check subscription plans
SELECT id, name, amount, duration_days, is_active FROM subscription_plans ORDER BY amount;

-- Check user count and roles
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'agent' THEN 1 END) as agent_count,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
FROM user_profiles;

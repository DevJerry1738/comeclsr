-- Verify admin user and permissions
SELECT 
  COUNT(*) as admin_count,
  STRING_AGG(id::text, ', ') as admin_ids,
  STRING_AGG(email, ', ') as admin_emails
FROM public.user_profiles 
WHERE role = 'admin';

-- Check all users and their roles
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at
FROM public.user_profiles
ORDER BY role DESC, created_at DESC
LIMIT 20;

-- Verify payment_requests RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('payment_requests', 'user_profiles', 'subscription_plans');

-- Check RLS policies on payment_requests
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'payment_requests'
ORDER BY policyname;

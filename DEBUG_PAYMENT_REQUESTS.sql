-- Test RPC function and check admin_settings
-- Run these queries in Supabase SQL Editor

-- 1. Check if admin_settings has data
SELECT id, message_cost_rate, minimum_deposit_amount FROM public.admin_settings LIMIT 5;

-- 2. Check if table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'payment_requests'
) AS payment_requests_exists;

-- 3. Check current auth user
SELECT auth.uid() AS current_user_id;

-- 4. Try creating a payment request directly (as admin/service role)
-- This should work if RLS policies are correct
INSERT INTO public.payment_requests (
  user_id,
  plan_id,
  payment_method,
  amount,
  credits_to_grant,
  status,
  requested_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  NULL,
  'bank_transfer',
  50.00,
  NULL,
  'pending',
  now()
)
RETURNING id, amount, status;

-- 5. Verify payment_requests was created
SELECT * FROM public.payment_requests ORDER BY created_at DESC LIMIT 1;

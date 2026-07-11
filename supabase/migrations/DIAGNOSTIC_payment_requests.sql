-- Diagnostic script to verify payment_requests setup
-- Run this in Supabase SQL Editor to debug the 400 error

-- 1. Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'payment_requests';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'payment_requests'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_requests';

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'payment_requests';

-- 5. Check if payment_create_custom_deposit function exists
SELECT routine_schema, routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'payment_create_custom_deposit';

-- 6. Check function signature
\df payment_create_custom_deposit

-- 7. Test the RPC function manually (as authenticated user)
-- This will show the actual error if something is wrong
SELECT public.payment_create_custom_deposit(50.00, 'bank_transfer');

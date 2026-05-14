-- 20260527_fix_payment_requests_fk.sql
-- Fix payment_requests foreign key to reference user_profiles instead of auth.users

-- Drop the old foreign key constraint
ALTER TABLE public.payment_requests 
DROP CONSTRAINT IF EXISTS payment_requests_user_id_fkey;

-- Add the new foreign key constraint referencing user_profiles
ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Also fix confirmed_by_admin_id to reference user_profiles instead of auth.users
ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS payment_requests_confirmed_by_admin_id_fkey;

ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_confirmed_by_admin_id_fkey
FOREIGN KEY (confirmed_by_admin_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

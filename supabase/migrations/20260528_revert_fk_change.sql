-- 20260528_revert_fk_change.sql
-- Revert the foreign key change - user_id must reference auth.users for auth to work

-- Drop the incorrect foreign key
ALTER TABLE public.payment_requests 
DROP CONSTRAINT IF EXISTS payment_requests_user_id_fkey;

-- Restore the correct foreign key referencing auth.users
ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also fix confirmed_by_admin_id to reference auth.users instead of user_profiles  
ALTER TABLE public.payment_requests
DROP CONSTRAINT IF EXISTS payment_requests_confirmed_by_admin_id_fkey;

ALTER TABLE public.payment_requests
ADD CONSTRAINT payment_requests_confirmed_by_admin_id_fkey
FOREIGN KEY (confirmed_by_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

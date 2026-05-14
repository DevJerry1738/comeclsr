-- 20260533_drop_user_profiles_auth_fk.sql
-- Remove the foreign key constraint from user_profiles.id to auth.users
-- This allows creating agent profiles without auth.users entries
-- Agents can still authenticate later when they self-register or when linked to auth

-- Step 1: Drop all dependent foreign keys
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_user_id_fkey;
ALTER TABLE public.kyc_submissions DROP CONSTRAINT IF EXISTS kyc_submissions_user_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_user_id_fkey;
ALTER TABLE public.ticket_replies DROP CONSTRAINT IF EXISTS ticket_replies_sender_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.user_requests DROP CONSTRAINT IF EXISTS user_requests_user_id_fkey;
ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_user_id_fkey;
ALTER TABLE public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_confirmed_by_admin_id_fkey;

-- Step 2: Drop the FK from user_profiles to auth.users
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Step 3: Re-add all FKs, but now pointing to user_profiles.id (not auth.users.id)
ALTER TABLE public.agents 
ADD CONSTRAINT agents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.kyc_submissions 
ADD CONSTRAINT kyc_submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ticket_replies 
ADD CONSTRAINT ticket_replies_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_requests 
ADD CONSTRAINT user_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_confirmed_by_admin_id_fkey 
FOREIGN KEY (confirmed_by_admin_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Note: Regular users will still link to auth.users via custom auth triggers
-- Agents created via RPC will have profiles but no auth.users entry (for later linking)

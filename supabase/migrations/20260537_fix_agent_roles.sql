-- 20260537_fix_agent_roles.sql
-- Fix: Update seeded agents from role='user' to role='agent'

UPDATE public.user_profiles
SET role = 'agent'
WHERE email LIKE 'agent_%@comeclsr.com'
  AND role = 'user';

-- Verify the update
SELECT email, role FROM public.user_profiles 
WHERE email LIKE 'agent_%@comeclsr.com'
ORDER BY email;

-- 20260560_fix_agents_rls_for_service_role.sql
-- FIX: Allow service_role to insert into agents table without admin check
-- Problem: admin_create_agent_record RPC function fails because RLS policy
-- requires is_admin() check which fails for service_role during RPC calls

-- Drop existing policy that requires admin check
DROP POLICY IF EXISTS "Admins create agents" ON public.agents;

-- Create new policy that allows:
-- 1. Admin users (via is_admin check)
-- 2. Service role (for Edge Functions and RPC functions)
CREATE POLICY "Admins and service_role can create agents"
  ON public.agents
  FOR INSERT
  WITH CHECK (
    -- Allow if user is admin
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid())
    OR
    -- Allow if caller is service_role (for Edge Functions and RPC)
    auth.role() = 'service_role'
  );

-- Also ensure service_role can execute the RPC function
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO authenticated;

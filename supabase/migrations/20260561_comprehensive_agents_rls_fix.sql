-- 20260561_comprehensive_agents_rls_fix.sql
-- COMPREHENSIVE FIX: Ensure agents RLS policies work correctly for all roles
-- Issue: Agent seeding failing (0 agents seeded, 15 failed)
-- Root Cause: Possible old policy still active or permission issues

-- ============================================================================
-- STEP 1: Drop ALL existing agents policies to ensure clean state
-- ============================================================================
DROP POLICY IF EXISTS "Admins create agents" ON public.agents;
DROP POLICY IF EXISTS "Admins and service_role can create agents" ON public.agents;
DROP POLICY IF EXISTS "Users view assigned agent" ON public.agents;
DROP POLICY IF EXISTS "Admins update agents" ON public.agents;

-- ============================================================================
-- STEP 2: Recreate ALL agents policies with proper permissions
-- ============================================================================

-- Users and admins can view agents (for agent selection in UI)
CREATE POLICY "All authenticated can view agents"
  ON public.agents
  FOR SELECT
  TO authenticated
  USING (true); -- All authenticated users can see all agents

-- Service role and admins can create agents (for seeding and admin creation)
CREATE POLICY "Service role and admins can create agents"
  ON public.agents
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Service role and admins can update agents
CREATE POLICY "Service role and admins can update agents"
  ON public.agents
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1)
  );

-- ============================================================================
-- STEP 3: Ensure function has correct permissions
-- ============================================================================
-- Make sure the admin_create_agent_record function has execute permission for service_role
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO anon;

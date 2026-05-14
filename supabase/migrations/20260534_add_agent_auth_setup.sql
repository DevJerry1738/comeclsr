-- 20260534_add_agent_auth_setup.sql
-- Create a function to set up authentication for agents
-- This requires being called with a service role client from the frontend

-- Function to check if an agent can authenticate (for debugging)
CREATE OR REPLACE FUNCTION public.agent_auth_status(p_email TEXT)
RETURNS jsonb AS $$
DECLARE
  v_profile_exists BOOLEAN;
  v_auth_exists BOOLEAN;
  v_profile_id UUID;
BEGIN
  -- Check if profile exists
  SELECT id INTO v_profile_id FROM public.user_profiles 
  WHERE email = p_email AND role = 'agent' LIMIT 1;
  
  v_profile_exists := v_profile_id IS NOT NULL;
  
  -- Note: We can't query auth.users directly from SQL
  -- This function just confirms the profile exists
  
  RETURN jsonb_build_object(
    'email', p_email,
    'profile_exists', v_profile_exists,
    'profile_id', v_profile_id,
    'message', CASE 
      WHEN NOT v_profile_exists THEN 'Agent profile not found'
      WHEN v_profile_exists THEN 'Agent profile exists. Auth user must be created via Supabase dashboard or API'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.agent_auth_status(TEXT) TO authenticated;

-- Alternative: Store the agent credentials in a temporary table for admin reference
-- (In production, this should be encrypted and have a TTL)
CREATE TABLE IF NOT EXISTS public.agent_credentials_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email VARCHAR(320) NOT NULL UNIQUE,
  agent_username VARCHAR(100) NOT NULL UNIQUE,
  generated_password VARCHAR(100) NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  auth_user_created_at TIMESTAMP WITH TIME ZONE,
  auth_verified BOOLEAN DEFAULT FALSE
);

-- Enable RLS on this table
ALTER TABLE public.agent_credentials_pending ENABLE ROW LEVEL SECURITY;

-- Only admins can view pending credentials
CREATE POLICY "admin_view_pending_credentials"
  ON public.agent_credentials_pending
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'));

-- Only the system can insert (via RPC)
CREATE POLICY "system_insert_pending_credentials"
  ON public.agent_credentials_pending
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE); -- No direct inserts allowed

CREATE POLICY "admin_update_pending_credentials"
  ON public.agent_credentials_pending
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'admin'));

-- Insert credentials into the pending table when agent is created
-- Note: This would need to be called separately or integrated into the agent_create_account function
CREATE OR REPLACE FUNCTION public.record_agent_credentials(
  p_agent_email TEXT,
  p_agent_username TEXT,
  p_agent_password TEXT,
  p_profile_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.agent_credentials_pending (
    agent_email,
    agent_username,
    generated_password,
    profile_id
  )
  VALUES (
    p_agent_email,
    p_agent_username,
    p_agent_password,
    p_profile_id
  )
  ON CONFLICT (agent_email) DO UPDATE
  SET generated_password = EXCLUDED.generated_password,
      created_at = NOW(),
      auth_verified = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_agent_credentials(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- RPC function to update agent profile with admin auth bypass
-- This function uses SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION public.update_agent_profile(
  p_agent_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_profile_photo TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify that the requester is an admin
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Verify that the target user is an agent
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_agent_id AND role = 'agent') THEN
    RAISE EXCEPTION 'Agent not found';
  END IF;

  -- Update the agent profile
  UPDATE public.user_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    profile_photo = COALESCE(p_profile_photo, profile_photo),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_agent_id
  RETURNING to_jsonb(public.user_profiles.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_agent_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

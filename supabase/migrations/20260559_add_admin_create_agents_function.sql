-- 20260559_add_admin_create_agents_function.sql
-- Add admin function to bypass RLS when creating agents from Edge Functions

CREATE OR REPLACE FUNCTION public.admin_create_agent_record(
  p_user_id UUID,
  p_username VARCHAR,
  p_display_name VARCHAR
)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  username VARCHAR
) AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  INSERT INTO public.agents (
    user_id,
    username,
    display_name,
    bio,
    profile_photo,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_username,
    p_display_name,
    NULL,
    NULL,
    'active',
    NOW(),
    NOW()
  )
  RETURNING agents.id, agents.user_id, agents.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;

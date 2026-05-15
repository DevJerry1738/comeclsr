-- 20260562_fix_admin_create_agent_record_return_type.sql
-- FIX: Change admin_create_agent_record return type from TABLE to jsonb
-- Issue: TABLE return type doesn't work well with Supabase client
-- Solution: Use jsonb return type instead

DROP FUNCTION IF EXISTS public.admin_create_agent_record(UUID, VARCHAR, VARCHAR);

CREATE FUNCTION public.admin_create_agent_record(
  p_user_id UUID,
  p_username VARCHAR,
  p_display_name VARCHAR
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
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
  RETURNING jsonb_build_object(
    'id', agents.id,
    'user_id', agents.user_id,
    'username', agents.username
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO anon;

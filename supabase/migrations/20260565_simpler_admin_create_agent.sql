-- 20260565_simpler_admin_create_agent.sql
-- SIMPLER FIX: Replace admin_create_agent_record with a straightforward version
-- Issue: Previous version might be too complex or have undiscovered constraints
-- Solution: Use simpler INSERT directly without SECURITY DEFINER complexity

DROP FUNCTION IF EXISTS public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION public.admin_create_agent_record(
  p_user_id UUID,
  p_username VARCHAR,
  p_display_name VARCHAR
)
RETURNS jsonb AS $$
DECLARE
  v_agent_id INTEGER;
  v_error_code TEXT;
  v_error_msg TEXT;
BEGIN
  -- Input validation
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'p_user_id is NULL'
    );
  END IF;
  
  IF p_username IS NULL OR p_username = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'p_username is NULL or empty'
    );
  END IF;
  
  -- Try to insert the agent record
  BEGIN
    INSERT INTO public.agents (
      user_id,
      username,
      display_name,
      status,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_username,
      p_display_name,
      'active',
      NOW(),
      NOW()
    )
    RETURNING agents.id INTO v_agent_id;
    
    -- Success - return the agent ID
    RETURN jsonb_build_object(
      'success', true,
      'id', v_agent_id,
      'user_id', p_user_id,
      'username', p_username,
      'message', 'Agent created successfully'
    );
    
  EXCEPTION WHEN unique_violation THEN
    -- Check which constraint was violated
    IF p_username IN (SELECT username FROM public.agents WHERE username = p_username) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Username already exists: ' || p_username
      );
    ELSIF p_user_id IN (SELECT user_id FROM public.agents WHERE user_id = p_user_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Agent already exists for this user'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Unique constraint violation'
      );
    END IF;
    
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found (foreign key constraint)'
    );
    
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_code = RETURNED_SQLSTATE, v_error_msg = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error [' || v_error_code || ']: ' || v_error_msg
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_agent_record(UUID, VARCHAR, VARCHAR) TO anon;

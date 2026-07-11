-- 20260624110000_fix_admin_delete_user.sql
-- Fix admin_delete_user to explicitly delete from user_profiles since the FK to auth.users was previously dropped.

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Get user info before deletion for the result
  SELECT to_jsonb(up.*) INTO v_result
  FROM public.user_profiles up
  WHERE id = p_user_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Delete from user_profiles to trigger cascades to all other tables
  DELETE FROM public.user_profiles WHERE id = p_user_id;
  
  -- Delete from auth.users to completely revoke login access
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'User completely deleted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

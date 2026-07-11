-- 20260624100000_admin_users_updates.sql
-- Update admin_get_users to only return users (no agents/admins) and include credit balance
-- Update admin_delete_user to hard-delete from auth.users

DROP FUNCTION IF EXISTS public.admin_get_users(INT, INT);

-- ============================================================================
-- RPC: admin_get_users
-- Returns paginated list of regular users with their profiles and credit balance
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_get_users(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  full_name VARCHAR,
  email VARCHAR,
  role TEXT,
  status TEXT,
  kyc_status TEXT,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  credit_balance NUMERIC
) AS $$
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.username,
    up.full_name,
    up.email,
    up.role,
    up.status,
    up.kyc_status,
    up.payment_status,
    up.created_at,
    up.last_sign_in_at,
    COALESCE(uc.balance, 0)::NUMERIC AS credit_balance
  FROM public.user_profiles up
  LEFT JOIN public.user_credits uc ON uc.user_id = up.id
  WHERE up.role = 'user'
  ORDER BY up.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_delete_user
-- Hard delete user completely from the database (auth.users and cascaded data)
-- ============================================================================
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

  -- Delete from auth.users (this should cascade to user_profiles and other tables)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'User completely deleted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

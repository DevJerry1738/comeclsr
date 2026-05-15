-- Admin RPC Functions
-- All functions require admin role (verified via auth.uid() and user_profiles.role)

-- ============================================================================
-- Helper: Check if current user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_dashboard_stats
-- Returns dashboard statistics: user counts, agent stats, conversation summary
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify admin role
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'user'),
    'totalAgents', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'agent'),
    'activeConversations', (SELECT COUNT(*) FROM public.conversations WHERE status = 'active'),
    'pendingKYC', (SELECT COUNT(*) FROM public.kyc_submissions WHERE status = 'pending'),
    'pendingPayments', (SELECT COUNT(*) FROM public.payments WHERE status = 'pending'),
    'totalPaymentsAmount', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'approved'),
    'openTickets', (SELECT COUNT(*) FROM public.tickets WHERE status IN ('open', 'in_progress')),
    'totalTickets', (SELECT COUNT(*) FROM public.tickets),
    'adminCount', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'admin'),
    'blockedUsers', (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'blocked')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_get_users
-- Returns paginated list of all users with their profiles
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
  last_sign_in_at TIMESTAMP WITH TIME ZONE
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
    up.last_sign_in_at
  FROM public.user_profiles up
  ORDER BY up.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_update_user
-- Updates user profile fields (role, status, etc.)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id UUID,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_kyc_status TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.user_profiles
  SET
    role = COALESCE(p_role, role),
    status = COALESCE(p_status, status),
    kyc_status = COALESCE(p_kyc_status, kyc_status),
    payment_status = COALESCE(p_payment_status, payment_status),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING to_jsonb(public.user_profiles.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_delete_user
-- Soft delete user (marks as blocked/inactive)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.user_profiles
  SET
    status = 'blocked',
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING to_jsonb(public.user_profiles.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_reset_password
-- Admin can reset user password via auth.users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_reset_password(
  p_user_id UUID,
  p_new_password VARCHAR
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Update password in auth.users
  UPDATE auth.users
  SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING to_jsonb(auth.users.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found in auth';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Password reset successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_create_notification
-- Creates a notification for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_create_notification(
  p_user_id UUID,
  p_title VARCHAR,
  p_message TEXT,
  p_type TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_id BIGINT;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (p_user_id, p_title, p_message, p_type)
  RETURNING id INTO v_id;

  SELECT to_jsonb(public.notifications.*) INTO v_result
  FROM public.notifications
  WHERE id = v_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_get_user_requests
-- Returns paginated list of user requests (KYC, payments, etc.)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_get_user_requests(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  username VARCHAR,
  type TEXT,
  message TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    ur.id,
    ur.user_id,
    up.username,
    ur.type,
    ur.message,
    ur.status,
    ur.created_at
  FROM public.user_requests ur
  JOIN public.user_profiles up ON ur.user_id = up.id
  ORDER BY ur.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: admin_update_request_status
-- Updates user request status (pending → approved/rejected)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_request_status(
  p_request_id BIGINT,
  p_status TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.user_requests
  SET status = p_status
  WHERE id = p_request_id
  RETURNING to_jsonb(public.user_requests.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

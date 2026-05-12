-- 20260521_payment_rpcs.sql
-- Payment and subscription management RPC functions

-- ============================================================================
-- Helper: generate_random_password
-- Generate a random alphanumeric password of specified length
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_random_password(p_length INT DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
  v_password TEXT := '';
  v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_i INT;
BEGIN
  FOR v_i IN 1..p_length LOOP
    v_password := v_password || substr(v_chars, (floor(random() * length(v_chars)))::INT + 1, 1);
  END LOOP;
  RETURN v_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: subscription_get_current_plan
-- Returns current subscription plan info for authenticated user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.subscription_get_current_plan()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'planId', sp.id,
    'planName', sp.name,
    'amount', sp.amount,
    'durationDays', sp.duration_days,
    'status', COALESCE(us.status, 'none'),
    'isActive', us.status = 'active' AND us.expires_at > NOW()
  ) INTO v_result
  FROM public.subscription_plans sp
  LEFT JOIN public.user_subscriptions us ON us.plan_id = sp.id AND us.user_id = auth.uid()
  ORDER BY sp.created_at DESC
  LIMIT 1;

  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'planId', NULL,
      'planName', NULL,
      'amount', 99.99,
      'durationDays', 30,
      'status', 'none',
      'isActive', FALSE
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: subscription_get_user_status
-- Returns user's subscription status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.subscription_get_user_status()
RETURNS jsonb AS $$
DECLARE
  v_status TEXT;
  v_sub RECORD;
  v_result jsonb;
BEGIN
  SELECT us.* INTO v_sub
  FROM public.user_subscriptions us
  WHERE us.user_id = auth.uid()
  ORDER BY us.created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    v_status := 'none';
  ELSIF v_sub.expires_at <= NOW() THEN
    v_status := 'expired';
  ELSIF v_sub.status = 'active' AND v_sub.expires_at > NOW() THEN
    v_status := 'active';
  ELSE
    v_status := v_sub.status;
  END IF;

  SELECT jsonb_build_object(
    'status', v_status,
    'expiresAt', CASE WHEN v_sub IS NOT NULL THEN v_sub.expires_at ELSE NULL END,
    'daysRemaining', CASE 
      WHEN v_sub IS NOT NULL AND v_sub.expires_at > NOW() 
      THEN (EXTRACT(DAY FROM (v_sub.expires_at - NOW())))::INT 
      ELSE 0 
    END,
    'canChat', v_status = 'active' AND v_sub.expires_at > NOW(),
    'subscriptionId', CASE WHEN v_sub IS NOT NULL THEN v_sub.id ELSE NULL END
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: payment_create_request
-- Create a new payment request for subscription
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_create_request(
  p_plan_id UUID,
  p_payment_method TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_plan_amount NUMERIC;
  v_request_id UUID;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  SELECT amount INTO v_plan_amount
  FROM public.subscription_plans
  WHERE id = p_plan_id;

  IF v_plan_amount IS NULL THEN
    RAISE EXCEPTION 'Invalid plan ID: Plan not found';
  END IF;

  IF p_payment_method NOT IN ('bank_transfer', 'paypal', 'crypto', 'coinhub', 'apple_pay', 'cashapp', 'venmo', 'credit_card', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  INSERT INTO public.payment_requests (
    user_id,
    plan_id,
    payment_method,
    amount,
    status,
    requested_at,
    created_at,
    updated_at
  )
  VALUES (
    auth.uid(),
    p_plan_id,
    p_payment_method,
    v_plan_amount,
    'pending',
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_request_id;

  SELECT jsonb_build_object(
    'requestId', v_request_id,
    'userId', auth.uid(),
    'planId', p_plan_id,
    'amount', v_plan_amount,
    'paymentMethod', p_payment_method,
    'status', 'pending',
    'requestedAt', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: payment_get_pending
-- Returns all pending payment requests (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_get_pending()
RETURNS TABLE (
  request_id UUID,
  user_id UUID,
  username VARCHAR,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  plan_id UUID,
  plan_name VARCHAR,
  amount NUMERIC,
  payment_method TEXT,
  status TEXT,
  requested_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
) AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    pr.user_id,
    up.username,
    up.full_name,
    up.email,
    up.phone,
    pr.plan_id,
    sp.name,
    pr.amount,
    pr.payment_method,
    pr.status,
    pr.requested_at,
    pr.admin_notes
  FROM public.payment_requests pr
  JOIN public.user_profiles up ON pr.user_id = up.id
  JOIN public.subscription_plans sp ON pr.plan_id = sp.id
  WHERE pr.status = 'pending'
  ORDER BY pr.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: payment_confirm_and_assign
-- Confirm payment, create subscription, and assign agent to user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_confirm_and_assign(
  p_payment_request_id UUID,
  p_agent_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
  v_plan_duration_days INT;
  v_plan_amount NUMERIC;
  v_subscription_id UUID;
  v_agent_assignment_id UUID;
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT user_id, plan_id INTO v_user_id, v_plan_id
  FROM public.payment_requests
  WHERE id = p_payment_request_id
  AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;

  SELECT duration_days, amount INTO v_plan_duration_days, v_plan_amount
  FROM public.subscription_plans
  WHERE id = v_plan_id;

  IF v_plan_duration_days IS NULL THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  IF NOT (SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_agent_id AND role = 'agent')) THEN
    RAISE EXCEPTION 'Agent not found or invalid agent ID';
  END IF;

  UPDATE public.payment_requests
  SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by_admin_id = auth.uid(),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_payment_request_id;

  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    starts_at,
    expires_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_plan_id,
    'active',
    NOW(),
    NOW() + (v_plan_duration_days || ' days')::INTERVAL,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.agent_assignments (
    user_id,
    agent_id,
    assigned_at,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_agent_id,
    NOW(),
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_agent_assignment_id;

  SELECT jsonb_build_object(
    'paymentConfirmed', TRUE,
    'paymentRequestId', p_payment_request_id,
    'subscriptionId', v_subscription_id,
    'userId', v_user_id,
    'agentId', p_agent_id,
    'assignmentId', v_agent_assignment_id,
    'amount', v_plan_amount,
    'expiresAt', NOW() + (v_plan_duration_days || ' days')::INTERVAL,
    'confirmedAt', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_create_account
-- Create a new agent account with auto-generated credentials
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_create_account(
  p_full_name TEXT,
  p_email TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_agent_user_id UUID;
  v_generated_password TEXT;
  v_generated_username TEXT;
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  IF p_full_name IS NULL OR p_full_name = '' THEN
    RAISE EXCEPTION 'Invalid input: full_name is required';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Invalid input: email is required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already exists: %', p_email;
  END IF;

  v_generated_username := 'agent_' || to_char(NOW(), 'YYYYMMDDHHmmss');
  v_generated_password := public.generate_random_password(12);

  INSERT INTO public.user_profiles (
    username,
    full_name,
    email,
    role,
    status,
    payment_status,
    kyc_status,
    created_at,
    updated_at
  )
  VALUES (
    v_generated_username,
    p_full_name,
    p_email,
    'agent',
    'active',
    'approved',
    'approved',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_agent_user_id;

  SELECT jsonb_build_object(
    'agentUserId', v_agent_user_id,
    'username', v_generated_username,
    'email', p_email,
    'fullName', p_full_name,
    'password', v_generated_password,
    'createdAt', NOW(),
    'message', 'Agent account created. Share login credentials with agent securely.'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: agent_get_assigned_users
-- Returns list of users assigned to the authenticated agent
-- ============================================================================
CREATE OR REPLACE FUNCTION public.agent_get_assigned_users()
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  profile_photo TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT (SELECT role = 'agent' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Agent role required';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.username,
    up.full_name,
    up.email,
    up.phone,
    up.profile_photo,
    COALESCE(us.status, 'none'),
    us.expires_at,
    aa.assigned_at
  FROM public.agent_assignments aa
  JOIN public.user_profiles up ON aa.user_id = up.id
  LEFT JOIN public.user_subscriptions us ON up.id = us.user_id
  WHERE aa.agent_id = auth.uid()
  AND aa.status = 'active'
  ORDER BY aa.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: subscription_expire_check
-- Check and update expired subscriptions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.subscription_expire_check()
RETURNS jsonb AS $$
DECLARE
  v_expired_count INT;
  v_result jsonb;
BEGIN
  UPDATE public.user_subscriptions
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status IN ('active', 'pending')
  AND expires_at <= NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  SELECT jsonb_build_object(
    'expiredCount', v_expired_count,
    'checkedAt', NOW(),
    'success', TRUE,
    'message', 'Subscription expiration check completed'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

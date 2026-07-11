-- 20260607_fix_custom_deposit.sql
-- Fix custom deposit flow:
-- 1. Make payment_requests.plan_id nullable (custom deposits have no plan)
-- 2. Fix payment_create_custom_deposit to not reference non-existent columns
-- 3. Fix payment_confirm_and_assign to handle custom deposits (plan_id IS NULL)
-- 4. Fix payment_get_pending to show custom deposits (LEFT JOIN on plan)

-- ============================================================================
-- Step 1: Make plan_id nullable in payment_requests
-- ============================================================================
ALTER TABLE public.payment_requests
  ALTER COLUMN plan_id DROP NOT NULL;

-- ============================================================================
-- Step 2: Replace payment_create_custom_deposit with corrected version
-- ============================================================================
DROP FUNCTION IF EXISTS public.payment_create_custom_deposit(NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.payment_create_custom_deposit(
  p_amount NUMERIC,
  p_payment_method TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_min_deposit NUMERIC;
  v_request_id UUID;
  v_result jsonb;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create deposit request';
  END IF;

  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be greater than 0';
  END IF;

  -- Get minimum deposit amount from settings (with fallback)
  SELECT s.minimum_deposit_amount INTO v_min_deposit
  FROM public.admin_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;

  v_min_deposit := COALESCE(v_min_deposit, 29.99::NUMERIC);

  -- Validate amount >= minimum
  IF p_amount < v_min_deposit THEN
    RAISE EXCEPTION 'Deposit amount (%) is below minimum required (%). Please deposit at least $%.2f',
      p_amount, v_min_deposit, v_min_deposit;
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('bank_transfer', 'paypal', 'crypto', 'coinhub', 'apple_pay', 'cashapp', 'venmo', 'credit_card', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  -- Create payment request with custom amount (plan_id is NULL for custom deposits)
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
    v_user_id,
    NULL,
    p_payment_method,
    p_amount,
    'pending',
    now(),
    now(),
    now()
  )
  RETURNING id INTO v_request_id;

  -- Return success response
  v_result := jsonb_build_object(
    'id', v_request_id,
    'amount', p_amount,
    'payment_method', p_payment_method,
    'status', 'pending',
    'message', 'Deposit request created. Please wait for admin confirmation.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.payment_create_custom_deposit(NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_create_custom_deposit(NUMERIC, TEXT) TO anon;

-- ============================================================================
-- Step 3: Fix payment_confirm_and_assign to handle custom deposits (NULL plan_id)
-- When plan_id is NULL, use 30 days as default duration and use the payment's amount
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
  v_payment_amount NUMERIC;
  v_subscription_id UUID;
  v_agent_assignment_id UUID;
  v_conversation_id BIGINT;
  v_agents_record_id BIGINT;
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Fetch the payment request (plan_id may be NULL for custom deposits)
  SELECT user_id, plan_id, amount INTO v_user_id, v_plan_id, v_payment_amount
  FROM public.payment_requests
  WHERE id = p_payment_request_id
  AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;

  -- Try to get plan details; if plan_id is NULL (custom deposit), use defaults
  IF v_plan_id IS NOT NULL THEN
    SELECT duration_days, amount INTO v_plan_duration_days, v_plan_amount
    FROM public.subscription_plans
    WHERE id = v_plan_id;

    IF v_plan_duration_days IS NULL THEN
      RAISE EXCEPTION 'Plan not found';
    END IF;
  ELSE
    -- Custom deposit: 30-day access, use the deposited amount
    v_plan_duration_days := 30;
    v_plan_amount := v_payment_amount;
  END IF;

  IF NOT (SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_agent_id AND role = 'agent')) THEN
    RAISE EXCEPTION 'Agent not found or invalid agent ID';
  END IF;

  -- Update payment request
  UPDATE public.payment_requests
  SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by_admin_id = auth.uid(),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_payment_request_id;

  -- Create subscription (use a dummy plan_id if null — reuse first available plan, or skip)
  -- For custom deposits, create the subscription with whatever plan_id we have.
  -- If plan_id is NULL, we create a subscription without a plan reference (use NULL).
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
    v_plan_id,  -- may be NULL for custom deposits
    'active',
    NOW(),
    NOW() + (v_plan_duration_days || ' days')::INTERVAL,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_subscription_id;

  -- Create agent assignment
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

  -- Create conversation for the user with the assigned agent
  SELECT id INTO v_agents_record_id
  FROM public.agents
  WHERE user_id = p_agent_id
  LIMIT 1;

  IF v_agents_record_id IS NOT NULL THEN
    INSERT INTO public.conversations (
      user_id,
      agent_id,
      status,
      admin_approved,
      welcome_message_sent,
      last_message_at,
      created_at
    )
    VALUES (
      v_user_id,
      v_agents_record_id,
      'active',
      true,
      false,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_conversation_id;
  ELSE
    RAISE WARNING 'Agent user_id % has no corresponding agents table record', p_agent_id;
  END IF;

  SELECT jsonb_build_object(
    'paymentConfirmed', TRUE,
    'paymentRequestId', p_payment_request_id,
    'subscriptionId', v_subscription_id,
    'userId', v_user_id,
    'agentId', p_agent_id,
    'assignmentId', v_agent_assignment_id,
    'conversationId', v_conversation_id,
    'amount', v_plan_amount,
    'expiresAt', NOW() + (v_plan_duration_days || ' days')::INTERVAL,
    'confirmedAt', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 4: Fix payment_get_pending to show custom deposits (LEFT JOIN on plan)
-- ============================================================================
DROP FUNCTION IF EXISTS public.payment_get_pending();

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
    COALESCE(sp.name, 'Custom Deposit')::VARCHAR,
    pr.amount,
    pr.payment_method,
    pr.status,
    pr.requested_at,
    pr.admin_notes
  FROM public.payment_requests pr
  JOIN public.user_profiles up ON pr.user_id = up.id
  LEFT JOIN public.subscription_plans sp ON pr.plan_id = sp.id
  WHERE pr.status = 'pending'
  ORDER BY pr.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 5: Also make user_subscriptions.plan_id nullable (for custom deposit subscriptions)
-- ============================================================================
ALTER TABLE public.user_subscriptions
  ALTER COLUMN plan_id DROP NOT NULL;

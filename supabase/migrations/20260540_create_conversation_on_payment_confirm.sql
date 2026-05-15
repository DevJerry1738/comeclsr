-- 20260540_create_conversation_on_payment_confirm.sql
-- CRITICAL FIX: Create conversation when payment is confirmed and agent is assigned
-- This fixes the issue where users can't see conversations after subscription

-- Update payment_confirm_and_assign to also create conversation
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
  v_conversation_id BIGINT;
  v_agents_record_id BIGINT;
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

  -- Update payment request
  UPDATE public.payment_requests
  SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by_admin_id = auth.uid(),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_payment_request_id;

  -- Create subscription
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

  -- CRITICAL FIX: Create conversation
  -- Need to look up agent from agents table using user_id
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
    -- If no agents record exists, this is a mismatch issue
    -- Log warning but don't fail the entire operation
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

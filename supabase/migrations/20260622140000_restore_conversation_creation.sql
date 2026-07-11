-- 20260622140000_restore_conversation_creation.sql
-- Restore automatic conversation creation when payment is approved, but WITHOUT sending the greeting message.
-- This ensures the user has conversations with agents and can click "Say Hi" to initiate the chat.

DROP FUNCTION IF EXISTS public.payment_approve_deposit(UUID);
DROP FUNCTION IF EXISTS public.payment_approve_deposit(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.payment_approve_deposit(
  p_request_id UUID,
  p_credits_to_grant INTEGER DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_credits INTEGER;
  v_amount NUMERIC;
  v_agent_id BIGINT;
  v_agent_user_id UUID;
  v_agent_name TEXT;
  v_conversation_id BIGINT;
  v_agent_cursor CURSOR FOR
    SELECT a.id, a.user_id, ap.full_name
    FROM public.agents a
    JOIN public.user_profiles ap ON a.user_id = ap.id
    WHERE ap.status = 'active' AND ap.role = 'agent';
  v_result jsonb;
BEGIN
  -- Check admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve deposits';
  END IF;

  -- Get payment request details (override with p_credits_to_grant if provided)
  SELECT pr.user_id, COALESCE(p_credits_to_grant, pr.credits_to_grant), pr.amount
  INTO v_user_id, v_credits, v_amount
  FROM public.payment_requests pr
  WHERE pr.id = p_request_id AND pr.status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found or already processed';
  END IF;

  -- Calculate fallback credits if NULL: roughly 1 credit per $3.00
  IF v_credits IS NULL THEN
    v_credits := floor(v_amount / 3);
  END IF;

  IF v_credits <= 0 THEN
    RAISE EXCEPTION 'Credits to grant must be greater than 0';
  END IF;

  -- Update payment request status
  UPDATE public.payment_requests
  SET 
    status = 'confirmed',
    credits_to_grant = v_credits,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    confirmed_at = now(),
    confirmed_by_admin_id = auth.uid()
  WHERE id = p_request_id;

  -- Ensure user_credits entry exists and add balance
  INSERT INTO public.user_credits (user_id, balance, total_purchased)
  VALUES (v_user_id, v_credits::DECIMAL, v_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = user_credits.balance + v_credits::DECIMAL,
    total_purchased = user_credits.total_purchased + v_amount,
    updated_at = now();

  -- Log deposit transaction
  PERFORM public.credit_transaction_log(
    v_user_id,
    'deposit',
    v_amount,
    CONCAT('Deposit approved - ', v_credits, ' credits granted')
  );

  -- Create conversations with all active agents (WITHOUT auto-greetings)
  OPEN v_agent_cursor;
  LOOP
    FETCH v_agent_cursor INTO v_agent_id, v_agent_user_id, v_agent_name;
    EXIT WHEN NOT FOUND;

    -- Check if conversation already exists
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE user_id = v_user_id AND agent_id = v_agent_id
    LIMIT 1;

    -- Create conversation with agent if not exists
    IF v_conversation_id IS NULL THEN
      INSERT INTO public.conversations (user_id, agent_id, status, admin_approved, welcome_message_sent)
      VALUES (v_user_id, v_agent_id, 'active', TRUE, FALSE)
      RETURNING id INTO v_conversation_id;
    END IF;
  END LOOP;
  CLOSE v_agent_cursor;

  v_result := jsonb_build_object(
    'success', TRUE,
    'userId', v_user_id,
    'creditsGranted', v_credits,
    'message', CONCAT('Deposit approved! ', v_credits, ' credits added.')
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.payment_approve_deposit(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_approve_deposit(UUID, INTEGER, TEXT) TO anon;

-- 20260608_credit_system_updates.sql
-- Update credit system, table columns, deposit approval and message sending logic

-- 1. Ensure credits_to_grant exists in payment_requests
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS credits_to_grant INTEGER;

-- 2. Update payment_create_request to populate credits_to_grant
CREATE OR REPLACE FUNCTION public.payment_create_request(
  p_credit_package_id UUID,
  p_payment_method TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_package RECORD;
  v_min_deposit DECIMAL;
  v_request_id UUID;
  v_result jsonb;
BEGIN
  -- Get credit package
  SELECT cp.id, cp.credit_amount, cp.price
  INTO v_package
  FROM public.credit_packages cp
  WHERE cp.id = p_credit_package_id AND cp.is_active = TRUE;

  IF v_package.id IS NULL THEN
    RAISE EXCEPTION 'Credit package not found or inactive';
  END IF;

  -- Get minimum deposit amount
  SELECT s.minimum_deposit_amount INTO v_min_deposit
  FROM public.admin_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Validate package price >= minimum
  IF v_package.price < COALESCE(v_min_deposit, 29.99) THEN
    RAISE EXCEPTION 'Package price (%) is below minimum deposit amount (%)', 
      v_package.price, v_min_deposit;
  END IF;

  -- Validate payment method
  IF p_payment_method NOT IN ('bank_transfer', 'paypal', 'crypto', 'coinhub', 'apple_pay', 'cashapp', 'venmo', 'credit_card', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  -- Create payment request
  INSERT INTO public.payment_requests (
    user_id,
    plan_id,
    payment_method,
    amount,
    credits_to_grant,
    status,
    requested_at
  )
  VALUES (
    auth.uid(),
    p_credit_package_id,
    p_payment_method,
    v_package.price,
    v_package.credit_amount,
    'pending',
    now()
  )
  RETURNING id INTO v_request_id;

  v_result := jsonb_build_object(
    'requestId', v_request_id,
    'userId', auth.uid(),
    'creditAmount', v_package.credit_amount,
    'amount', v_package.price,
    'paymentMethod', p_payment_method,
    'status', 'pending',
    'message', 'Payment request created. Admin will review and contact you via email.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update payment_create_custom_deposit to use correct columns
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
    credits_to_grant,
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
    NULL, -- admin sets this on approval
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

-- 4. Recreate payment_approve_deposit with credits parameter and welcome greetings for all active agents
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
  v_user_name TEXT;
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

  -- Fetch user full name for greeting message
  SELECT COALESCE(full_name, username) INTO v_user_name
  FROM public.user_profiles
  WHERE id = v_user_id
  LIMIT 1;

  -- Create conversations with all active agents and send auto-greetings
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

    -- Send welcome message from this agent if not already sent
    IF v_conversation_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.messages 
      WHERE conversation_id = v_conversation_id AND sender_id = v_agent_user_id
    ) THEN
      INSERT INTO public.messages (
        conversation_id,
        sender_id,
        sender_role,
        type,
        content,
        created_at
      )
      VALUES (
        v_conversation_id,
        v_agent_user_id,
        'agent',
        'media', -- must be 'media' because constraint is CHECK (type IN ('media', 'voice'))
        CONCAT('Hi ', v_user_name, '! I''m ', v_agent_name, '. How can I help you today?'),
        now()
      );

      -- Mark welcome message as sent
      UPDATE public.conversations
      SET welcome_message_sent = TRUE
      WHERE id = v_conversation_id;
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

-- 5. Recreate user_send_message function with agent/admin bypass
CREATE OR REPLACE FUNCTION public.user_send_message(
  p_conversation_id BIGINT,
  p_content TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_duration INTEGER DEFAULT NULL,
  p_type TEXT DEFAULT 'media'
)
RETURNS jsonb AS $$
DECLARE
  v_sender_role TEXT;
  v_balance DECIMAL;
  v_cost DECIMAL;
  v_message_id BIGINT;
  v_new_balance DECIMAL;
  v_result jsonb;
BEGIN
  -- Get sender role
  SELECT role INTO v_sender_role 
  FROM public.user_profiles 
  WHERE id = auth.uid();

  IF v_sender_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- If sender is agent or admin, skip credit checks and deductions
  IF v_sender_role IN ('agent', 'admin') THEN
    -- Insert message
    INSERT INTO public.messages (
      conversation_id,
      sender_id,
      sender_role,
      type,
      content,
      media_url,
      duration,
      created_at
    )
    VALUES (
      p_conversation_id,
      auth.uid(),
      v_sender_role,
      p_type,
      p_content,
      p_media_url,
      p_duration,
      now()
    )
    RETURNING id INTO v_message_id;

    -- Update last_message_at
    UPDATE public.conversations 
    SET last_message_at = now() 
    WHERE id = p_conversation_id;

    v_result := jsonb_build_object(
      'messageId', v_message_id,
      'costDeducted', 0,
      'message', 'Message sent by agent/admin successfully'
    );

    RETURN v_result;
  END IF;

  -- Otherwise, sender is a user. Check credits and deduct.
  SELECT uc.balance INTO v_balance
  FROM public.user_credits uc
  WHERE uc.user_id = auth.uid();

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'User credits record not found';
  END IF;

  -- Get message cost from admin settings
  SELECT s.message_cost_rate INTO v_cost
  FROM public.admin_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;

  v_cost := COALESCE(v_cost, 5.00);

  -- Check if user has sufficient balance
  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits. You have % credits but need % to send a message.', 
      ROUND(v_balance::NUMERIC, 2), v_cost;
  END IF;

  -- Insert message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    sender_role,
    type,
    content,
    media_url,
    duration,
    created_at
  )
  VALUES (
    p_conversation_id,
    auth.uid(),
    'user',
    p_type,
    p_content,
    p_media_url,
    p_duration,
    now()
  )
  RETURNING id INTO v_message_id;

  -- Update conversation last_message_at
  UPDATE public.conversations 
  SET last_message_at = now() 
  WHERE id = p_conversation_id;

  -- Deduct credits from user's balance
  UPDATE public.user_credits
  SET 
    balance = balance - v_cost,
    updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING balance INTO v_new_balance;

  -- Log deduction transaction
  PERFORM public.credit_transaction_log(
    auth.uid(),
    'message_deduction',
    -v_cost,
    CONCAT('Message sent in conversation ', p_conversation_id)
  );

  v_result := jsonb_build_object(
    'messageId', v_message_id,
    'costDeducted', v_cost,
    'newBalance', ROUND(v_new_balance::NUMERIC, 2),
    'message', CONCAT('Message sent. Remaining balance: ', ROUND(v_new_balance::NUMERIC, 2), ' credits')
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to new function signatures
GRANT EXECUTE ON FUNCTION public.payment_approve_deposit(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_approve_deposit(UUID, INTEGER, TEXT) TO anon;

-- 20260605_custom_deposit.sql
-- Add RPC function for custom deposit amounts (flexible deposit system)

-- ============================================================================
-- RPC: payment_create_custom_deposit
-- User initiates a custom credit deposit request (not limited to packages)
-- Validates against minimum deposit amount from admin settings
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

  -- Create payment request with custom amount
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
    v_user_id,
    NULL,
    p_payment_method,
    p_amount,
    NULL,
    'pending',
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

-- Grant permissions on new function
GRANT EXECUTE ON FUNCTION public.payment_create_custom_deposit(NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_create_custom_deposit(NUMERIC, TEXT) TO anon;

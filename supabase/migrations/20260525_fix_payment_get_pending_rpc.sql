-- 20260525_fix_payment_get_pending_rpc.sql
-- Fix the payment_get_pending RPC to properly check admin role

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
DECLARE
  v_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO v_user_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Check if user is admin
  IF v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Return pending payments
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

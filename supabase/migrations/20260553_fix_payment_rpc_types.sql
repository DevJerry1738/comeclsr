-- Migration: Fix payment RPC function type mismatches
-- Issue: payment_get_all declares id as BIGINT but payments.id is SERIAL (INTEGER)

-- ============================================================================
-- FIX: payment_get_all - Change id return type from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.payment_get_all(INT, INT);

CREATE OR REPLACE FUNCTION public.payment_get_all(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  username VARCHAR,
  amount NUMERIC,
  method VARCHAR,
  status TEXT,
  proof_image TEXT,
  transaction_ref VARCHAR,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    up.username,
    p.amount,
    p.method,
    p.status,
    p.proof_image,
    p.transaction_ref,
    p.admin_notes,
    p.created_at,
    p.updated_at
  FROM public.payments p
  JOIN public.user_profiles up ON p.user_id = up.id
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX: payment_update_status - Change p_payment_id from BIGINT to INTEGER
-- ============================================================================
DROP FUNCTION IF EXISTS public.payment_update_status(BIGINT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.payment_update_status(
  p_payment_id INTEGER,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.payments
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_payment_id
  RETURNING to_jsonb(public.payments.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

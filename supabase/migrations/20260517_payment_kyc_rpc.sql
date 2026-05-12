-- Payment and KYC RPC Functions
-- Payment and KYC submission management

-- ============================================================================
-- RPC: payment_get_all
-- Returns all payments (admin only, paginated)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_get_all(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
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
-- RPC: payment_update_status
-- Update payment status (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payment_update_status(
  p_payment_id BIGINT,
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

-- ============================================================================
-- RPC: kyc_get_all
-- Returns all KYC submissions (admin only, paginated)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.kyc_get_all(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  username VARCHAR,
  people_type TEXT,
  conversation_type TEXT,
  personality_prefs TEXT,
  expectations TEXT,
  id_document TEXT,
  selfie_photo TEXT,
  status TEXT,
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
    k.id,
    k.user_id,
    up.username,
    k.people_type,
    k.conversation_type,
    k.personality_prefs,
    k.expectations,
    k.id_document,
    k.selfie_photo,
    k.status,
    k.admin_notes,
    k.created_at,
    k.updated_at
  FROM public.kyc_submissions k
  JOIN public.user_profiles up ON k.user_id = up.id
  ORDER BY k.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: kyc_update_status
-- Update KYC submission status (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.kyc_update_status(
  p_kyc_id BIGINT,
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

  UPDATE public.kyc_submissions
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_kyc_id
  RETURNING to_jsonb(public.kyc_submissions.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'KYC submission not found';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

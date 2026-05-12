-- Settings RPC Functions
-- Application settings management

-- ============================================================================
-- RPC: settings_get_all
-- Returns all application settings (public, cached)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.settings_get_all()
RETURNS TABLE (
  id BIGINT,
  key VARCHAR,
  value TEXT,
  category TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.key,
    s.value,
    s.category,
    s.updated_at
  FROM public.settings s
  ORDER BY s.category, s.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RPC: settings_update
-- Update a setting (admin only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.settings_update(
  p_key VARCHAR,
  p_value TEXT,
  p_category TEXT DEFAULT 'general'
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_id BIGINT;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  -- Try to update existing setting
  UPDATE public.settings
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key
  RETURNING id INTO v_id;

  -- If not found, insert new setting
  IF v_id IS NULL THEN
    INSERT INTO public.settings (key, value, category)
    VALUES (p_key, p_value, p_category)
    RETURNING id INTO v_id;
  END IF;

  -- Return updated/created setting
  SELECT to_jsonb(public.settings.*) INTO v_result
  FROM public.settings
  WHERE id = v_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

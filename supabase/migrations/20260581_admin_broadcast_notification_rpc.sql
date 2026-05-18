-- Migration: Create admin_broadcast_notification RPC to bypass RLS for admin broadcasts
-- The notifications table RLS only allows users to insert for themselves.
-- Admins need a SECURITY DEFINER function to insert for all users.

CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'system'
)
RETURNS jsonb AS $$
DECLARE
  v_inserted_count INT := 0;
  v_user RECORD;
  v_result jsonb;
BEGIN
  -- Admin only
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  IF p_message IS NULL OR p_message = '' THEN
    RAISE EXCEPTION 'Message is required';
  END IF;

  -- Insert one notification per user with role = 'user'
  INSERT INTO public.notifications (user_id, type, title, message, is_read, created_at)
  SELECT
    up.id,
    p_type,
    p_title,
    p_message,
    false,
    NOW()
  FROM public.user_profiles up
  WHERE up.role = 'user';

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  SELECT jsonb_build_object(
    'success', true,
    'sentTo', v_inserted_count,
    'title', p_title,
    'sentAt', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(TEXT, TEXT, TEXT) TO authenticated;

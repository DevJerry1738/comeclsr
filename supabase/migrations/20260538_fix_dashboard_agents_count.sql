-- 20260538_fix_dashboard_agents_count.sql
-- Fix: Update admin_dashboard_stats to query user_profiles instead of non-existent agents table

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify admin role
  IF NOT public.is_admin_check() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'user'),
    'totalAgents', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'agent'),
    'activeConversations', (SELECT COUNT(*) FROM public.conversations WHERE status = 'active'),
    'pendingKYC', (SELECT COUNT(*) FROM public.kyc_submissions WHERE status = 'pending'),
    'pendingPayments', (SELECT COUNT(*) FROM public.payments WHERE status = 'pending'),
    'totalPaymentsAmount', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'approved'),
    'openTickets', (SELECT COUNT(*) FROM public.tickets WHERE status IN ('open', 'in_progress')),
    'totalTickets', (SELECT COUNT(*) FROM public.tickets),
    'adminCount', (SELECT COUNT(*) FROM public.user_profiles WHERE role = 'admin'),
    'blockedUsers', (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'blocked')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20260606_ensure_admin_settings.sql
-- Ensure admin_settings table has at least one default row

INSERT INTO public.admin_settings (
  message_cost_rate,
  minimum_deposit_amount
)
SELECT 5.00, 29.99
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

-- 20260522_seed_subscription_plans.sql
-- Seed default subscription plans

-- Insert default subscription plan
INSERT INTO public.subscription_plans (
  id,
  amount,
  duration_days,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  99.99,
  30,
  'Monthly Access',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Add more plan options if needed
INSERT INTO public.subscription_plans (
  id,
  amount,
  duration_days,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  249.99,
  90,
  'Quarterly Access',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO public.subscription_plans (
  id,
  amount,
  duration_days,
  name,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  899.99,
  365,
  'Annual Access',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

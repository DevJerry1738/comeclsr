-- 20260523_add_is_active_to_subscription_plans.sql
-- Add is_active column to subscription_plans table and set up RLS

ALTER TABLE public.subscription_plans 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Enable RLS on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read subscription plans
CREATE POLICY "Allow public read" ON public.subscription_plans
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Only admins can insert subscription plans
CREATE POLICY "Allow admin insert" ON public.subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update subscription plans
CREATE POLICY "Allow admin update" ON public.subscription_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete subscription plans
CREATE POLICY "Allow admin delete" ON public.subscription_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
    )
  );

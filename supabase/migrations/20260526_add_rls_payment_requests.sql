-- 20260526_add_rls_payment_requests.sql
-- Add RLS policies to payment_requests table

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment requests
CREATE POLICY "Users can view their own payment requests" ON public.payment_requests
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

-- Policy: Users can insert their own payment requests
CREATE POLICY "Users can create payment requests" ON public.payment_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can update payment requests
CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

-- Policy: Admins can delete payment requests
CREATE POLICY "Admins can delete payment requests" ON public.payment_requests
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

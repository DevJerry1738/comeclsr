-- Migration: Add test payment requests for admin testing
-- This migration creates sample pending payment requests if users and plans exist

-- Step 1: Get admin and regular users
DO $$
DECLARE
  v_admin_id UUID;
  v_user_id UUID;
  v_plan_id UUID;
  v_user_count INT;
  v_admin_count INT;
  v_plan_count INT;
  v_payment_count INT;
BEGIN
  -- Check existing data
  SELECT COUNT(*) INTO v_user_count FROM public.user_profiles WHERE role = 'user';
  SELECT COUNT(*) INTO v_admin_count FROM public.user_profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO v_plan_count FROM public.subscription_plans WHERE is_active = true;
  SELECT COUNT(*) INTO v_payment_count FROM public.payment_requests WHERE status = 'pending';
  
  RAISE NOTICE 'Current state - Users: %, Admins: %, Active Plans: %, Pending Payments: %',
    v_user_count, v_admin_count, v_plan_count, v_payment_count;
  
  -- Only create test data if we have users and plans but no pending payments
  IF v_user_count > 0 AND v_plan_count > 0 AND v_payment_count = 0 THEN
    -- Get first regular user
    SELECT id INTO v_user_id FROM public.user_profiles 
    WHERE role = 'user' LIMIT 1;
    
    -- Get first active plan
    SELECT id INTO v_plan_id FROM public.subscription_plans 
    WHERE is_active = true LIMIT 1;
    
    IF v_user_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
      -- Insert test payment requests
      INSERT INTO public.payment_requests (
        user_id,
        plan_id,
        payment_method,
        amount,
        status,
        requested_at,
        created_at,
        updated_at
      )
      VALUES 
        (
          v_user_id,
          v_plan_id,
          'bank_transfer',
          99.99,
          'pending',
          NOW(),
          NOW(),
          NOW()
        ),
        (
          v_user_id,
          v_plan_id,
          'paypal',
          249.99,
          'pending',
          NOW() - INTERVAL '1 day',
          NOW() - INTERVAL '1 day',
          NOW() - INTERVAL '1 day'
        );
      
      RAISE NOTICE 'Created 2 test payment requests for user %', v_user_id;
    ELSE
      RAISE NOTICE 'Could not create test data - user or plan not found';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping test data creation - conditions not met';
  END IF;
END $$;

-- Display current pending payments
SELECT 
  pr.id,
  pr.user_id,
  up.email,
  up.full_name,
  pr.plan_id,
  sp.name as plan_name,
  pr.amount,
  pr.payment_method,
  pr.status,
  pr.requested_at
FROM public.payment_requests pr
LEFT JOIN public.user_profiles up ON pr.user_id = up.id
LEFT JOIN public.subscription_plans sp ON pr.plan_id = sp.id
WHERE pr.status = 'pending'
ORDER BY pr.requested_at DESC;

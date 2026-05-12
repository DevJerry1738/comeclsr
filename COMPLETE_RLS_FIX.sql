-- ============================================================================
-- COMPLETE RLS POLICY RESET FOR user_profiles TABLE
-- ============================================================================
--
-- Run this ENTIRE script to fix profile creation errors
-- Note: Storage bucket policies are set through the UI, not SQL
--
-- ============================================================================

-- STEP 1: RESET user_profiles TABLE POLICIES
-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.user_profiles;
DROP POLICY IF EXISTS "user_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_select_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 2: CREATE NEW CLEAN POLICIES FOR user_profiles
-- Policy for INSERT (signup) - CRITICAL FOR SIGNUP TO WORK
CREATE POLICY "allow_user_insert_own_profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy for SELECT own
CREATE POLICY "allow_user_select_own_profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy for SELECT all (authenticated users can see all)
CREATE POLICY "allow_authenticated_select_all"
  ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy for UPDATE own
CREATE POLICY "allow_user_update_own_profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 
-- After running this, you should see 4 policies for user_profiles:
--   1. allow_user_insert_own_profile (INSERT)
--   2. allow_user_select_own_profile (SELECT)
--   3. allow_authenticated_select_all (SELECT)
--   4. allow_user_update_own_profile (UPDATE)
--
-- If you see these 4 policies, signup should now work!
--
-- For storage bucket policies, see the separate guide below.
-- ============================================================================

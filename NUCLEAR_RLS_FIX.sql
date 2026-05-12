-- ============================================================================
-- NUCLEAR RLS FIX - FINAL ATTEMPT
-- ============================================================================
-- This completely resets RLS for user_profiles from scratch
-- ============================================================================

-- STEP 1: Disable RLS on user_profiles (this forces cache flush)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Immediately RE-ENABLE RLS (required to apply new policies)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop EVERY possible policy name that might exist
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "All authenticated can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.user_profiles;
DROP POLICY IF EXISTS "user_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_select_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_authenticated_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_update_own_profile" ON public.user_profiles;

-- STEP 4: Create 4 new policies from scratch
-- These are the ONLY policies needed for signup to work

-- Policy A: Users can INSERT their own profile (CRITICAL FOR SIGNUP)
CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy B: Users can view their own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy C: All authenticated users can view ALL profiles (for UI)
CREATE POLICY "user_profiles_select_all"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy D: Users can UPDATE their own profile
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to confirm policies were created:
SELECT policyname, polcmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- You should see 4 rows with these policy names:
-- - user_profiles_insert_own (INSERT)
-- - user_profiles_select_all (SELECT)
-- - user_profiles_select_own (SELECT)
-- - user_profiles_update_own (UPDATE)

-- ============================================================================

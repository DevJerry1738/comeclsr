-- ============================================================================
-- AGGRESSIVE RLS RESET - COMPLETE POLICY FLUSH
-- ============================================================================
-- Use this if the normal RLS fix didn't work
-- This disables and re-enables RLS to flush cached policies
--
-- ============================================================================

-- STEP 1: Disable RLS temporarily (this flushes all cached policies)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL policies
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
DROP POLICY IF EXISTS "All authenticated can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_authenticated_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_user_update_own_profile" ON public.user_profiles;

-- STEP 3: Re-enable RLS (this resets the policy engine)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create fresh policies (one at a time for clarity)

-- Policy 1: Users can INSERT (critical for signup)
CREATE POLICY "user_insert_own"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 2: Users can SELECT own
CREATE POLICY "user_select_own"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 3: All authenticated can SELECT all
CREATE POLICY "user_select_all"
  ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 4: Users can UPDATE own
CREATE POLICY "user_update_own"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- You should now see 4 policies for user_profiles table.
-- Refresh your browser and try signup again.
--
-- If you STILL get 401 errors:
--   1. Check that this script ran with no errors
--   2. Delete the profile-photos bucket if it exists (it may have RLS conflicts)
--   3. Hard refresh your browser (Ctrl+Shift+R)
--   4. Try signup WITHOUT uploading a photo first
--   5. Check the browser console for exact error details
--
-- ============================================================================

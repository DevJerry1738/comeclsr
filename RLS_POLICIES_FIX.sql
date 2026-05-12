-- ============================================================================
-- SUPABASE RLS POLICIES FIX FOR user_profiles TABLE
-- ============================================================================
-- 
-- CRITICAL: This fixes the 401 Unauthorized error on signup
-- 
-- Root cause: The is_admin() function in existing policies causes 
-- infinite recursion when a new user tries to insert their profile.
--
-- Instructions:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste ALL the SQL below (start from "DROP POLICY")
-- 5. Click "Run"
-- 6. You should see green "Success" messages with no errors
--
-- ============================================================================

-- STEP 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "All authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- STEP 2: Make sure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create new policies WITHOUT infinite recursion

-- POLICY 1: Users can INSERT their own profile (CRITICAL FOR SIGNUP)
CREATE POLICY "user_insert_own_profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- POLICY 2: Users can SELECT their own profile
CREATE POLICY "user_select_own_profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- POLICY 3: All authenticated users can SELECT all profiles
-- (for agent selection, browsing, etc. - does NOT use is_admin())
CREATE POLICY "authenticated_select_all_profiles" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- POLICY 4: Users can UPDATE their own profile
CREATE POLICY "user_update_own_profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 
-- After running this, you should see 4 policies for user_profiles:
--   1. user_insert_own_profile (INSERT)
--   2. user_select_own_profile (SELECT)
--   3. authenticated_select_all_profiles (SELECT)
--   4. user_update_own_profile (UPDATE)
--
-- If you still get 401 errors:
--   - Check that you clicked "Run" (not just pasted)
--   - Refresh your browser
--   - Try signing up again
--   - Check browser console for the exact error message
--
-- ============================================================================

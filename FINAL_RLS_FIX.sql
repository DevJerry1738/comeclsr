-- ============================================================================
-- FINAL FIX - RECREATE POLICIES WITH EXPLICIT WITH CHECK CLAUSES
-- ============================================================================
-- The INSERT policy is broken (no WITH CHECK clause)
-- This recreates all 4 policies from scratch
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_select_all" ON public.user_profiles;

-- ============================================================================
-- RECREATE WITH EXPLICIT WITH CHECK CLAUSES
-- ============================================================================

-- Policy 1: INSERT - CRITICAL FOR SIGNUP
-- This MUST have WITH CHECK (auth.uid() = id)
CREATE POLICY "p_user_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 2: SELECT own profile
CREATE POLICY "p_user_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 3: SELECT all profiles (for UI/lists)
CREATE POLICY "p_user_select_all"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 4: UPDATE own profile
CREATE POLICY "p_user_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VERIFY IT WORKED
-- ============================================================================

SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- You should see:
-- p_user_insert_own    INSERT   (WITH CHECK should show condition)
-- p_user_select_all    SELECT   (USING should show true)
-- p_user_select_own    SELECT   (USING should show auth.uid() = id)
-- p_user_update_own    UPDATE   (both USING and WITH CHECK)

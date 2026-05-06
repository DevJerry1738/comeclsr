-- ============================================================================
-- DIRECT FIX FOR RLS POLICIES
-- Run this in Supabase SQL Editor to fix registration issues
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.user_profiles;

-- Recreate user_profiles policies - SIMPLIFIED to avoid recursion

-- 1. Users can create their own profile during signup
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow all authenticated users to view all profiles (for agent selection, etc)
-- Admin-specific policies can be added later via JWT claims if needed
CREATE POLICY "Authenticated users can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. For admin operations: use a trigger or separate admin table later
-- For now, admins can be managed via Supabase dashboard

-- Verify RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Done! Registration and login should now work.

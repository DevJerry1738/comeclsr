-- Fix: Remove "TO authenticated" from user_profiles INSERT policy
-- This allows newly signed-up users to insert their own profile via JWT
-- Previously the policy was too restrictive for the signup flow

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;

-- Create new policy without "TO authenticated" restriction
-- This allows any user with a valid JWT (including new signups) to insert their own profile
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify RLS is still enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 20260624170000_profile_media_gallery.sql
-- Create profile_media table for user/agent gallery photos (images only)

CREATE TABLE IF NOT EXISTS public.profile_media (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view all profile media
CREATE POLICY "Allow authenticated users to view all profile media" 
  ON public.profile_media
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy 2: Allow users to insert their own profile media
CREATE POLICY "Allow users to insert their own profile media" 
  ON public.profile_media
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy 3: Allow users to delete their own profile media
CREATE POLICY "Allow users to delete their own profile media" 
  ON public.profile_media
  FOR DELETE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Function to check if a user is an admin or agent
CREATE OR REPLACE FUNCTION public.check_user_role(p_user_id UUID, p_expected_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = p_user_id AND role = p_expected_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

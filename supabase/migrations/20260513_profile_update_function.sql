-- Create a function to update user profile that bypasses RLS
-- This function runs as the database owner, allowing profile updates immediately after signup

-- Drop the old function first if it exists (to handle parameter name changes)
DROP FUNCTION IF EXISTS public.update_user_profile(uuid, text, integer, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id uuid,
  p_phone text DEFAULT NULL,
  p_age integer DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_interests text DEFAULT NULL,
  p_profile_photo text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.user_profiles
  SET
    phone = COALESCE(p_phone, user_profiles.phone),
    age = COALESCE(p_age, user_profiles.age),
    gender = COALESCE(p_gender, user_profiles.gender),
    location = COALESCE(p_location, user_profiles.location),
    bio = COALESCE(p_bio, user_profiles.bio),
    interests = COALESCE(p_interests, user_profiles.interests),
    profile_photo = COALESCE(p_profile_photo, user_profiles.profile_photo),
    updated_at = NOW()
  WHERE id = user_id;

  -- Return the updated profile
  SELECT row_to_json(user_profiles.*) INTO result
  FROM public.user_profiles
  WHERE id = user_id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, text, integer, text, text, text, text, text) TO authenticated;

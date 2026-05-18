-- Drop the old table-returning function
DROP FUNCTION IF EXISTS public.kyc_get_all(INT, INT);

-- Create new function returning JSONB directly from user_profiles
CREATE OR REPLACE FUNCTION public.kyc_get_all()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', up.id,
      'userId', up.id,
      'username', up.username,
      'fullName', up.full_name,
      'email', up.email,
      'phone', up.phone,
      'age', up.age,
      'gender', up.gender,
      'location', up.location,
      'bio', up.bio,
      'interests', up.interests,
      'profilePhoto', up.profile_photo,
      'status', 'approved',
      'createdAt', up.created_at
    ) ORDER BY up.created_at DESC
  ) INTO v_result
  FROM public.user_profiles up
  WHERE up.role = 'user';

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

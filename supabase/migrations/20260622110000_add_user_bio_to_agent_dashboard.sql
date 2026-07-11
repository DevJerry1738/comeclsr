-- Add user profile bio fields to agent_get_assigned_users function

DROP FUNCTION IF EXISTS public.agent_get_assigned_users();

CREATE OR REPLACE FUNCTION public.agent_get_assigned_users()
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  profile_photo TEXT,
  subscription_status TEXT,
  subscription_expires_at TIMESTAMP,
  assigned_at TIMESTAMP,
  credit_balance NUMERIC,
  bio TEXT,
  gender TEXT,
  age INT,
  location VARCHAR,
  interests TEXT
) AS $$
BEGIN
  IF NOT (SELECT role = 'agent' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorized: Agent role required';
  END IF;

  RETURN QUERY
  WITH all_users AS (
    -- 1. Users assigned via agent_assignments
    SELECT 
      up.id AS u_id,
      up.username AS u_username,
      up.full_name AS u_full_name,
      up.email AS u_email,
      up.phone AS u_phone,
      up.profile_photo AS u_profile_photo,
      COALESCE(us.status, 'none') AS u_sub_status,
      COALESCE(us.expires_at, NULL)::timestamp AS u_sub_expires,
      aa.assigned_at::timestamp AS u_assigned_at,
      COALESCE(uc.balance, 0)::NUMERIC AS u_credit_balance,
      up.bio AS u_bio,
      up.gender AS u_gender,
      up.age AS u_age,
      up.location AS u_location,
      up.interests AS u_interests
    FROM public.agent_assignments aa
    JOIN public.user_profiles up ON aa.user_id = up.id
    LEFT JOIN public.user_subscriptions us ON up.id = us.user_id
    LEFT JOIN public.user_credits uc ON up.id = uc.user_id
    WHERE aa.agent_id = auth.uid()
    AND aa.status = 'active'

    UNION

    -- 2. Users who have a conversation with the agent and have active credit (>0)
    SELECT 
      up.id AS u_id,
      up.username AS u_username,
      up.full_name AS u_full_name,
      up.email AS u_email,
      up.phone AS u_phone,
      up.profile_photo AS u_profile_photo,
      'credits' AS u_sub_status,
      NULL::TIMESTAMP AS u_sub_expires,
      c.created_at::timestamp AS u_assigned_at,
      COALESCE(uc.balance, 0)::NUMERIC AS u_credit_balance,
      up.bio AS u_bio,
      up.gender AS u_gender,
      up.age AS u_age,
      up.location AS u_location,
      up.interests AS u_interests
    FROM public.conversations c
    JOIN public.agents a ON c.agent_id = a.id
    JOIN public.user_profiles up ON c.user_id = up.id
    JOIN public.user_credits uc ON up.id = uc.user_id
    WHERE a.user_id = auth.uid()
    AND c.status = 'active'
    AND uc.balance > 0
  )
  SELECT DISTINCT ON (u_id)
    u_id,
    u_username,
    u_full_name,
    u_email,
    u_phone,
    u_profile_photo,
    u_sub_status,
    u_sub_expires,
    u_assigned_at,
    u_credit_balance,
    u_bio,
    u_gender,
    u_age,
    u_location,
    u_interests
  FROM all_users
  ORDER BY u_id, u_assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.agent_get_assigned_users() TO authenticated;

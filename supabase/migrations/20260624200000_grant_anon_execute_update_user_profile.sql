-- 20260624200000_grant_anon_execute_update_user_profile.sql
-- Grant execute permission on update_user_profile to anon (unauthenticated) role
-- to support saving profile details during registration before email verification.

GRANT EXECUTE ON FUNCTION public.update_user_profile(uuid, text, integer, text, text, text, text, text) TO anon, authenticated;

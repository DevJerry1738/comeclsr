-- Run this query to see what policies currently exist on user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- If you see 0 rows, policies don't exist and AGGRESSIVE_RLS_RESET didn't work
-- If you see old policy names, they weren't deleted

-- Also check if RLS is even ENABLED on the table:
SELECT tablename, rowsecurity 
FROM pg_class 
JOIN pg_tables ON pg_class.relname = pg_tables.tablename 
WHERE tablename = 'user_profiles';
-- Should show rowsecurity = true

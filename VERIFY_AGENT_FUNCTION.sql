-- Verify agent_create_account function exists
-- Run this in Supabase SQL editor to test

-- Step 1: Check if function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'agent_create_account'
  AND pg_catalog.pg_get_namespace_name(pronamespace) = 'public'
);

-- Step 2: Test calling the function (requires admin user to be authenticated)
-- This will fail if not authenticated as admin, which is expected
-- SELECT public.agent_create_account('Test Agent', 'test@example.com');

-- Step 3: Check function parameters
SELECT 
  proname,
  pronargs,
  proargnames,
  proargtypes
FROM pg_proc 
WHERE proname = 'agent_create_account'
AND pg_catalog.pg_get_namespace_name(pronamespace) = 'public';

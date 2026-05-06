# Fix Registration: Add Missing RLS Policy

## The Problem
Registration fails with 401 Unauthorized because the `user_profiles` table is missing an INSERT policy.

## The Solution
Add the missing INSERT policy via Supabase Dashboard (2 minutes):

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select your project "ComeClsr"

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Paste this SQL:**
   ```sql
   CREATE POLICY "Users can create their own profile"
     ON public.user_profiles
     FOR INSERT
     WITH CHECK (auth.uid() = id);
   ```

4. **Execute the query**
   - Click "Run" or press Cmd+Enter

5. **Go back to app and try registering again**
   - Navigate to http://localhost:3000/register
   - Fill in the form and submit

## Why This Works
- RLS policies control who can read/write data
- The INSERT policy allows authenticated users to insert their own profile (where id = their auth user id)
- Without this, registration would keep failing with 401

## If Still Getting Errors
- Check browser console for error message
- The error will tell you which policy is missing
- Run the corresponding policy SQL from this migration file:
  `supabase/migrations/20260504_initial_schema.sql`

---

After this manual fix, the app should work!

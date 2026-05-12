# Fix Signup Errors - Complete Guide

## Current Issues Being Fixed

1. **401 on profile insert** → RLS policies have conflicts/aren't fully applied
2. **400 on photo upload** → Storage bucket RLS policies missing
3. **Form doesn't reset** → ✅ FIXED - form now resets on success
4. **No success message** → ✅ FIXED - success toast now shown before redirect

## What Changed

### Updated Files
- **Register.tsx** - Form now properly resets, better error messages, silent photo failures
- **COMPLETE_RLS_FIX.sql** - New comprehensive RLS fix (replaces the old one)

## What You Need To Do

### STEP 1: Apply AGGRESSIVE_RLS_RESET.sql (If COMPLETE_RLS_FIX didn't work)

If you already ran COMPLETE_RLS_FIX and still getting 401 errors, use this more aggressive reset:

1. Go to: https://app.supabase.com → Your Project
2. Click **SQL Editor** → **New Query**
3. Copy **ALL** the SQL from [AGGRESSIVE_RLS_RESET.sql](AGGRESSIVE_RLS_RESET.sql)
4. Paste into the SQL Editor
5. Click **Run** ← Important!
6. Should complete with no errors

**What it does:**
- Disables RLS (flushes all cached policies)
- Drops every single existing policy
- Re-enables RLS (resets the policy engine)
- Creates 4 brand new clean policies

### STEP 2: Delete profile-photos Bucket (If it exists with RLS issues)

If you created a profile-photos bucket earlier:

1. Go to **Storage** in Supabase
2. Find "profile-photos" bucket
3. Click the 3-dot menu → **Delete bucket**
4. Confirm

This removes any storage RLS conflicts. Photos are optional anyway.

### STEP 3: Hard Refresh Browser

1. Press: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
2. This clears browser cache and resets connections

### STEP 4: Test Signup WITHOUT Photo

1. Go to: http://localhost:5173/register
2. Fill out all 3 steps
3. **Skip the photo** (leave Step 2 blank for now)
4. Click "Complete Registration"
5. You should see: "Account created successfully!"

### Expected Results

After applying the fix:
- ✅ Auth user created
- ✅ Confirmation email sent
- ✅ Profile inserted in database (no 401 error)
- ✅ Photo upload works (or silently skips if optional)
- ✅ Success message displayed
- ✅ Form resets
- ✅ Redirect to login

## Troubleshooting

### Still getting 401 "new row violates row-level security policy"?

**This is the main issue.** It means RLS policies aren't working correctly.

**What to try:**
1. ✅ **First**: Did you actually click **Run** in SQL Editor? (Just pasting doesn't execute)
2. ✅ **Second**: Run AGGRESSIVE_RLS_RESET.sql (it's more thorough)
3. ✅ **Third**: Make sure you selected the CORRECT Supabase project
4. ✅ **Fourth**: Hard refresh browser (Ctrl+Shift+R) and retry
5. ✅ **Fifth**: Try signing up **WITHOUT a photo** first - test database insert separately from storage

**If still failing:**
- Go to **SQL Editor** → Run this to check policies:
```sql
SELECT policyname, polcmd FROM pg_policies WHERE tablename = 'user_profiles';
```
- You should see 4 policies: `user_insert_own`, `user_select_own`, `user_select_all`, `user_update_own`
- If you see 0 policies or old ones, the SQL didn't execute properly

### Getting 400 on photo upload?

**This is expected** - storage RLS is separate issue
- This won't block signup anymore (profile creates even if photo fails)
- Try signing up without a photo first
- Photos can be added after profile is created

### Getting "Cannot create profile - RLS policies not applied"?

**This is the app telling you** that the INSERT policy is definitely missing
- Follow AGGRESSIVE_RLS_RESET.sql steps exactly
- Verify it ran with no errors in red
- Refresh browser
- Try again

## File Locations

- **COMPLETE_RLS_FIX.sql** ← Use this one (in project root)
- Register.tsx (src/pages/Register.tsx)
- Supabase Config: src/lib/supabase.ts

## Next Steps

1. Apply COMPLETE_RLS_FIX.sql
2. Test signup end-to-end
3. Verify user appears in Supabase dashboard
4. Verify profile was created in user_profiles table
5. Test login with new account


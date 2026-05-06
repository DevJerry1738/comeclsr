# Registration Fix - Complete Solution

## What Was Fixed

### 1. **Code Changes** ✅ DONE
- **[Register.tsx](src/pages/Register.tsx)**: Removed profile creation from signup (it fails without confirmed email). Now just creates Supabase auth user and redirects to login.
- **[useAuth.ts](src/hooks/useAuth.ts)**: Added auto-profile creation on first login after email confirmation. When user logs in and no profile exists, it creates one automatically.

### 2. **Database Setup** ⚠️ NEEDS MANUAL FIX

The migration push failed due to Supabase CLI issues. **You need to manually run the RLS policy fix:**

## Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your **ComeClsr** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

## Step 2: Run the Fix SQL

Copy and paste the entire content of `RLS_FIX.sql` from this folder and click **Run**.

This will:
- ✅ Drop old policies (avoiding conflicts)
- ✅ Create the INSERT policy so users can create profiles
- ✅ Create the SELECT policy so users can read profiles
- ✅ Create admin policies for management
- ✅ Enable RLS on the table

## Step 3: Test Registration

Now the full flow works:

1. **Register** at http://localhost:3000/register
   - Fill form → Submit → User created in Supabase Auth
   - Supabase sends email with confirmation link
   
2. **Confirm Email**
   - Click link in email
   - Redirected to app homepage
   
3. **Login** at http://localhost:3000/login
   - Enter email/password → Click Login
   - User looks for profile in DB
   - Profile doesn't exist → Auto-created from auth metadata
   - Redirected to dashboard ✅

4. **Verify Success**
   - Dashboard loads with user info
   - Check Supabase → Authentication tab → User appears
   - Check Supabase → Table Editor → user_profiles → New row appears

## Flow Diagram

```
SIGNUP
  ↓
User fills form → Click Register
  ↓
Supabase Auth creates user (no session returned)
  ↓
Email confirmation sent
  ↓
User clicks email link
  ↓
Redirected to login page
  ↓
LOGIN
  ↓
User enters credentials
  ↓
Supabase Auth returns session
  ↓
useAuth hook fetches profile
  ↓
Profile doesn't exist (first login)
  ↓
useAuth AUTO-CREATES profile from auth metadata
  ↓
User data loads on dashboard ✅
```

## If You Still Get Errors

**Error: "42501 - RLS policy violation"**
→ The RLS_FIX.sql didn't run completely
→ Go back to SQL Editor and run it again

**Error: "No profile found for user"**
→ This is now handled! The app auto-creates it on login
→ Just log in, profile will be created automatically

**Different error**
→ Check browser console
→ Error message will indicate which table needs fixing

---

## Files Changed

- `src/pages/Register.tsx` - Removed premature profile creation
- `src/hooks/useAuth.ts` - Added auto-profile creation on login
- `supabase/migrations/20260504_initial_schema.sql` - Fixed for idempotency
- `RLS_FIX.sql` - Manual RLS policy fix (run in SQL Editor)

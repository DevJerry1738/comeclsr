# Fix Registration 403 Error

## The Problem
Registration fails with **403 Forbidden** when trying to insert the user profile. This means the **INSERT RLS policy is missing** on the `user_profiles` table.

## Solution: Add the Missing RLS Policy (5 minutes)

### Step 1: Go to Supabase SQL Editor

1. Open: https://app.supabase.com
2. Select your **ComeClsr** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Add the INSERT Policy

Copy and paste this SQL:

```sql
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

Then click **Run**.

### Step 3: Verify It Works

Try registering again at http://localhost:3000/register

---

## Why This Works

- **RLS (Row Level Security)** controls who can read/write data in Supabase
- This policy allows authenticated users to INSERT their own profile
- The `WITH CHECK (auth.uid() = id)` means: "Only allow insert if the user's auth ID matches the profile ID"
- Without this policy → 403 Forbidden error

---

## After Adding the Policy

1. Go to http://localhost:3000/register
2. Fill in the 3-step registration form
3. Click "Complete Registration"
4. ✅ Should now work!

---

## If Still Getting Errors

**403 Still appears?**
→ Policy might not be enabled for RLS
→ Go to Table Editor → user_profiles → RLS toggle should be ON

**Different error after registration?**
→ Check browser console
→ Error message will tell you which table/policy needs fixing

---

## Complete Test Flow

1. **Register** at http://localhost:3000/register
2. **Check Supabase** → Users appear in Authentication tab
3. **Check Dashboard** → Go to http://localhost:3000/dashboard
4. **See profile data** or basic user info
5. **Logout** → Click Logout button
6. **Login** at http://localhost:3000/login with registered credentials

Done! 🎉

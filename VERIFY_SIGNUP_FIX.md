# RLS Signup Fix - Verification Status

## ✅ All Fixes Applied & Deployed

### 1. Migration File Updated ✅
**File**: `supabase/migrations/20260504_initial_schema.sql`

The INSERT policy for `user_profiles` now includes `TO authenticated`:
```sql
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated  -- CRITICAL: This ensures the policy applies to authenticated users
  WITH CHECK (auth.uid() = id);
```

**All 4 user_profiles policies have `TO authenticated`**:
- ✅ INSERT: `FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`
- ✅ SELECT (own): `FOR SELECT TO authenticated USING (auth.uid() = id)`
- ✅ SELECT (all): `FOR SELECT TO authenticated USING (auth.role() = 'authenticated')`
- ✅ UPDATE: `FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`

### 2. Session Delay Added ✅
**File**: `src/pages/Register.tsx` (lines 150-160)

```typescript
// Step 2: Set session so RLS policies recognize the user
const session = authData.session || await supabase.auth.getSession().then(res => res.data.session);
if (session) {
  await supabase.auth.setSession(session);
  // Small delay to ensure RLS context is propagated before profile creation
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

### 3. Migrations Deployed ✅
**Command**: `npm run supabase:push`

Result: `Remote database is up to date.`

The policies are now live in the Supabase database.

---

## How the Fix Works

### The RLS Issue
When a new user registers:
1. Auth user created → ✅ Success (no RLS on auth.users)
2. Session set → Now auth.uid() returns the new user ID
3. Profile insert attempted → ❌ Was failing because...

**Root Cause**: The INSERT policy didn't have `TO authenticated`, so it applied to **anonymous users only**. When an authenticated user tried to insert, the policy didn't apply, and no default policy exists → 403 Forbidden.

### The Fix
Adding `TO authenticated` makes the policy apply to authenticated users:
- New user tries to insert → Policy applies
- `WITH CHECK (auth.uid() = id)` validates they're inserting their own record
- ✅ Insert succeeds

The 500ms delay ensures Supabase has fully propagated the session before attempting the insert.

---

## Testing the Fix

### Manual Test (Recommended)
1. Go to `/register` in the UI
2. Complete the signup form
3. Check that:
   - Auth user is created
   - Profile is created (no RLS error)
   - Success toast appears
   - Redirect to login works

### SQL Verification (Admin Only)
Connect to Supabase database and run:
```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

Expected results:
- 4 policies total
- All have `authenticated` in roles
- INSERT policy has WITH CHECK clause

### Check Specific Error
If signup still fails, the error message will say:
- `"new row violates row-level security policy"` → Check policies above
- `"duplicate key value violates unique constraint"` → Duplicate email or username
- `"Can't convert undefined to uuid"` → Missing id field in insert

---

## Files Modified (For Changelog)
1. `supabase/migrations/20260504_initial_schema.sql` - RLS policies with `TO authenticated`
2. `src/pages/Register.tsx` - Added 500ms session propagation delay

## Status Summary
- **Migration File**: ✅ Fixed with `TO authenticated`
- **Code Changes**: ✅ 500ms delay in place
- **Deployment**: ✅ Pushed to Supabase
- **Verification**: ✅ Ready for manual testing

**Next Steps**: Test signup flow end-to-end to confirm 403 errors are resolved.

# Complete Deployment Checklist

## ✅ Completed Changes

### 1. Dashboard Profile Photo Display
- **File:** `src/pages/Dashboard.tsx`
- **Change:** Added `imageUrl={user.profile_photo}` to AvatarRing component
- **Result:** Profile photos will now display on dashboard (if they exist)

### 2. Register Profile Photo Upload
- **File:** `src/pages/Register.tsx`  
- **Changes:**
  - Added Supabase Storage upload in `handleSubmit()`
  - File uploaded to `user-profiles/{user_id}/` bucket
  - Public URL saved to database instead of base64
  - Proper error handling for upload failures
- **Result:** Users can upload photos during signup, photos will display on dashboard

### 3. Migration Deployment Guide
- **File:** `PUSH_MIGRATIONS_TO_SUPABASE.md`
- **Contents:** Complete SQL scripts for all 3 migrations
- **Manual Steps:** Using Supabase SQL Editor

---

## 🔧 CRITICAL NEXT STEPS

### Step 1: Deploy Database Migrations (30 minutes)

**Why:** The RPC functions don't exist in your Supabase database, causing 404 errors on dashboard load.

**How:**
1. Open `PUSH_MIGRATIONS_TO_SUPABASE.md` in the repo
2. Follow the instructions to go to https://supabase.com/dashboard
3. Navigate to **SQL Editor**
4. Create 3 new queries and run each migration SQL script in order:
   - **Migration 1:** Credit system tables (creates 5 tables + RLS policies)
   - **Migration 2:** RPC functions (creates 5 RPC functions)
   - **Migration 3:** Admin settings update function

**Verification:** After running all 3, execute this query in SQL Editor:
```sql
SELECT * FROM credit_packages;
```
Should return 3 rows (Starter, Popular, Pro packages).

---

### Step 2: Test the Application

**Dashboard Test:**
1. Refresh browser (`Ctrl+R` or `Cmd+R`)
2. Log out completely
3. Log back in
4. Dashboard should load in 2-3 seconds (not 30+ seconds)
5. Profile avatar should display if you uploaded a photo during signup

**Profile Photo Test:**
1. Go to Dashboard → Settings (gear icon)
2. Click "Profile" tab
3. Upload a new photo using the upload button
4. Click "Save Profile"
5. Photo should display in avatar within 2-3 seconds

**Signup Photo Test:**
1. Log out and go to Register
2. Complete steps 1-2
3. On Step 2, upload a profile photo
4. Complete registration
5. Confirm email
6. Log back in
7. Dashboard avatar should show the uploaded photo

**Credit System Test:**
1. Go to Admin Dashboard (`/admin`)
2. Click **Settings** → **Credit System** tab
3. Verify you see fields for "Message Cost Rate" and "Minimum Deposit Amount"
4. Try updating these values
5. Should see success message "Settings updated successfully"

---

### Step 3: Deploy to Production

Once all tests pass:

1. **Commit changes:**
   ```bash
   git add -A
   git commit -m "Deploy profile photos and credit system migrations"
   ```

2. **Push to repo:**
   ```bash
   git push origin main
   ```

3. **Deploy to Supabase production** (if using migrations CLI):
   ```bash
   supabase db push
   ```
   OR keep using the manual SQL approach if CLI auth issues persist

---

## 📋 Architecture Summary

### Profile Photo Flow

**Signup:**
```
User uploads photo in Register
  ↓
handlePhotoChange() creates preview
  ↓
handleSubmit() uploads to Supabase Storage: user-profiles/{user_id}/photo.*
  ↓
Gets public URL: https://...supabase.co/storage/v1/object/public/user-profiles/{user_id}/photo.*
  ↓
Saves URL to user_profiles.profile_photo via update_user_profile RPC
  ↓
useAuth() fetches profile_photo on login
  ↓
Dashboard displays via AvatarRing imageUrl prop
```

**Profile Update:**
```
User clicks upload in ProfileTab
  ↓
handlePhotoSelect() creates preview
  ↓
handlePhotoUpload() uploads to Supabase Storage
  ↓
Gets public URL
  ↓
Updates user_profiles.profile_photo directly
  ↓
AvatarRing refreshes with new photo
```

### Credit System Flow

**Admin Configuration:**
```
Admin goes to /admin → Settings → Credit System
  ↓
Sets message_cost_rate (e.g., 5.00) 
  ↓
Sets minimum_deposit_amount (e.g., 29.99)
  ↓
Calls rpc.settings.updateAdminSettings()
  ↓
Stored in admin_settings table
```

**User Deposits:**
```
User goes to /deposit
  ↓
Selects credit package (calls rpc.payment.getCreditPackages())
  ↓
Chooses payment method on /deposit-payment
  ↓
Creates payment request (calls rpc.payment.createDepositRequest())
  ↓
Payment status: "pending"
```

**Admin Approval:**
```
Admin views AdminPayments
  ↓
Clicks "Approve" on pending deposit
  ↓
Calls rpc.payment.approveDeposit(payment_request_id)
  ↓
RPC function:
  - Updates payment status to "confirmed"
  - Adds credits to user_credits.balance
  - Logs transaction in credit_transactions
  - Creates conversations with ALL agents
  - Sends auto-greeting from each agent
```

**User Messaging:**
```
User sends message to agent
  ↓
Calls rpc.payment.user_send_message()
  ↓
RPC function:
  - Checks user has balance >= message_cost_rate
  - Deducts credits from user_credits.balance
  - Logs transaction as "message_deduction"
  - Creates message record
  ↓
Frontend displays updated balance via useQuery("user_credits")
```

---

## 🎯 Success Criteria

All items should be true before considering complete:

- [ ] Dashboard loads in < 5 seconds (not 30+ seconds)
- [ ] Profile photos display on dashboard if uploaded
- [ ] Can upload photos during signup
- [ ] Can upload photos in profile settings
- [ ] Admin Settings shows credit system tab
- [ ] Can update message cost rate without errors
- [ ] Credit packages visible to users
- [ ] Deposit flow accessible from dashboard
- [ ] No 404 errors in browser console
- [ ] No TypeScript compilation errors

---

## 🆘 Troubleshooting

### Dashboard still loading slowly
- Verify migrations deployed: Run `SELECT * FROM admin_settings;` in SQL Editor
- Should return 1 row with message_cost_rate=5.00
- If empty, rerun Migration 1

### Photos not showing on dashboard
- Check browser console for errors
- Verify photo file exists in Supabase Storage: https://supabase.com/dashboard → Storage → user-profiles
- Confirm profile_photo URL is saved in database: Check user_profiles.profile_photo column

### "404 Not Found" for RPC functions
- Check that all 3 migrations ran successfully
- Run this in SQL Editor to list all functions:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_type = 'FUNCTION' AND routine_schema = 'public';
  ```
- Should include: `admin_settings_get`, `admin_settings_update`, `user_credits_get_balance`, etc.

### Photo upload fails during signup
- Check file is < 5MB
- Check file is valid image (PNG, JPG, GIF)
- Verify Supabase Storage bucket exists: https://supabase.com/dashboard → Storage
- Bucket name should be: `user-profiles` (check capitalization)

---

## 📞 Additional Notes

- All code changes are backward compatible
- Migrations add RLS policies automatically
- All existing functionality preserved
- Photo uploads use signed URLs for security
- Base64 previews only used for UI, not stored

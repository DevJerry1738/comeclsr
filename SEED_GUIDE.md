# Seeding Test Data - Complete Guide

## The Problem
`user_profiles.id` has a foreign key to `auth.users.id`. You can't insert profiles with arbitrary UUIDs.

## Solution: Two Options

### ✅ Option A: Manual Auth User Creation (Recommended for Testing)

1. **Create Auth Users in Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Go to **Authentication** → **Users**
   - Click **Add User** (top right)
   - Create users:
     - admin@example.com / password123
     - freelancer@example.com / password123
     - business@example.com / password123
     - agent@example.com / password123
     - corporate@example.com / password123

2. **Copy the UUIDs**
   - Each user gets a UUID (click the user to see it)
   - Update SEED_DATA.sql with real UUIDs
   - Replace the hardcoded UUIDs with actual ones

3. **Run the Updated Script**
   - Go to SQL Editor
   - Paste updated SEED_DATA.sql
   - Click Run

### 🚀 Option B: Automated with Bypass (Quick Testing)

The updated `SEED_DATA.sql` now includes:
```sql
ALTER TABLE public.user_profiles DISABLE TRIGGER ALL;
-- ... insert seed data ...
ALTER TABLE public.user_profiles ENABLE TRIGGER ALL;
```

This **temporarily disables constraints** for seeding, then re-enables them.

**To use:**
1. Go to Supabase → SQL Editor
2. Copy entire `SEED_DATA.sql`
3. Click **Run**
4. Done! All test data is inserted

## 🔑 Important Notes

- **After seeding via Option B**: You still need to create Auth users for login to work
- **Email addresses must be verified** if you want them to log in
- **Use test@example.com email format** for local testing
- The seed script uses `ON CONFLICT (id) DO NOTHING` to prevent duplicates

## Login After Seeding

If you used Option B (automated), you need to:

1. Create auth users with **same email addresses** as seeded profiles
2. Set their passwords
3. Verify their emails (optional for dev)

Then login will work:
- admin@example.com → admin dashboard
- freelancer@example.com → user dashboard
- business@example.com → user dashboard
- etc.

## Verify Seed Data

After running the SQL, you'll see counts:
```
total_users     | 6
kyc_submissions | 5
conversations   | 1
user_settings   | 5
support_tickets | 1
payments        | 2
```

## Troubleshooting

**Error: Foreign key violation**
→ Use Option B (automated with trigger bypass)

**Can't login after seeding**
→ Create Auth users manually with same emails

**Data not appearing in tables**
→ Check Supabase RLS policies (they may block your view)

---

**Recommended workflow:**
1. Use Option B to seed profiles/data quickly
2. Create 1-2 Auth users manually for login testing
3. Test app with real auth flow

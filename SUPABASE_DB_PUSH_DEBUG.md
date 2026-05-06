# 🔧 Supabase db push - Debugging Guide

**Status**: You tried to push the schema but got an error  
**Next**: Follow these steps to fix it

---

## 📋 Step 1: Verify Prerequisites

Run these commands in order:

```powershell
# 1. Check if npm install ran
npm ls @types/node

# Should see: @types/node@24.10.1 (or similar)
# If not found, run:
npm install

# 2. Check if .env file has credentials
Get-Content .env | Select-String "SUPABASE_"

# Should show your Supabase URL and keys
# If empty, copy from .env.example and verify they're set
```

---

## 🔐 Step 2: Authenticate with Supabase

```powershell
# 1. Login to Supabase
supabase login

# This will open a browser to authenticate
# Then give you an access token

# 2. Link your project (replace with your project ref)
supabase link --project-ref uyuecdtiupucoixnpwbz

# You should see:
# ✓ Linked to project: xxxxxxxx
```

**Get your project ref**:
- Go to https://app.supabase.com
- Click your project
- Copy the project ref from the URL or settings
- Or run: `supabase projects list`

---

## 📝 Step 3: Check Schema for Errors

```powershell
# Validate the migration file
supabase db show

# Should show your current schema (should be minimal for new project)
```

---

## 🚀 Step 4: Push the Database Schema

```powershell
# Push migrations to Supabase
supabase db push

# You should see:
# ✓ Applied migration 20260504_initial_schema.sql
# ✓ Done
```

If you get errors about specific SQL statements, check the error message and jump to **Troubleshooting** below.

---

## 🐛 Troubleshooting

### Error: "Not logged in"
```powershell
supabase login
supabase link --project-ref [your-project-ref]
```

### Error: "Not linked to a project"
```powershell
# List your projects
supabase projects list

# Link to the correct one
supabase link --project-ref uyuecdtiupucoixnpwbz
```

### Error: "Could not connect to the database"
- Check that your Supabase project is running
- Verify your internet connection
- Wait a minute and try again
- Check https://status.supabase.com for outages

### Error: SQL syntax errors in the migration
- The schema migration file might have issues
- Run: `supabase migration create check_migrations`
- Check: `supabase/migrations/` directory for the latest file
- Review error message and fix the SQL

### Error: "RLS policy creation failed"
- RLS policies might have syntax issues
- Try pushing without the migration first
- Or check the specific policy name mentioned in error

---

## ✅ Verify Push Success

After successful push:

```powershell
# 1. Check if tables exist in Supabase
supabase db show

# Should list: user_profiles, agents, conversations, messages, etc.

# 2. View schema in browser
# Go to: https://app.supabase.com
# → SQL Editor
# → Check "user_profiles" table exists
```

---

## 🔄 Full Step-by-Step (Fresh Start)

If nothing is working, try from scratch:

```powershell
# 1. Clean up old auth
supabase logout
supabase projects list  # Should be empty or error

# 2. Fresh login
supabase login

# 3. List projects
supabase projects list

# 4. Link to project
supabase link --project-ref uyuecdtiupucoixnpwbz

# 5. Push schema
supabase db push

# 6. Verify
supabase db show
```

---

## 📞 Need More Help?

**If push still fails**:
1. Note the exact error message
2. Check Supabase status: https://status.supabase.com
3. Review https://supabase.com/docs/guides/local-development
4. Check your project at: https://app.supabase.com

---

## ✨ Next: After Successful Push

Once `supabase db push` succeeds:

1. ✅ Your 12 tables are created
2. ✅ RLS security policies are active
3. ✅ Database indexes are in place
4. ✅ Ready for Phase 2: Authentication

Then proceed with:
```powershell
npm run dev  # Start frontend
# Open http://localhost:3000
```

---

**Status**: Follow steps above to fix and re-run `supabase db push`  
**Expected Time**: 5-10 minutes  
**Next**: Phase 2 auth implementation once schema is pushed

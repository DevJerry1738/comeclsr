# 🚀 Agent Photo Upload - Quick Start Guide

## The Problem ❌
- Admin uploads agent profile photo
- Gets 400 Bad Request error
- Agent card still shows initials instead of photo

## The Solution ✅
- Created **Edge Function** to handle uploads server-side
- Uses elevated permissions to bypass storage restrictions
- Updates database automatically after upload

## What You Need to Do (5 min setup)

### 1. Create Storage Bucket
- Go to Supabase Dashboard → Storage
- Click "Create a new bucket"
- Name: `profile-photos`
- Privacy: **Public**
- Click Create

### 2. Create 4 Policies in Storage
In `profile-photos` bucket > Policies tab:

| Policy | Target | Operation | Expression |
|--------|--------|-----------|------------|
| Upload | authenticated | INSERT | `auth.role() = 'authenticated'` |
| View | authenticated, anon | SELECT | `true` |
| Update | authenticated | UPDATE | `auth.role() = 'authenticated'` |
| Delete | authenticated | DELETE | `auth.role() = 'authenticated'` |

### 3. Test
1. Go to http://localhost:3000/admin/agents
2. Click edit (✏️) on an agent
3. Upload a photo
4. Should display immediately
5. Check /messages page - photo shows there too

## What Changed in Code

### Edge Function (NEW)
- File: `supabase/functions/upload-agent-photo/index.ts`
- Handles upload with admin verification
- Updates database with photo URL
- Already deployed to Supabase ✅

### Frontend Update
- File: `src/pages/admin/AdminAgents.tsx`
- Calls Edge Function instead of direct storage upload
- Handles auth token and error cases
- Already built and ready ✅

### Build Status
- ✅ Built successfully
- ✅ No errors
- ✅ Ready to test

## If Something Goes Wrong

| Error | Solution |
|-------|----------|
| Bucket not found | Create `profile-photos` bucket in Storage |
| 403 Forbidden | Make sure you're logged in as admin |
| 400 Bad Request | Check all 4 storage policies are created and enabled |
| Photo doesn't display | Refresh page, check browser console for errors |

## Files to Review

1. **AGENT_PHOTO_UPLOAD_FIX.md** - Complete technical guide
2. **STORAGE_BUCKET_SETUP.md** - Detailed Supabase setup steps
3. **src/pages/admin/AdminAgents.tsx** - Frontend implementation
4. **supabase/functions/upload-agent-photo/index.ts** - Backend implementation

## Key Points

- 🔐 Admin role verification happens server-side
- 📸 Photo and database update happen in one atomic operation
- 🌐 Uses Edge Function for reliable server-side handling
- ⚡ Already deployed to Supabase
- 💻 Code is built and ready to test

---

**Status**: Implementation COMPLETE ✅ | Awaiting storage bucket setup from user

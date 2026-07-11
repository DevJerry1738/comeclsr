# Agent Profile Photo Upload - Storage Bucket Setup

## Overview
The agent profile photo upload now uses a Supabase Edge Function to bypass storage bucket RLS policies. However, you still need to configure the `profile-photos` storage bucket for this to work.

## Prerequisites
- Supabase project dashboard access
- Admin role in the application

## Setup Steps

### Step 1: Create the Storage Bucket
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (uyuecdtiupucoixnpwbz)
3. Navigate to **Storage** in the left sidebar
4. Click the **"Create a new bucket"** button
5. Fill in the form:
   - **Name**: `profile-photos`
   - **Privacy**: Select **"Public"** (so photo URLs are accessible)
   - Check "Confirm I understand" if prompted
6. Click **Create bucket**

### Step 2: Create Storage Policies
The bucket needs to allow authenticated uploads:

1. In the Storage section, find the `profile-photos` bucket
2. Click on the bucket name to open its settings
3. Go to the **Policies** tab
4. Click **New Policy** and create these policies:

**Policy 1: Allow authenticated users to INSERT (upload)**
- Target roles: `authenticated`
- Allowed operations: `INSERT`
- Using expression: `auth.role() = 'authenticated'`

**Policy 2: Allow anyone to SELECT (view)**
- Target roles: `authenticated`, `anon`
- Allowed operations: `SELECT`
- Using expression: `true`

**Policy 3: Allow authenticated users to UPDATE**
- Target roles: `authenticated`
- Allowed operations: `UPDATE`
- Using expression: `auth.role() = 'authenticated'`

**Policy 4: Allow authenticated users to DELETE**
- Target roles: `authenticated`
- Allowed operations: `DELETE`
- Using expression: `auth.role() = 'authenticated'`

### Step 3: Test the Upload
1. Navigate to `http://localhost:3000/admin/agents` in your app
2. Click on an agent card's edit button
3. Select a photo file to upload
4. Click "Save Changes"
5. The photo should upload and display immediately
6. The agent card should show the new photo instead of initials

## How It Works
1. Admin clicks to upload a photo for an agent
2. Frontend calls the `upload-agent-photo` Edge Function with the agent ID and file
3. Edge Function verifies the user is authenticated and has admin role
4. Edge Function uses the Supabase service role to upload the file (bypasses storage policies)
5. Edge Function updates the agent's profile_photo URL in the database
6. Frontend immediately updates the UI to show the new photo

## Troubleshooting

### Error: "Storage bucket does not exist"
- Create the `profile-photos` bucket following Step 1 above
- Ensure the name is exactly `profile-photos` (lowercase)

### Error: "Method not allowed" or "Forbidden"
- Verify you're logged in as an admin user
- Check your admin role in the database: `SELECT role FROM user_profiles WHERE id = '[your-user-id]'`

### Photo uploads but doesn't display
- Check browser console for errors
- Verify the photo URL is accessible in a new tab
- Ensure the agent's profile_photo column was updated in the database

### 403 Forbidden on upload
- Check that the `profile-photos` bucket policies are set correctly
- Ensure at least the "INSERT" policy for authenticated users exists

## Edge Function Reference
The edge function is deployed at:
```
https://uyuecdtiupucoixnpwbz.supabase.co/functions/v1/upload-agent-photo
```

Source: `supabase/functions/upload-agent-photo/index.ts`

Requirements:
- Authenticated user (verified via JWT token)
- Admin role (checked against user_profiles table)
- Valid agentId (must exist in user_profiles with role='agent')
- File to upload (any type, max size depends on Supabase plan)

-- 20260624190000_allow_anon_uploads_profile_photos.sql
-- Allow anon (unauthenticated) users to upload profile photos during registration

CREATE POLICY "Allow anon uploads to profile-photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'profile-photos');

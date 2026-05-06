-- Quick Seed SQL for Testing - Run directly in Supabase SQL Editor
-- Creates test users with all user types

-- ⚠️ IMPORTANT STEPS:
-- 1. First, create Auth users via Supabase Dashboard → Authentication → Users → Add User
--    (You'll get their UUID after creation)
-- 2. Then run this SQL with the correct UUIDs from step 1
-- 3. Or use the simplified version below that works with direct inserts

-- ALTERNATIVE: Use this simpler approach
-- Temporarily disable FK constraint, insert seed, re-enable
ALTER TABLE public.user_profiles DISABLE TRIGGER ALL;

-- ====================================
-- 1. ADMIN USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status, 
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 
  'admin@example.com', 'Admin User', 'admin_user',
  '+1-555-0100', 'other', 35, 'New York, USA',
  'admin,management,support', 'Platform administrator',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  'admin', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 2. FREELANCER USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'e0a21e4b-7c9d-4e5f-a1b2-c3d4e5f6a7b8'::uuid,
  'freelancer@example.com', 'Alex Johnson', 'alex_freelancer',
  '+1-555-0101', 'male', 28, 'San Francisco, USA',
  'coding,design,freelance', 'Freelance developer and designer',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 3. BUSINESS OWNER USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'd1c3e2b4-a5f6-47e8-b9c0-d1e2f3a4b5c6'::uuid,
  'business@example.com', 'Sarah Chen', 'sarah_business',
  '+1-555-0102', 'female', 42, 'Los Angeles, USA',
  'business,marketing,strategy', 'Small business owner and entrepreneur',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  'user', 'active', 'pending', 'pending', 'pending',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 4. CONSULTANT/AGENT USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'c2b1a0f9-e8d7-4c6b-a5b4-c3d2e1f0a9b8'::uuid,
  'agent@example.com', 'Michael Rodriguez', 'michael_agent',
  '+1-555-0103', 'male', 35, 'Austin, USA',
  'consulting,coaching,mentoring', 'Business consultant and coach',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 5. CORPORATE/EMPLOYEE USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'b3a0f9e8-d7c6-4b5a-a4c3-d2e1f0a9b8c7'::uuid,
  'corporate@example.com', 'Emma Thompson', 'emma_corporate',
  '+1-555-0104', 'female', 31, 'Boston, USA',
  'corporate,hr,recruitment', 'HR Manager at tech company',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 6. INACTIVE USER
-- ====================================
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'a2f8e7d6-c5b4-4a39-b8c7-d6e5f4a3b2c1'::uuid,
  'inactive@example.com', 'David Wilson', 'david_inactive',
  '+1-555-0105', 'male', 29, 'Seattle, USA',
  'development', 'Developer (account inactive)',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
  'user', 'inactive', 'declined', 'rejected', 'inactive',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 7. KYC SUBMISSIONS FOR EACH USER
-- ====================================
INSERT INTO public.kyc_submissions (
  user_id, people_type, conversation_type, personality_prefs, expectations, 
  status, created_at, updated_at
) VALUES
-- Admin (usually pre-approved)
(
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'organization', 'business',
  'professional,management,leadership',
  'Platform management and support',
  'approved',
  NOW(), NOW()
),
-- Freelancer
(
  'e0a21e4b-7c9d-4e5f-a1b2-c3d4e5f6a7b8'::uuid,
  'individual', 'professional',
  'direct,efficient,detail-oriented',
  'Looking for project opportunities',
  'approved',
  NOW(), NOW()
),
-- Business Owner (pending)
(
  'd1c3e2b4-a5f6-47e8-b9c0-d1e2f3a4b5c6'::uuid,
  'business', 'business',
  'professional,strategic,collaborative',
  'Seeking partnerships and growth',
  'pending',
  NOW(), NOW()
),
-- Agent/Consultant
(
  'c2b1a0f9-e8d7-4c6b-a5b4-c3d2e1f0a9b8'::uuid,
  'individual', 'mentoring',
  'supportive,patient,knowledgeable',
  'Help other professionals grow',
  'approved',
  NOW(), NOW()
),
-- Corporate
(
  'b3a0f9e8-d7c6-4b5a-a4c3-d2e1f0a9b8c7'::uuid,
  'organization', 'business',
  'formal,professional,structured',
  'Corporate recruitment and team building',
  'approved',
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- ====================================
-- 8. USER SETTINGS
-- ====================================
INSERT INTO public.settings (
  user_id, notifications_enabled, email_notifications, sms_notifications,
  language, timezone, theme, created_at, updated_at
) VALUES
('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, true, true, false, 'en', 'America/New_York', 'dark', NOW(), NOW()),
('e0a21e4b-7c9d-4e5f-a1b2-c3d4e5f6a7b8'::uuid, true, true, true, 'en', 'America/Los_Angeles', 'light', NOW(), NOW()),
('d1c3e2b4-a5f6-47e8-b9c0-d1e2f3a4b5c6'::uuid, true, true, false, 'en', 'America/Los_Angeles', 'dark', NOW(), NOW()),
('c2b1a0f9-e8d7-4c6b-a5b4-c3d2e1f0a9b8'::uuid, true, false, false, 'en', 'America/Chicago', 'light', NOW(), NOW()),
('b3a0f9e8-d7c6-4b5a-a4c3-d2e1f0a9b8c7'::uuid, true, true, true, 'en', 'America/New_York', 'dark', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ====================================
-- 9. SAMPLE CONVERSATION
-- ====================================
INSERT INTO public.conversations (
  id, initiator_id, recipient_id, title, status, created_at, updated_at
) VALUES (
  '12345678-1234-1234-1234-123456789012'::uuid,
  'e0a21e4b-7c9d-4e5f-a1b2-c3d4e5f6a7b8'::uuid,
  'c2b1a0f9-e8d7-4c6b-a5b4-c3d2e1f0a9b8'::uuid,
  'Project Collaboration Discussion',
  'active',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 10. SAMPLE SUPPORT TICKET
-- ====================================
INSERT INTO public.tickets (
  id, user_id, title, description, category, priority, status, created_at, updated_at
) VALUES (
  '87654321-4321-4321-4321-210987654321'::uuid,
  'd1c3e2b4-a5f6-47e8-b9c0-d1e2f3a4b5c6'::uuid,
  'Payment Processing Issue',
  'I''m having trouble with payment verification. Can someone help?',
  'payment',
  'high',
  'open',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 11. SAMPLE PAYMENT
-- ====================================
INSERT INTO public.payments (
  id, user_id, amount, currency, payment_method, status, description, created_at, updated_at
) VALUES
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'e0a21e4b-7c9d-4e5f-a1b2-c3d4e5f6a7b8'::uuid,
  99.99, 'USD', 'credit_card', 'completed',
  'Premium subscription - 1 month',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'b3a0f9e8-d7c6-4b5a-a4c3-d2e1f0a9b8c7'::uuid,
  299.99, 'USD', 'credit_card', 'completed',
  'Enterprise plan - annual',
  NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 12. VERIFY SEED DATA
-- ====================================
SELECT 
  (SELECT COUNT(*) FROM public.user_profiles) as total_users,
  (SELECT COUNT(*) FROM public.kyc_submissions) as kyc_submissions,
  (SELECT COUNT(*) FROM public.conversations) as conversations,
  (SELECT COUNT(*) FROM public.settings) as user_settings,
  (SELECT COUNT(*) FROM public.tickets) as support_tickets,
  (SELECT COUNT(*) FROM public.payments) as payments;

-- Re-enable triggers
ALTER TABLE public.user_profiles ENABLE TRIGGER ALL;

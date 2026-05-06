-- Seed User Data for Testing All User Types
-- This migration creates test users with various roles and profiles

-- Admin User
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status, 
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'admin-user-001'::uuid, 'admin@example.com', 'Admin User', 'admin_user',
  '+1-555-0100', 'other', 35, 'New York, USA',
  'ARRAY["admin", "management", "support"]'::text[], 'Platform administrator',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  'admin', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Regular User 1 - Freelancer
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'user-freelancer-001'::uuid, 'freelancer@example.com', 'Alex Johnson', 'alex_freelancer',
  '+1-555-0101', 'male', 28, 'San Francisco, USA',
  'ARRAY["coding", "design", "freelance"]'::text[], 'Freelance developer and designer',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Regular User 2 - Business Owner
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'user-business-001'::uuid, 'business@example.com', 'Sarah Chen', 'sarah_business',
  '+1-555-0102', 'female', 42, 'Los Angeles, USA',
  'ARRAY["business", "marketing", "strategy"]'::text[], 'Small business owner and entrepreneur',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  'user', 'active', 'pending', 'pending', 'pending',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Regular User 3 - Agent/Service Provider
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'user-agent-001'::uuid, 'agent@example.com', 'Michael Rodriguez', 'michael_agent',
  '+1-555-0103', 'male', 35, 'Austin, USA',
  'ARRAY["consulting", "coaching", "mentoring"]'::text[], 'Business consultant and coach',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=michael',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Regular User 4 - Corporate/Employee
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'user-corporate-001'::uuid, 'corporate@example.com', 'Emma Thompson', 'emma_corporate',
  '+1-555-0104', 'female', 31, 'Boston, USA',
  'ARRAY["corporate", "hr", "recruitment"]'::text[], 'HR Manager at tech company',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
  'user', 'active', 'approved', 'approved', 'active',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Regular User 5 - Inactive/Suspended
INSERT INTO public.user_profiles (
  id, email, full_name, username, phone, gender, age, location,
  interests, bio, profile_photo, role, status, payment_status,
  kyc_status, conversation_status, created_at, updated_at
) VALUES (
  'user-inactive-001'::uuid, 'inactive@example.com', 'David Wilson', 'david_inactive',
  '+1-555-0105', 'male', 29, 'Seattle, USA',
  'ARRAY["development"]'::text[], 'Developer (account inactive)',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
  'user', 'inactive', 'declined', 'rejected', 'inactive',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- KYC Submissions for Users
INSERT INTO public.kyc_submissions (
  user_id, people_type, conversation_type, personality_prefs, expectations, 
  status, created_at, updated_at
) VALUES
-- Freelancer KYC
(
  'user-freelancer-001'::uuid,
  'individual', 'professional',
  'ARRAY["direct", "efficient", "detail-oriented"]'::text[],
  'Looking for project opportunities and collaborations',
  'approved',
  NOW(), NOW()
),
-- Business Owner KYC
(
  'user-business-001'::uuid,
  'business', 'business',
  'ARRAY["professional", "strategic", "collaborative"]'::text[],
  'Seeking partnerships and growth opportunities',
  'pending',
  NOW(), NOW()
),
-- Agent KYC
(
  'user-agent-001'::uuid,
  'individual', 'mentoring',
  'ARRAY["supportive", "patient", "knowledgeable"]'::text[],
  'Want to help other professionals grow',
  'approved',
  NOW(), NOW()
),
-- Corporate KYC
(
  'user-corporate-001'::uuid,
  'organization', 'business',
  'ARRAY["formal", "professional", "structured"]'::text[],
  'Corporate recruitment and team building',
  'approved',
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- Settings for Admin
INSERT INTO public.settings (
  user_id, notifications_enabled, email_notifications, sms_notifications,
  language, timezone, theme, created_at, updated_at
) VALUES (
  'admin-user-001'::uuid,
  true, true, false, 'en', 'America/New_York', 'dark',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Settings for Regular Users
INSERT INTO public.settings (
  user_id, notifications_enabled, email_notifications, sms_notifications,
  language, timezone, theme, created_at, updated_at
) VALUES
(
  'user-freelancer-001'::uuid,
  true, true, true, 'en', 'America/Los_Angeles', 'light',
  NOW(), NOW()
),
(
  'user-business-001'::uuid,
  true, true, false, 'en', 'America/Los_Angeles', 'dark',
  NOW(), NOW()
),
(
  'user-agent-001'::uuid,
  true, false, false, 'en', 'America/Chicago', 'light',
  NOW(), NOW()
),
(
  'user-corporate-001'::uuid,
  true, true, true, 'en', 'America/New_York', 'dark',
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- Create a sample conversation between users
INSERT INTO public.conversations (
  id, initiator_id, recipient_id, title, status, created_at, updated_at
) VALUES (
  'conv-001'::uuid,
  'user-freelancer-001'::uuid,
  'user-agent-001'::uuid,
  'Project Collaboration Discussion',
  'active',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Add sample messages to conversation
INSERT INTO public.messages (
  id, conversation_id, sender_id, content, message_type, status, created_at, updated_at
) VALUES
(
  'msg-001'::uuid,
  'conv-001'::uuid,
  'user-freelancer-001'::uuid,
  'Hi Michael, I''m interested in discussing a potential project collaboration.',
  'text',
  'delivered',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
),
(
  'msg-002'::uuid,
  'conv-001'::uuid,
  'user-agent-001'::uuid,
  'Great! I''d love to hear more about your project. What kind of work are you looking for?',
  'text',
  'delivered',
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
),
(
  'msg-003'::uuid,
  'conv-001'::uuid,
  'user-freelancer-001'::uuid,
  'I need help with a web design project for a startup client.',
  'text',
  'delivered',
  NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
)
ON CONFLICT DO NOTHING;

-- Create a sample support ticket
INSERT INTO public.tickets (
  id, user_id, title, description, category, priority, status, created_at, updated_at
) VALUES (
  'ticket-001'::uuid,
  'user-business-001'::uuid,
  'Payment Processing Issue',
  'I''m having trouble with payment verification. Can someone help?',
  'payment',
  'high',
  'open',
  NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- Add ticket reply
INSERT INTO public.ticket_replies (
  id, ticket_id, user_id, message, is_admin_reply, created_at, updated_at
) VALUES (
  'reply-001'::uuid,
  'ticket-001'::uuid,
  'admin-user-001'::uuid,
  'Thank you for reporting this. We''ve escalated your case to our payment team.',
  true,
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
) ON CONFLICT DO NOTHING;

-- Create notifications for users
INSERT INTO public.notifications (
  id, user_id, title, message, type, status, created_at, updated_at
) VALUES
(
  'notif-001'::uuid,
  'user-freelancer-001'::uuid,
  'New Message',
  'You have a new message from Michael Rodriguez',
  'message',
  'unread',
  NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
),
(
  'notif-002'::uuid,
  'user-business-001'::uuid,
  'Ticket Response',
  'Our support team has responded to your ticket',
  'ticket',
  'unread',
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
),
(
  'notif-003'::uuid,
  'user-agent-001'::uuid,
  'Profile Verification',
  'Your KYC verification has been approved',
  'kyc',
  'read',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- Create sample payment records
INSERT INTO public.payments (
  id, user_id, amount, currency, payment_method, status, description, created_at, updated_at
) VALUES
(
  'pay-001'::uuid,
  'user-freelancer-001'::uuid,
  99.99, 'USD', 'credit_card', 'completed',
  'Premium subscription - 1 month',
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
  'pay-002'::uuid,
  'user-business-001'::uuid,
  299.99, 'USD', 'bank_transfer', 'pending',
  'Business plan - annual',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
),
(
  'pay-003'::uuid,
  'user-corporate-001'::uuid,
  1999.99, 'USD', 'credit_card', 'completed',
  'Enterprise plan - annual',
  NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;

-- Create sample agents
INSERT INTO public.agents (
  id, name, description, type, status, config, created_at, updated_at
) VALUES
(
  'agent-001'::uuid,
  'Support Agent',
  'Handles customer support and inquiries',
  'support',
  'active',
  '{"max_response_time": 300, "auto_escalate": true}'::jsonb,
  NOW(), NOW()
),
(
  'agent-002'::uuid,
  'Sales Agent',
  'Assists with sales inquiries and quotes',
  'sales',
  'active',
  '{"max_response_time": 600, "auto_escalate": false}'::jsonb,
  NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- Link agents to users
INSERT INTO public.user_requests (
  id, user_id, agent_id, request_type, status, created_at, updated_at
) VALUES
(
  'req-001'::uuid,
  'user-business-001'::uuid,
  'agent-001'::uuid,
  'support',
  'assigned',
  NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
),
(
  'req-002'::uuid,
  'user-freelancer-001'::uuid,
  'agent-002'::uuid,
  'sales',
  'completed',
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'
)
ON CONFLICT DO NOTHING;

-- Create sample agent messages
INSERT INTO public.agent_messages (
  id, agent_id, user_id, message, response, status, created_at, updated_at
) VALUES
(
  'agentmsg-001'::uuid,
  'agent-001'::uuid,
  'user-business-001'::uuid,
  'I need help with my account settings',
  'I''d be happy to help you with your account. Can you tell me more about what you need?',
  'responded',
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- Print summary
SELECT '✅ Seed Data Inserted Successfully!' as status;
SELECT 
  (SELECT COUNT(*) FROM public.user_profiles) as total_users,
  (SELECT COUNT(*) FROM public.kyc_submissions) as kyc_submissions,
  (SELECT COUNT(*) FROM public.conversations) as conversations,
  (SELECT COUNT(*) FROM public.messages) as messages,
  (SELECT COUNT(*) FROM public.tickets) as tickets,
  (SELECT COUNT(*) FROM public.payments) as payments,
  (SELECT COUNT(*) FROM public.agents) as agents;

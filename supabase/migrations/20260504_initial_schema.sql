-- Initialize ComeClsr database schema for Supabase
-- This migration creates all necessary tables with RLS policies

-- 1. Create user_profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  phone VARCHAR(50),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  age INT CHECK (age >= 18 AND age <= 120),
  location VARCHAR(255),
  profile_photo TEXT,
  interests TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'blocked', 'pending')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
  conversation_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversation_status IN ('pending', 'assigned', 'active', 'stopped')),
  assigned_agent_id BIGINT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  profile_photo TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  people_type TEXT,
  conversation_type TEXT,
  personality_prefs TEXT,
  expectations TEXT,
  id_document TEXT,
  selfie_photo TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method VARCHAR(100) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  proof_image TEXT,
  transaction_ref VARCHAR(255),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  agent_id BIGINT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'stopped', 'closed')),
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  welcome_message_sent BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'agent', 'admin')),
  type TEXT NOT NULL CHECK (type IN ('media', 'voice')),
  content TEXT,
  media_url TEXT,
  duration INT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'payment', 'agent', 'technical', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Create ticket_replies table
CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id SERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'payment', 'email', 'homepage', 'popup')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'kyc', 'agent', 'conversation', 'ticket', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Create user_requests table
CREATE TABLE IF NOT EXISTS public.user_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('agent_change', 'report_inactivity', 'other')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Create agent_messages table
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id SERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: user_profiles
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (public.is_admin());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can create their own profile (for signup)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles
  FOR UPDATE
  USING (public.is_admin());

-- Admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.user_profiles;
CREATE POLICY "Admins can delete users"
  ON public.user_profiles
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: conversations
-- ============================================================================

-- Users can view their own conversations
DROP POLICY IF EXISTS "Users view own conversations" ON public.conversations;
CREATE POLICY "Users view own conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()) OR
    public.is_admin()
  );

-- Users can create conversations (admin assigns agent)
DROP POLICY IF EXISTS "Users can be assigned conversations" ON public.conversations;
CREATE POLICY "Users can be assigned conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    public.is_admin()
  );

-- Admins can update conversations (approve/reject)
DROP POLICY IF EXISTS "Admins can manage conversations" ON public.conversations;
CREATE POLICY "Admins can manage conversations"
  ON public.conversations
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: messages
-- ============================================================================

-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users view messages in own conversations" ON public.messages;
CREATE POLICY "Users view messages in own conversations"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid() OR
      agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    ) OR
    public.is_admin()
  );

-- Users and agents can send messages
DROP POLICY IF EXISTS "Users and agents can send messages" ON public.messages;
CREATE POLICY "Users and agents can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      conversation_id IN (
        SELECT id FROM public.conversations
        WHERE user_id = auth.uid() OR
        agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
      )
    )
  );

-- Users can update read status
DROP POLICY IF EXISTS "Users can update message read status" ON public.messages;
CREATE POLICY "Users can update message read status"
  ON public.messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid() OR
      agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- RLS POLICIES: payments
-- ============================================================================

-- Users can view their own payments
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins view all payments" ON public.payments;
CREATE POLICY "Admins view all payments"
  ON public.payments
  FOR SELECT
  USING (public.is_admin());

-- Users can create payments
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can approve/reject payments
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
  ON public.payments
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: kyc_submissions
-- ============================================================================

-- Users can view their own KYC
DROP POLICY IF EXISTS "Users view own KYC" ON public.kyc_submissions;
CREATE POLICY "Users view own KYC"
  ON public.kyc_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all KYC
DROP POLICY IF EXISTS "Admins view all KYC" ON public.kyc_submissions;
CREATE POLICY "Admins view all KYC"
  ON public.kyc_submissions
  FOR SELECT
  USING (public.is_admin());

-- Users can create/update their KYC
DROP POLICY IF EXISTS "Users manage own KYC" ON public.kyc_submissions;
CREATE POLICY "Users manage own KYC"
  ON public.kyc_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own KYC" ON public.kyc_submissions;
CREATE POLICY "Users update own KYC"
  ON public.kyc_submissions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update KYC status
DROP POLICY IF EXISTS "Admins approve KYC" ON public.kyc_submissions;
CREATE POLICY "Admins approve KYC"
  ON public.kyc_submissions
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: tickets
-- ============================================================================

-- Users can view their own tickets
DROP POLICY IF EXISTS "Users view own tickets" ON public.tickets;
CREATE POLICY "Users view own tickets"
  ON public.tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all tickets
DROP POLICY IF EXISTS "Admins view all tickets" ON public.tickets;
CREATE POLICY "Admins view all tickets"
  ON public.tickets
  FOR SELECT
  USING (public.is_admin());

-- Users can create tickets
DROP POLICY IF EXISTS "Users create tickets" ON public.tickets;
CREATE POLICY "Users create tickets"
  ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
DROP POLICY IF EXISTS "Users update own tickets" ON public.tickets;
CREATE POLICY "Users update own tickets"
  ON public.tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all tickets
DROP POLICY IF EXISTS "Admins manage tickets" ON public.tickets;
CREATE POLICY "Admins manage tickets"
  ON public.tickets
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: ticket_replies
-- ============================================================================

-- Users can view replies in their tickets
DROP POLICY IF EXISTS "Users view replies in own tickets" ON public.ticket_replies;
CREATE POLICY "Users view replies in own tickets"
  ON public.ticket_replies
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets WHERE user_id = auth.uid()
    ) OR
    public.is_admin()
  );

-- Users and admins can reply to tickets
DROP POLICY IF EXISTS "Users and admins can reply" ON public.ticket_replies;
CREATE POLICY "Users and admins can reply"
  ON public.ticket_replies
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- RLS POLICIES: notifications
-- ============================================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their notification read status
DROP POLICY IF EXISTS "Users update notification read status" ON public.notifications;
CREATE POLICY "Users update notification read status"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: settings
-- ============================================================================

-- All authenticated users can view settings
DROP POLICY IF EXISTS "Authenticated users view settings" ON public.settings;
CREATE POLICY "Authenticated users view settings"
  ON public.settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins update settings" ON public.settings;
CREATE POLICY "Admins update settings"
  ON public.settings
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- RLS POLICIES: agents (admin-only create)
-- ============================================================================

-- Users can view agents assigned to them
DROP POLICY IF EXISTS "Users view assigned agent" ON public.agents;
CREATE POLICY "Users view assigned agent"
  ON public.agents
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT id FROM public.agents
      WHERE assigned_user_id IN (
        SELECT id FROM public.user_profiles WHERE id = auth.uid()
      )
    ) OR
    public.is_admin()
  );

-- Only admins can create agents
DROP POLICY IF EXISTS "Admins create agents" ON public.agents;
CREATE POLICY "Admins create agents"
  ON public.agents
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can manage agents
DROP POLICY IF EXISTS "Admins update agents" ON public.agents;
CREATE POLICY "Admins update agents"
  ON public.agents
  FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON public.kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

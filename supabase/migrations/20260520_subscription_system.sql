-- 20260520_subscription_system.sql
-- Subscription system tables for payment flow

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 30,
  name TEXT DEFAULT 'Monthly Access',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'cancelled')),
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'paypal', 'crypto', 'coinhub', 'apple_pay', 'cashapp', 'venmo', 'credit_card', 'other')),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  admin_notes TEXT,
  requested_at TIMESTAMP DEFAULT now(),
  confirmed_at TIMESTAMP,
  confirmed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_agent_assignments_user_id ON agent_assignments(user_id);
CREATE INDEX idx_agent_assignments_agent_id ON agent_assignments(agent_id);

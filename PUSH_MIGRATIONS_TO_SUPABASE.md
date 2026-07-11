# How to Deploy Missing Migrations to Supabase

The RPC functions for the credit system haven't been deployed to Supabase yet. Follow these steps to fix the 404 errors:

## Step 1: Go to Supabase Dashboard

1. Open https://supabase.com
2. Log into your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**

## Step 2: Run These Migration Scripts in Order

### Migration 1: Credit System Tables (20260604_credit_system.sql)

Copy and run this SQL in the SQL Editor:

```sql
-- Create credit_packages table
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_amount INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL DEFAULT 0,
  total_purchased DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_cost_rate DECIMAL DEFAULT 5.00,
  minimum_deposit_amount DECIMAL DEFAULT 29.99,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create agent_profiles table
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  profile_photo TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(agent_id)
);

-- Seed credit packages
INSERT INTO public.credit_packages (credit_amount, price, name, description, is_active)
VALUES 
  (10, 29.99, 'Starter', '10 credits - roughly 2 messages', TRUE),
  (50, 99.99, 'Popular', '50 credits - roughly 10 messages', TRUE),
  (200, 399.99, 'Pro', '200 credits - roughly 40 messages', TRUE)
ON CONFLICT DO NOTHING;

-- Seed admin settings
INSERT INTO public.admin_settings (message_cost_rate, minimum_deposit_amount)
SELECT 5.00, 29.99
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

-- Enable RLS
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "credit_packages_public_read" ON public.credit_packages FOR SELECT USING (true);
CREATE POLICY "user_credits_user_read" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_credits_admin_all" ON public.user_credits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "user_credits_service_role" ON public.user_credits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "credit_transactions_user_read" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_transactions_admin_all" ON public.credit_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "credit_transactions_service_role" ON public.credit_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "admin_settings_public_read" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "admin_settings_admin_update" ON public.admin_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "agent_profiles_public_read" ON public.agent_profiles FOR SELECT USING (true);
CREATE POLICY "agent_profiles_admin_all" ON public.agent_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### Migration 2: RPC Functions (20260604_credit_rpcs.sql)

Copy and run this SQL:

```sql
-- RPC: credit_packages_get_all
CREATE OR REPLACE FUNCTION public.credit_packages_get_all()
RETURNS TABLE (
  id UUID,
  credit_amount INTEGER,
  price NUMERIC,
  name TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.credit_amount,
    cp.price,
    cp.name,
    cp.description,
    cp.is_active,
    cp.created_at
  FROM public.credit_packages cp
  WHERE cp.is_active = TRUE
  ORDER BY cp.price ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: admin_settings_get
CREATE OR REPLACE FUNCTION public.admin_settings_get()
RETURNS TABLE (
  id UUID,
  message_cost_rate DECIMAL,
  minimum_deposit_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.message_cost_rate,
    s.minimum_deposit_amount
  FROM public.admin_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: user_credits_get_balance
CREATE OR REPLACE FUNCTION public.user_credits_get_balance()
RETURNS jsonb AS $$
DECLARE
  v_balance DECIMAL;
  v_formatted TEXT;
BEGIN
  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = auth.uid();
  v_balance := COALESCE(v_balance, 0);
  v_formatted := FLOOR(v_balance)::TEXT || ' credits';
  
  RETURN jsonb_build_object(
    'balance', v_balance,
    'formatted', v_formatted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: payment_approve_deposit
CREATE OR REPLACE FUNCTION public.payment_approve_deposit(p_request_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
  v_credits_to_grant DECIMAL;
  v_payment_status TEXT;
BEGIN
  -- Get payment request details
  SELECT user_id, credits_to_grant, status INTO v_user_id, v_credits_to_grant, v_payment_status
  FROM public.payment_requests
  WHERE id = p_request_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Payment request not found';
  END IF;

  IF v_payment_status != 'pending' THEN
    RAISE EXCEPTION 'Only pending payments can be approved';
  END IF;

  -- Update payment status
  UPDATE public.payment_requests SET status = 'confirmed', updated_at = now() WHERE id = p_request_id;

  -- Ensure user_credits record exists
  INSERT INTO public.user_credits (user_id, balance) VALUES (v_user_id, 0) ON CONFLICT (user_id) DO NOTHING;

  -- Add credits
  UPDATE public.user_credits SET balance = balance + v_credits_to_grant, updated_at = now() WHERE user_id = v_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, reason)
  VALUES (v_user_id, 'deposit', v_credits_to_grant, 'Deposit approved');

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deposit approved and credits granted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: credit_transactions_get_user
CREATE OR REPLACE FUNCTION public.credit_transactions_get_user()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  amount DECIMAL,
  reason TEXT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.user_id,
    ct.type,
    ct.amount,
    ct.reason,
    ct.created_at
  FROM public.credit_transactions ct
  WHERE ct.user_id = auth.uid()
  ORDER BY ct.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migration 3: Admin Settings Update Function

Copy and run this SQL:

```sql
-- RPC: admin_settings_update
CREATE OR REPLACE FUNCTION public.admin_settings_update(
  p_message_cost_rate DECIMAL DEFAULT NULL,
  p_minimum_deposit_amount DECIMAL DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update settings';
  END IF;

  -- Update settings
  UPDATE public.admin_settings
  SET 
    message_cost_rate = COALESCE(p_message_cost_rate, message_cost_rate),
    minimum_deposit_amount = COALESCE(p_minimum_deposit_amount, minimum_deposit_amount),
    updated_at = now()
  WHERE id = (SELECT id FROM public.admin_settings ORDER BY created_at DESC LIMIT 1)
  RETURNING jsonb_build_object(
    'id', id,
    'message_cost_rate', message_cost_rate,
    'minimum_deposit_amount', minimum_deposit_amount,
    'updated_at', updated_at
  ) INTO v_result;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'Failed to update settings'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 3: Also Add "settings" and "agentProfiles" to rpc.ts

In `src/lib/rpc.ts`, add these objects under the payment section:

```typescript
  // Settings functions
  settings: {
    getAdminSettings: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_settings_get');
      if (error) throw error;
      return data;
    },

    updateAdminSettings: async (messageCostRate?: number, minimumDepositAmount?: number): Promise<any> => {
      const { data, error } = await supabase.rpc('admin_settings_update', {
        p_message_cost_rate: messageCostRate,
        p_minimum_deposit_amount: minimumDepositAmount,
      });
      if (error) throw error;
      return data;
    },
  },

  // Agent profiles functions
  agentProfiles: {
    getAll: async (): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_profiles_get_all');
      if (error) throw error;
      return data;
    },

    updateProfile: async (agentId: string, displayName?: string, profilePhoto?: string): Promise<any> => {
      const { data, error } = await supabase.rpc('agent_profiles_update', {
        p_agent_id: agentId,
        p_display_name: displayName,
        p_profile_photo: profilePhoto,
      });
      if (error) throw error;
      return data;
    },
  },
```

## After Deployment

- Refresh the browser (`Ctrl+R` or `Cmd+R`)
- Log out and log back in
- Dashboard should now load quickly without the 404 errors
- The loading time should be reduced from ~30+ seconds to ~2-3 seconds

## Profile Photo Issue

The profile photo not displaying on the dashboard is likely because:
1. The photo URL isn't being saved correctly to the database
2. The AvatarRing component isn't using the profile_photo field

After the migrations are deployed, we'll fix this next.

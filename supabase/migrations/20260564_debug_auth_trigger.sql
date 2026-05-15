-- 20260564_debug_auth_trigger.sql
-- DEBUG: Add logging to understand if auth trigger is working

-- Create a debug log table to track auth trigger invocations
CREATE TABLE IF NOT EXISTS public.auth_trigger_debug_log (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  email TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grant access
GRANT INSERT, SELECT ON public.auth_trigger_debug_log TO authenticated, anon;

-- Update the trigger function to add logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger invocation
  INSERT INTO public.auth_trigger_debug_log (event_type, user_id, email, message)
  VALUES ('auth_trigger_fired', NEW.id, NEW.email, 'Trigger invoked');
  
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    username,
    role,
    status,
    payment_status,
    kyc_status,
    conversation_status,
    created_at,
    updated_at,
    last_sign_in_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    'user',
    'pending',
    'pending',
    'pending',
    'pending',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Log successful insertion
  INSERT INTO public.auth_trigger_debug_log (event_type, user_id, email, message)
  VALUES ('profile_created', NEW.id, NEW.email, 'User profile inserted successfully');
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO public.auth_trigger_debug_log (event_type, user_id, email, message)
  VALUES ('error', NEW.id, NEW.email, 'Error: ' || SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

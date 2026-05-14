import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAgentAuthRequest {
  user_id: string
  email: string
  password: string
}

interface CreateAgentAuthResponse {
  success: boolean
  user_id?: string
  error?: string
  message: string
}

// Create Supabase admin client
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body
    const body: CreateAgentAuthRequest = await req.json()
    
    // Validate required fields
    if (!body.user_id || !body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: user_id, email, password',
          message: 'Invalid request'
        } as CreateAgentAuthResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const dummyProfileId = body.user_id;

    // 1. Fetch the dummy profile created by the RPC
    const { data: dummyProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', dummyProfileId)
      .single();

    if (fetchError) {
      console.warn('Could not fetch dummy profile:', fetchError);
    }

    // 2. Delete the dummy profile BEFORE creating the auth user
    // This is CRITICAL because the auth.users insert triggers a function
    // that creates a user_profiles row. If the dummy profile still exists,
    // the trigger will fail due to unique constraints on email/username!
    if (dummyProfile) {
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', dummyProfileId);
    }

    // 3. Create auth user (trigger will fire and create new profile)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm to allow immediate login
      user_metadata: {
        role: 'agent',
      },
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({
          success: false,
          error: authError.message,
          message: `Failed to create auth user: ${authError.message}`
        } as CreateAgentAuthResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!authUser?.user?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No user ID returned from auth creation',
          message: 'Auth user creation failed'
        } as CreateAgentAuthResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // After auth user is created, the 'on_auth_user_created' trigger will
    // automatically create a user_profiles row with role = 'user' and the new ID.
    const newAuthId = authUser.user.id;

    // 4. Update the newly auto-created profile with agent data
    const profileDataToUpdate = dummyProfile ? {
      username: dummyProfile.username,
      full_name: dummyProfile.full_name,
      role: 'agent',
      status: 'active',
      payment_status: 'approved',
      kyc_status: 'approved',
      conversation_status: 'approved'
    } : {
      role: 'agent',
      status: 'active',
      payment_status: 'approved',
      kyc_status: 'approved',
      conversation_status: 'approved'
    };

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(profileDataToUpdate)
      .eq('id', newAuthId);

    if (updateError) {
      console.error('Failed to update new profile:', updateError);
    }

    if (dummyProfile) {
      // 5. Re-create the pending credentials if necessary (optional, but good for admin view)
      await supabase
        .from('agent_credentials_pending')
        .insert({
          agent_email: body.email,
          agent_username: dummyProfile.username,
          generated_password: body.password,
          profile_id: newAuthId,
          auth_user_created_at: new Date().toISOString(),
          auth_verified: true
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newAuthId,
        message: `Auth user created successfully for agent ${body.email}`
      } as CreateAgentAuthResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Unexpected error creating auth user'
      } as CreateAgentAuthResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})


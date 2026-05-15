import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

// Create Supabase admin client
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

interface AgentCredential {
  email: string
  password: string
  username: string
  success: boolean
  user_id?: string
  error?: string
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin access via auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unauthorized: Missing or invalid authorization header'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const credentials: AgentCredential[] = []

    // Create 15 agent auth users
    for (let i = 1; i <= 15; i++) {
      const num = String(i).padStart(3, '0')
      const email = `agent_${num}@comeclsr.com`
      const password = `Agent${num}!@#`
      const username = `agent_${num.substring(1)}` // agent_001 -> agent_01

      try {
        console.log(`[${i}/15] Creating auth user: ${email}`)
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            role: 'agent',
            username: username,
          },
        })

        if (authError) {
          console.error(`[${i}/15] Auth user creation failed for ${email}:`, authError)
          credentials.push({
            email,
            password,
            username,
            success: false,
            error: authError.message,
          })
        } else {
          const userId = authUser?.user?.id
          console.log(`[${i}/15] Auth user created successfully: ${userId}`)

          // Step 0: Verify user_profiles exists (auth trigger creates it)
          // Add retry logic to handle race condition
          let userProfileExists = false
          let lastProfileError = ''
          for (let retry = 0; retry < 5; retry++) {
            console.log(`[${i}/15] Checking user_profiles (attempt ${retry + 1}/5)`)
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', userId)
              .single()
            
            if (profileError) {
              lastProfileError = profileError.message
            }
            
            if (profile) {
              console.log(`[${i}/15] User profile found on attempt ${retry + 1}`)
              userProfileExists = true
              break
            }
            
            if (retry < 4) {
              console.log(`[${i}/15] Waiting 100ms before retry...`)
              await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms
            }
          }

          if (!userProfileExists) {
            console.error(`[${i}/15] User profile not found after 5 retries for ${email}. Last error: ${lastProfileError}`)
            credentials.push({
              email,
              password,
              username,
              success: false,
              user_id: userId,
              error: `User profile row not found after auth creation (checked 5 times). Trigger may not have fired.`,
            })
            continue
          }

          // Step 1: Update using ID (more reliable than email)
          console.log(`[${i}/15] Updating user_profiles to set role=agent for ${userId}`)
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ role: 'agent', status: 'active' })
            .eq('id', userId)

          if (updateError) {
            console.error(`[${i}/15] Failed to update role for ${email}:`, updateError)
            credentials.push({
              email,
              password,
              username,
              success: false,
              user_id: userId,
              error: `Failed to update user_profiles: ${updateError.message}`,
            })
            continue
          }
          console.log(`[${i}/15] User profile updated successfully`)

          // Step 2: Now safely create agents record using direct insert
          console.log(`[${i}/15] Attempting direct agents table insert for ${username}`)
          const { data: agentData, error: agentInsertError } = await supabase
            .from('agents')
            .insert([{
              user_id: userId,
              username: username,
              display_name: `Agent ${num}`,
              status: 'active',
            }])
            .select()

          if (agentInsertError) {
            console.error(`[${i}/15] Direct insert failed for ${email}:`, agentInsertError)
            credentials.push({
              email,
              password,
              username,
              success: false,
              user_id: userId,
              error: `Direct agent insert failed: ${agentInsertError.message}${agentInsertError.details ? ` (${agentInsertError.details})` : ''}`,
            })
          } else if (!agentData || agentData.length === 0) {
            console.error(`[${i}/15] Direct insert returned no data for ${email}`)
            credentials.push({
              email,
              password,
              username,
              success: false,
              user_id: userId,
              error: `Agent record created but returned no data`,
            })
          } else {
            console.log(`[${i}/15] ✓ Agent created successfully via direct insert`)
            credentials.push({
              email,
              password,
              username,
              success: true,
              user_id: userId,
            })
          }
        }
      } catch (error) {
        console.error(`[${i}/15] Unexpected error for ${email}:`, error)
        credentials.push({
          email,
          password,
          username,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const successCount = credentials.filter(c => c.success).length
    const failedCount = credentials.filter(c => !c.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeded ${successCount} agents (${failedCount} failed)`,
        credentials: credentials,
        summary: {
          total: 15,
          successful: successCount,
          failed: failedCount,
        }
      }),
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
        message: 'Unexpected error seeding agent auth users',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

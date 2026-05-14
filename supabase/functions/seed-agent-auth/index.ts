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
          credentials.push({
            email,
            password,
            username,
            success: false,
            error: authError.message,
          })
        } else {
          credentials.push({
            email,
            password,
            username,
            success: true,
            user_id: authUser?.user?.id,
          })
        }
      } catch (error) {
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

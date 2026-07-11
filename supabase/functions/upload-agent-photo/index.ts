import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Check if user is admin or agent
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isAgent = profile?.role === "agent";

    if (!isAdmin && !isAgent) {
      return new Response(JSON.stringify({ error: "Admin or Agent role required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Parse request body (FormData with agentId, file)
    const formData = await req.formData();
    const agentId = formData.get("agentId") as string;
    const file = formData.get("file") as File;

    if (!agentId || !file) {
      return new Response(JSON.stringify({ error: "Missing agentId or file" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Agents can only upload their own photo
    if (isAgent && agentId !== user.id) {
      return new Response(JSON.stringify({ error: "Agents can only update their own photo" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Verify target is an agent profile
    const { data: agent } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", agentId)
      .eq("role", "agent")
      .single();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Use service role to upload (bypasses storage policies)
    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${agentId}/profile-photo.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data, error } = await adminSupabase.storage
      .from("profile-photos")
      .upload(filePath, new Uint8Array(fileBuffer), {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get public URL
    const { data: urlData } = adminSupabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const photoUrl = urlData.publicUrl;

    // Update agent profile with new photo URL
    const { error: updateError } = await adminSupabase
      .from("user_profiles")
      .update({ profile_photo: photoUrl })
      .eq("id", agentId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        photoUrl,
        filePath,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

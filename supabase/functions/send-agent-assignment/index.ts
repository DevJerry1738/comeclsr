import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "ComeClsr <team@support.comeclsr.com>"; // Verified sender on support.comeclsr.com domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

interface AgentAssignmentBody {
  agentEmail: string;
  agentName: string;
  userName: string;
  userEmail: string;
  assignmentDate: string;
  agentDashboardUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in Supabase secrets");
    }

    const body = (await req.json()) as AgentAssignmentBody;
    console.log("Agent assignment email requested:", {
      agentEmail: body.agentEmail,
      agentName: body.agentName,
      userName: body.userName,
    });

    const {
      agentEmail,
      agentName,
      userName,
      userEmail,
      assignmentDate,
      agentDashboardUrl,
    } = body;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎯 New User Assignment</h2>
        <p>Hi ${agentName},</p>
        <p>You have been assigned a new user to assist:</p>
        
        <h3 style="color: #333;">User Information:</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${userName}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Assignment Date:</strong> ${assignmentDate}</li>
          </ul>
        </div>

        <p>Log in to your agent dashboard to view conversations and respond to messages:</p>
        <p><a href="${agentDashboardUrl}" style="background-color: #EC4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Open Agent Dashboard</a></p>

        <p>Please reach out to support if you have any questions.</p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: agentEmail,
        subject: `🎯 New User Assignment: ${userName}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email via Resend");
    }

    console.log("Assignment email sent successfully:", data.id);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending agent assignment email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "support@comeclsr.com";

interface AgentAssignmentBody {
  agentEmail: string;
  agentName: string;
  userName: string;
  userEmail: string;
  assignmentDate: string;
  agentDashboardUrl: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const {
      agentEmail,
      agentName,
      userName,
      userEmail,
      assignmentDate,
      agentDashboardUrl,
    } = (await req.json()) as AgentAssignmentBody;

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
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

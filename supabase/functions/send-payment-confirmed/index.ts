import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "ComeClsr <team@support.comeclsr.com>"; // Verified sender on support.comeclsr.com domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

interface PaymentConfirmedBody {
  userEmail: string;
  userName: string;
  amount: number;
  agentName: string;
  agentEmail: string;
  expiryDate: string;
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

    const body = (await req.json()) as PaymentConfirmedBody;
    console.log("Payment confirmed email requested:", {
      userEmail: body.userEmail,
      userName: body.userName,
      agentName: body.agentName,
    });

    const {
      userEmail,
      userName,
      amount,
      agentName,
      agentEmail,
      expiryDate,
    } = body;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Subscription Confirmed!</h2>
        <p>Hi ${userName},</p>
        <p>Your payment of <strong>$${amount.toFixed(
          2
        )}</strong> has been confirmed!</p>
        
        <h3 style="color: #333;">Your Subscription Details:</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          <ul style="list-style: none; padding: 0;">
            <li><strong>Amount Paid:</strong> $${amount.toFixed(2)}</li>
            <li><strong>Subscription Valid Until:</strong> ${expiryDate}</li>
            <li><strong>Your Assigned Agent:</strong> ${agentName}</li>
            <li><strong>Agent Contact:</strong> ${agentEmail}</li>
          </ul>
        </div>

        <p>You can now access the platform and start chatting with your assigned agent.</p>
        <p>Thank you for subscribing!</p>
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
        to: userEmail,
        subject: "✅ Your Subscription is Confirmed!",
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email via Resend");
    }

    console.log("Confirmation email sent successfully:", data.id);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending payment confirmed email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

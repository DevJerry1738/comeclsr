import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "ComeClsr <team@support.comeclsr.com>"; // Verified sender on support.comeclsr.com domain

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

interface PaymentRequestBody {
  adminEmail?: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  requestId: string;
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

    const body = (await req.json()) as PaymentRequestBody;
    console.log("Payment request received:", {
      userName: body.userName,
      userEmail: body.userEmail,
      amount: body.amount,
      requestId: body.requestId,
    });

    const {
      userName,
      userEmail,
      amount,
      paymentMethod,
      requestId,
    } = body;

    // Always send to admin@comeclsr.com regardless of input
    const adminEmail = "admin@comeclsr.com";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">💳 New Payment Request</h2>
        <p>A user has initiated a subscription payment:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          <ul style="list-style: none; padding: 0;">
            <li><strong>User:</strong> ${userName} (${userEmail})</li>
            <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
            <li><strong>Payment Method:</strong> ${paymentMethod}</li>
            <li><strong>Request ID:</strong> ${requestId}</li>
          </ul>
        </div>
        <p>Please review and confirm this payment in the Admin Dashboard.</p>
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
        to: adminEmail,
        subject: `💳 New Payment Request - $${amount.toFixed(2)}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email via Resend");
    }

    console.log("Email sent successfully:", data.id);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending payment request email:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

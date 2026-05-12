import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "support@comeclsr.com";

interface PaymentConfirmedBody {
  userEmail: string;
  userName: string;
  amount: number;
  agentName: string;
  agentEmail: string;
  expiryDate: string;
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
      userEmail,
      userName,
      amount,
      agentName,
      agentEmail,
      expiryDate,
    } = (await req.json()) as PaymentConfirmedBody;

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WelcomeRequest {
  email?: string;
  full_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, full_name }: WelcomeRequest = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstName = (full_name || '').split(' ')[0] || 'there';
    const appUrl = 'https://bhchurchmgt.bolt.host';
    const senderEmail = 'Believers House Library <onboarding@resend.dev>';

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0a0a0b;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.25); background: linear-gradient(135deg, #1a1a1d, #0f0f11);">
            <span style="font-size: 22px; font-weight: 700; color: #d4af37; letter-spacing: 0.5px;">Believers House Halifax Library</span>
          </div>
        </div>

        <div style="background: #111114; border: 1px solid #2a2a2e; border-radius: 20px; padding: 32px;">
          <h1 style="color: #f4f4f5; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">
            Welcome, ${firstName}!
          </h1>

          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            Your account is ready, so you can now browse our shared library and request available books.
          </p>

          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
            To get started, sign in at the link below and explore the Library tab. When you find a book you'd like to borrow, open it and tap "Request to borrow." Our library team will be in touch once it's ready for pickup.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${appUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(to right, #d4af37, #c49b2e); color: #0a0a0b; font-size: 15px; font-weight: 700; text-decoration: none;">
              Sign In to Browse
            </a>
          </div>

        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #52525b; font-size: 13px; line-height: 1.5; margin: 0;">
            Blessings,<br/>
            <strong style="color: #d4af37;">The Library Team</strong><br/>
            Believers House Halifax
          </p>
        </div>
      </div>
    `;

    const textBody = `Welcome to the Believers House Halifax Library, ${firstName}!

Your account is ready, so you can now browse our shared library and request available books.

To get started, sign in at ${appUrl} and explore the Library tab. When you find a book you'd like to borrow, open it and tap "Request to borrow." Our library team will be in touch once it's ready for pickup.

Blessings,
The Library Team
Believers House Halifax`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: email,
        reply_to: 'believershouseh@gmail.com',
        subject: 'Welcome to the Believers House Halifax Library',
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error:', res.status, errText);
      return new Response(
        JSON.stringify({ error: 'Could not send welcome email', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Welcome email function error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

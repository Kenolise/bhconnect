import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;
const APP_URL = 'https://bhchurchmgt.bolt.host';
const SENDER = 'Believers House Library <onboarding@resend.dev>';
const REPLY_TO = 'believershouseh@gmail.com';

interface LoanEmailRow {
  id: string;
  kind: 'ready_for_pickup' | 'reminder_14_days' | 'reminder_7_days';
  recipient_email: string;
  recipient_name: string;
  book_title: string;
  due_at: string | null;
  pickup_deadline: string | null;
  attempts: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string | null): string {
  if (!iso) return 'soon';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildEmail(row: LoanEmailRow): { subject: string; html: string; text: string } {
  const firstName = (row.recipient_name || '').split(' ')[0] || 'there';
  const title = row.book_title;

  let subject: string;
  let lead: string;
  let detail: string;
  let cta: string;

  if (row.kind === 'ready_for_pickup') {
    subject = `Your book is ready for pickup: ${title}`;
    lead = `Good news, ${firstName}! "${title}" is ready for you to collect.`;
    detail = `Please collect it by ${formatDate(row.pickup_deadline)}. Your 21-day loan starts when you pick it up.`;
    cta = 'View My Books';
  } else if (row.kind === 'reminder_14_days') {
    subject = `You have 14 days left to return "${title}"`;
    lead = `Hi ${firstName}, this is a friendly reminder that you have 14 days left to return "${title}".`;
    detail = `It is due back on ${formatDate(row.due_at)}.`;
    cta = 'View My Books';
  } else {
    subject = `You have 7 days left to return "${title}"`;
    lead = `Hi ${firstName}, just a reminder that you have 7 days left to return "${title}".`;
    detail = `It is due back on ${formatDate(row.due_at)}. Thank you for looking after it.`;
    cta = 'View My Books';
  }

  const safeLead = escapeHtml(lead);
  const safeDetail = escapeHtml(detail);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #0a0a0b;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.25); background: linear-gradient(135deg, #1a1a1d, #0f0f11);">
          <span style="font-size: 22px; font-weight: 700; color: #d4af37; letter-spacing: 0.5px;">Believers House Halifax Library</span>
        </div>
      </div>
      <div style="background: #111114; border: 1px solid #2a2a2e; border-radius: 20px; padding: 32px;">
        <p style="color: #f4f4f5; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">${safeLead}</p>
        <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${safeDetail}</p>
        <div style="text-align: center; margin: 28px 0 8px 0;">
          <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; border-radius: 12px; background: linear-gradient(to right, #d4af37, #c49b2e); color: #0a0a0b; font-size: 15px; font-weight: 700; text-decoration: none;">
            ${cta}
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

  const text = `${lead}

${detail}

${cta}: ${APP_URL}

Blessings,
The Library Team
Believers House Halifax`;

  return { subject, html, text };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data, error } = await admin
      .from('loan_emails')
      .select('id, kind, recipient_email, recipient_name, book_title, due_at, pickup_deadline, attempts')
      .is('sent_at', null)
      .lt('attempts', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw new Error(`Could not read email queue: ${error.message}`);

    let sent = 0;
    let failed = 0;

    for (const row of (data ?? []) as LoanEmailRow[]) {
      const { data: claimed, error: claimError } = await admin
        .from('loan_emails')
        .update({ attempts: row.attempts + 1 })
        .eq('id', row.id)
        .eq('attempts', row.attempts)
        .is('sent_at', null)
        .select('id');

      if (claimError || !claimed || claimed.length === 0) continue;

      const email = buildEmail(row);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: SENDER,
          to: row.recipient_email,
          reply_to: REPLY_TO,
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });

      if (res.ok) {
        await admin
          .from('loan_emails')
          .update({ sent_at: new Date().toISOString(), last_error: null })
          .eq('id', row.id);
        sent += 1;
      } else {
        const errText = await res.text();
        console.error('Resend API error:', res.status, errText);
        await admin
          .from('loan_emails')
          .update({ last_error: `Email provider responded with ${res.status}` })
          .eq('id', row.id);
        failed += 1;
      }
    }

    return new Response(JSON.stringify({ sent, failed }), { headers: jsonHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Loan email function error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: jsonHeaders });
  }
});

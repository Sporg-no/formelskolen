import { NextResponse } from 'next/server';

// Viser hvilke deler av oppsettet som er på plass (ingen verdier).
export async function GET() {
  const has = (k: string) => !!process.env[k];
  return NextResponse.json({
    supabase: has('NEXT_PUBLIC_SUPABASE_URL') && (has('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || has('NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    supabaseSecret: has('SUPABASE_SECRET_KEY') || has('SUPABASE_SERVICE_ROLE_KEY'),
    stripe: has('STRIPE_SECRET_KEY'),
    stripeWebhook: has('STRIPE_WEBHOOK_SECRET'),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });
}

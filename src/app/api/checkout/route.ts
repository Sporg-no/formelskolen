import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe, priceFor, PLANS, type Plan } from '@/lib/stripe';
import { getSession } from '@/lib/access';
import { siteUrl, stripeConfigured } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) return NextResponse.json({ error: 'Betaling er ikke satt opp ennå.' }, { status: 503 });
  let body: { plan?: string; consent?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 }); }
  const plan: Plan = body.plan === 'maaned' || body.plan === 'livstid' ? body.plan : 'aar';
  if (body.consent !== true) return NextResponse.json({ error: 'Du må samtykke for å fortsette.' }, { status: 400 });

  const { user, sub, active } = await getSession();
  if (!user?.email) return NextResponse.json({ error: 'Logg inn først.', login: true }, { status: 401 });
  if (active && sub?.status === 'lifetime') return NextResponse.json({ error: 'Du har allerede livstidstilgang.' }, { status: 409 });
  if (active && plan !== 'livstid' && sub) return NextResponse.json({ error: 'Du har allerede et aktivt abonnement. Endre det under Min side.' }, { status: 409 });

  const now = new Date().toISOString();
  const site = siteUrl();
  const p = PLANS[plan];
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: p.recurring ? 'subscription' : 'payment',
    line_items: [{ price: await priceFor(plan), quantity: 1 }],
    locale: 'nb',
    allow_promotion_codes: true,
    client_reference_id: user.id,
    metadata: { plan, consent: 'umiddelbar-levering-v1', consent_at: now, user_id: user.id },
    custom_text: { submit: { message: 'Du får tilgang med en gang. Du har samtykket til at angreretten faller bort ved umiddelbar levering av digitalt innhold.' } },
    success_url: `${site}/min-side?kjop=ok`,
    cancel_url: `${site}/priser?avbrutt=1`,
  };
  if (p.recurring) {
    params.subscription_data = { metadata: { user_id: user.id, consent_at: now } };
    // Testbrukere med 100 % rabattkode skal slippe å legge inn kort
    params.payment_method_collection = 'if_required';
  }
  else params.payment_intent_data = { metadata: { user_id: user.id, plan } };
  // Nye Stripe-kontoer har «Managed Payments» på, som ikke tillater egen samtykketekst.
  (params as Record<string, unknown>).managed_payments = { enabled: false };
  if (sub?.stripe_customer_id) params.customer = sub.stripe_customer_id;
  else {
    params.customer_email = user.email;
    if (!p.recurring) params.customer_creation = 'always';
  }
  try {
    const session = await stripe().checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[checkout]', e);
    return NextResponse.json({ error: `Kunne ikke starte betalingen: ${(e as Error).message}` }, { status: 500 });
  }
}

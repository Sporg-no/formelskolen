import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveSubscription, saveLifetime } from '@/lib/subs';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function userFor(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const cust = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const { data } = await supabaseAdmin().from('fs_subscriptions').select('user_id')
    .or(`stripe_subscription_id.eq.${sub.id},stripe_customer_id.eq.${cust}`).limit(1).maybeSingle();
  return (data?.user_id as string) ?? null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get('stripe-signature') ?? '', env('STRIPE_WEBHOOK_SECRET'));
  } catch (e) {
    console.error('[webhook] signatur', (e as Error).message);
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id || s.metadata?.user_id;
        if (!userId) break;
        const customer = typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null;
        if (s.mode === 'payment' && s.payment_status === 'paid') {
          const { data: prev } = await supabaseAdmin().from('fs_subscriptions').select('stripe_subscription_id, status').eq('user_id', userId).maybeSingle();
          await saveLifetime(userId, customer, s.metadata?.consent_at);
          // Livstid kjøpt mens et abonnement løper: avslutt abonnementet så kunden ikke betaler dobbelt
          if (prev?.stripe_subscription_id && prev.status !== 'canceled') {
            await stripe().subscriptions.cancel(prev.stripe_subscription_id).catch(e => console.error('[webhook] avslutt', e));
          }
        } else if (s.mode === 'subscription' && s.subscription) {
          const sub = await stripe().subscriptions.retrieve(typeof s.subscription === 'string' ? s.subscription : s.subscription.id);
          await saveSubscription(userId, sub, s.metadata?.consent_at);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userFor(sub);
        if (!userId) break;
        await saveSubscription(userId, await stripe().subscriptions.retrieve(sub.id));
        break;
      }
    }
  } catch (e) {
    console.error('[webhook]', event.type, e);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

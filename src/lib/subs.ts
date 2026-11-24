import 'server-only';
import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

export async function saveSubscription(userId: string, sub: Stripe.Subscription, consentAt?: string) {
  const { data: existing } = await supabaseAdmin().from('fs_subscriptions').select('status').eq('user_id', userId).maybeSingle();
  // Livstidstilgang skal aldri overskrives av et gammelt abonnement
  if (existing?.status === 'lifetime') return;
  const item = sub.items?.data?.[0];
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end
    ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const row: Record<string, unknown> = {
    user_id: userId,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: item?.price?.id ?? null,
    interval: item?.price?.recurring?.interval ?? null,
    current_period_end: iso(periodEnd),
    cancel_at_period_end: !!sub.cancel_at_period_end || !!sub.cancel_at,
    updated_at: new Date().toISOString(),
  };
  if (consentAt) row.consent_at = consentAt;
  const { error } = await supabaseAdmin().from('fs_subscriptions').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function saveLifetime(userId: string, customer: string | null, consentAt?: string) {
  const { error } = await supabaseAdmin().from('fs_subscriptions').upsert({
    user_id: userId, stripe_customer_id: customer, status: 'lifetime', interval: 'lifetime',
    cancel_at_period_end: false, current_period_end: null, consent_at: consentAt ?? null, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

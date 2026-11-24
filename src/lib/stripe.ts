import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';

let _s: Stripe | null = null;
export function stripe() {
  if (!_s) _s = new Stripe(env('STRIPE_SECRET_KEY'));
  return _s;
}

export type Plan = 'maaned' | 'aar' | 'livstid';
export const PLANS: Record<Plan, { name: string; nok: number; lookup: string; recurring?: 'month' | 'year'; label: string }> = {
  maaned: { name: 'Formelskolen – månedlig', nok: 199, lookup: 'formelskolen_maaned_199', recurring: 'month', label: '199 kr per måned' },
  aar: { name: 'Formelskolen – årlig', nok: 590, lookup: 'formelskolen_aar_590', recurring: 'year', label: '590 kr per år' },
  livstid: { name: 'Formelskolen – livstid', nok: 1490, lookup: 'formelskolen_livstid_1490', label: '1 490 kr én gang' },
};

const cache = new Map<string, string>();
/**
 * Finner prisen i Stripe via lookup_key, eller oppretter produkt og pris første gang.
 * Da trenger du ikke lage produktene i Stripe selv. Pris-ID i miljøvariabel overstyrer.
 */
export async function priceFor(plan: Plan): Promise<string> {
  const override = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
  if (override) return override;
  const p = PLANS[plan];
  const hit = cache.get(p.lookup);
  if (hit) return hit;
  const found = await stripe().prices.list({ lookup_keys: [p.lookup], active: true, limit: 1 });
  let id = found.data[0]?.id;
  if (!id) {
    const product = await stripe().products.create({ name: p.name, metadata: { app: 'formelskolen', plan } });
    const price = await stripe().prices.create({
      product: product.id, currency: 'nok', unit_amount: p.nok * 100, lookup_key: p.lookup,
      ...(p.recurring ? { recurring: { interval: p.recurring } } : {}),
    });
    id = price.id;
  }
  cache.set(p.lookup, id);
  return id;
}

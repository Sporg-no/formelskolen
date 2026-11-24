import 'server-only';
import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import { SUPABASE_READY } from '@/lib/supabase/keys';

export const ACTIVE = ['trialing', 'active', 'past_due', 'lifetime'];

/** Eiere har full tilgang uten å betale. Overstyres med OWNER_EMAILS (kommaseparert). */
const OWNERS = (process.env.OWNER_EMAILS || 'eanamsvatn@gmail.com,eanamsvatn@hotmail.com')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
export const isOwner = (email?: string | null) => !!email && OWNERS.includes(email.toLowerCase());

export type Sub = {
  status: string;
  interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
};

export function hasAccess(sub: Sub | null) {
  if (!sub || !ACTIVE.includes(sub.status)) return false;
  if (sub.status === 'lifetime') return true;
  // Sikring hvis en webhook uteblir: oppsagt abonnement som har passert periodeslutt
  if (sub.cancel_at_period_end && sub.current_period_end && Date.parse(sub.current_period_end) + 6 * 3600e3 < Date.now()) return false;
  return true;
}

export const getSession = cache(async () => {
  if (!SUPABASE_READY) return { user: null, sub: null as Sub | null, active: false, configured: false };
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { user: null, sub: null as Sub | null, active: false, configured: true };
  const { data } = await sb.from('subscriptions')
    .select('status, interval, current_period_end, cancel_at_period_end, stripe_customer_id')
    .eq('user_id', user.id).maybeSingle();
  const sub = (data as Sub | null) ?? null;
  return { user, sub, active: isOwner(user.email) || hasAccess(sub), configured: true, owner: isOwner(user.email) };
});

/** Leksjoner brukeren har fullført ifølge databasen. */
export async function serverProgress(): Promise<string[]> {
  const { user } = await getSession();
  if (!user) return [];
  const sb = await supabaseServer();
  const { data } = await sb.from('progress').select('lesson_slug').eq('user_id', user.id);
  return (data ?? []).map(r => r.lesson_slug as string);
}

export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Mangler miljøvariabel ${name}`);
  return v;
}
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'post@formelskolen.no';
export const SELLER = process.env.NEXT_PUBLIC_SELLER || 'Namsvatn Markonsult, org.nr. 914 829 216';
export const supabaseConfigured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

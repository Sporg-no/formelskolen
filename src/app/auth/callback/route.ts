import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

// Google-innlogging og e-postlenker (?code= eller ?token_hash=)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const n = sp.get('next') || '/leksjoner';
  const next = n.startsWith('/') && !n.startsWith('//') ? n : '/leksjoner';
  if (sp.get('error')) redirect('/logg-inn?e=feil');
  const sb = await supabaseServer();
  const code = sp.get('code');
  const tokenHash = sp.get('token_hash');
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  } else if (tokenHash) {
    const { error } = await sb.auth.verifyOtp({ type: (sp.get('type') || 'email') as EmailOtpType, token_hash: tokenHash });
    if (!error) redirect(next);
  }
  redirect('/logg-inn?e=lenke');
}

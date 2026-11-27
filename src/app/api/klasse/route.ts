import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CLASS_COOKIE } from '@/lib/access';

export const runtime = 'nodejs';

// Aktiverer klassetilgang i denne nettleseren
export async function POST(req: NextRequest) {
  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 }); }
  const code = (body.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return NextResponse.json({ error: 'Koden er ikke gyldig.' }, { status: 400 });
  const { data } = await supabaseAdmin().from('fs_classes').select('code, school, expires_at').eq('code', code).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Fant ingen klasse med den koden. Sjekk skrivemåten med læreren.' }, { status: 404 });
  if (Date.parse(data.expires_at) < Date.now()) return NextResponse.json({ error: 'Klassekoden er utløpt. Be læreren om en ny.' }, { status: 410 });
  const res = NextResponse.json({ ok: true, school: data.school });
  const maxAge = Math.max(60, Math.floor((Date.parse(data.expires_at) - Date.now()) / 1000));
  res.cookies.set(CLASS_COOKIE, code, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CLASS_COOKIE);
  return res;
}

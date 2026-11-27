import { NextResponse, type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/access';

export const runtime = 'nodejs';

const recent = new Map<string, number>();

export async function POST(req: NextRequest) {
  let body: { message?: string; email?: string; page?: string; lesson?: string; hp?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 }); }
  if (body.hp) return NextResponse.json({ ok: true }); // felle for roboter
  const message = (body.message ?? '').trim().slice(0, 2000);
  if (message.length < 2) return NextResponse.json({ error: 'Skriv litt mer.' }, { status: 400 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'ukjent';
  const last = recent.get(ip) ?? 0;
  if (Date.now() - last < 10_000) return NextResponse.json({ error: 'Vent litt før du sender igjen.' }, { status: 429 });
  recent.set(ip, Date.now());
  const { user } = await getSession();
  const email = (body.email ?? '').trim().slice(0, 200) || user?.email || null;
  const { error } = await supabaseAdmin().from('fs_feedback').insert({
    message, email, user_id: user?.id ?? null,
    page: (body.page ?? '').slice(0, 200) || null, lesson_slug: (body.lesson ?? '').slice(0, 80) || null,
  });
  if (error) { console.error('[feedback]', error); return NextResponse.json({ error: 'Kunne ikke lagre. Prøv igjen.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}

import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getSession } from '@/lib/access';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { LESSONS } from '@/content/lessons';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { user, active } = await getSession();
  if (!user) return NextResponse.json({ error: 'Logg inn først.' }, { status: 401 });
  if (!active) return NextResponse.json({ error: 'Sertifikatet krever full tilgang.' }, { status: 403 });
  let body: { name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 }); }
  const name = (body.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (name.length < 3) return NextResponse.json({ error: 'Skriv fullt navn slik det skal stå på sertifikatet.' }, { status: 400 });
  const admin = supabaseAdmin();
  const { data: rows } = await admin.from('fs_progress').select('lesson_slug').eq('user_id', user.id);
  const done = new Set((rows ?? []).map(r => r.lesson_slug));
  const missing = LESSONS.filter(l => !done.has(l.slug));
  if (missing.length) return NextResponse.json({ error: `Du mangler ${missing.length} leksjoner, blant annet «${missing[0].title}».` }, { status: 400 });
  const { data: existing } = await admin.from('fs_certificates').select('id').eq('user_id', user.id).maybeSingle();
  const id = existing?.id ?? randomBytes(6).toString('hex').toUpperCase();
  const { error } = await admin.from('fs_certificates').upsert({ id, user_id: user.id, name, lessons: LESSONS.length }, { onConflict: 'user_id' });
  if (error) { console.error('[certificate]', error); return NextResponse.json({ error: 'Kunne ikke lagre sertifikatet.' }, { status: 500 }); }
  return NextResponse.json({ id });
}

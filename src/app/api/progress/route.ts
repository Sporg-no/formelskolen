import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/access';
import { supabaseServer } from '@/lib/supabase/server';
import { LESSONS } from '@/content/lessons';

const VALID = new Set(LESSONS.map(l => l.slug));

export async function POST(req: NextRequest) {
  const { user, active } = await getSession();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  let body: { slugs?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const free = new Set(LESSONS.filter(l => l.free).map(l => l.slug));
  const slugs = (Array.isArray(body.slugs) ? body.slugs : []).filter((s): s is string => typeof s === 'string' && VALID.has(s) && (active || free.has(s)));
  if (!slugs.length) return NextResponse.json({ ok: true, saved: 0 });
  const sb = await supabaseServer();
  const { error } = await sb.from('fs_progress').upsert(slugs.map(s => ({ user_id: user.id, lesson_slug: s })), { onConflict: 'user_id,lesson_slug', ignoreDuplicates: true });
  if (error) { console.error('[progress]', error); return NextResponse.json({ ok: false }, { status: 500 }); }
  return NextResponse.json({ ok: true, saved: slugs.length });
}

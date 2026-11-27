import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomInt } from 'node:crypto';
import Nav from '@/components/Nav';
import { getSession } from '@/lib/access';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/env';

export const metadata: Metadata = { title: 'Klassekoder', robots: { index: false } };

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPHA[randomInt(ALPHA.length)]).join('');
const fmt = (iso: string) => new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Oslo' });

async function create(form: FormData) {
  'use server';
  const { owner } = await getSession();
  if (!owner) return;
  const school = String(form.get('school') ?? '').trim().slice(0, 120);
  const teacher = String(form.get('teacher') ?? '').trim().slice(0, 160) || null;
  const weeks = Math.min(52, Math.max(1, Number(form.get('weeks')) || 26));
  if (!school) return;
  const expires = new Date(Date.now() + weeks * 7 * 864e5).toISOString();
  for (let i = 0; i < 5; i++) {
    const { error } = await supabaseAdmin().from('fs_classes').insert({ code: newCode(), school, teacher_email: teacher, expires_at: expires });
    if (!error) break;
  }
  revalidatePath('/admin/klasser');
}

async function expire(form: FormData) {
  'use server';
  const { owner } = await getSession();
  if (!owner) return;
  await supabaseAdmin().from('fs_classes').update({ expires_at: new Date().toISOString() }).eq('code', String(form.get('code')));
  revalidatePath('/admin/klasser');
}

export default async function Page() {
  const { owner } = await getSession();
  if (!owner) notFound();
  const { data } = await supabaseAdmin().from('fs_classes').select('*').order('created_at', { ascending: false });
  const rows = data ?? [];
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Admin</div>
        <h1 className="h2">Klassekoder</h1>
        <form action={create} className="card" style={{ marginTop: 24, display: 'grid', gap: 14, maxWidth: 640 }}>
          <div className="field"><label className="label" htmlFor="school">Skole og klasse</label><input id="school" name="school" className="input" required placeholder="Bryne vgs, 1STA" /></div>
          <div className="field"><label className="label" htmlFor="teacher">Lærerens e-post</label><input id="teacher" name="teacher" type="email" className="input" placeholder="larer@skole.no" /></div>
          <div className="field"><label className="label" htmlFor="weeks">Gyldig i uker</label><input id="weeks" name="weeks" type="number" min={1} max={52} defaultValue={26} className="input" /></div>
          <button className="btn btn-sig">Lag klassekode</button>
        </form>
        <div className="card" style={{ marginTop: 24, padding: 6, overflowX: 'auto' }}>
          <table className="compare">
            <thead><tr><th>Kode</th><th>Skole</th><th>Lærer</th><th>Utløper</th><th>Lenke til elevene</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} style={{ fontFamily: 'var(--f-body)', color: 'var(--muted)', fontWeight: 400 }}>Ingen klassekoder ennå.</td></tr>}
              {rows.map(r => {
                const active = Date.parse(r.expires_at) > Date.now();
                return (
                  <tr key={r.code}>
                    <td>{r.code}</td>
                    <td style={{ fontFamily: 'var(--f-body)', color: 'var(--ink)' }}>{r.school}</td>
                    <td style={{ fontFamily: 'var(--f-body)' }}>{r.teacher_email ?? ''}</td>
                    <td style={{ fontFamily: 'var(--f-body)', color: active ? 'var(--ink)' : 'var(--bad)' }}>{fmt(r.expires_at)}</td>
                    <td className="mono" style={{ fontSize: 13 }}>{`${siteUrl()}/klasse?kode=${r.code}`}</td>
                    <td>{active && <form action={expire}><input type="hidden" name="code" value={r.code} /><button className="btn btn-ghost btn-xs">Avslutt</button></form>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import { getSession } from '@/lib/access';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Tilbakemeldinger', robots: { index: false } };

const fmt = (iso: string) => new Date(iso).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' });

export default async function Page() {
  const { owner } = await getSession();
  if (!owner) notFound();
  const { data } = await supabaseAdmin().from('fs_feedback').select('*').order('created_at', { ascending: false }).limit(300);
  const rows = data ?? [];
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Admin</div>
        <h1 className="h2">Tilbakemeldinger</h1>
        <p className="muted">{rows.length} totalt. Nyeste først.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          {rows.length === 0 && <div className="card">Ingen tilbakemeldinger ennå.</div>}
          {rows.map(r => (
            <div key={r.id} className="card" style={{ padding: 20 }}>
              <div className="small muted">{fmt(r.created_at)} · {r.lesson_slug ? <a href={`/leksjoner/${r.lesson_slug}`}>{r.lesson_slug}</a> : r.page ?? ''}{r.email ? <> · <a href={`mailto:${r.email}`}>{r.email}</a></> : ''}</div>
              <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{r.message}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

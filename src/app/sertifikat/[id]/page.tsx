import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/Brand';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { siteUrl } from '@/lib/env';

type P = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^[A-F0-9]{12}$/.test(id)) return null;
  try {
    const { data } = await supabaseAdmin().from('fs_certificates').select('id, name, lessons, issued_at').eq('id', id).maybeSingle();
    return data;
  } catch { return null; }
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await load((await params).id);
  return c ? { title: `Sertifikat – ${c.name}`, robots: { index: false } } : { title: 'Sertifikat ikke funnet' };
}

export default async function Page({ params }: P) {
  const { id } = await params;
  const c = await load(id);
  if (!c) notFound();
  const date = new Date(c.issued_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' });
  const url = `${siteUrl()}/sertifikat/${c.id}`;
  return (
    <main className="wrap" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div className="cert">
        <Brand />
        <div className="eyebrow" style={{ marginTop: 34 }}>Kursbevis</div>
        <h1>Excel på norsk</h1>
        <p className="muted" style={{ marginTop: 26 }}>Dette bekrefter at</p>
        <div className="who">{c.name}</div>
        <p style={{ color: 'var(--body)', maxWidth: 560, margin: '0 auto' }}>har fullført alle {c.lessons} leksjonene i Formelskolen, med formler, betingede funksjoner, oppslag, tekst, datoer og økonomiprosjekter.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 40, flexWrap: 'wrap' }}>
          <div><div className="label">Dato</div><div style={{ fontWeight: 700, marginTop: 4 }}>{date}</div></div>
          <div><div className="label">Sertifikat-ID</div><div className="mono" style={{ fontWeight: 700, marginTop: 4 }}>{c.id}</div></div>
        </div>
        <p className="small muted" style={{ marginTop: 34 }}>Bekreft ekthet på {url}</p>
      </div>
      <div className="noprint center" style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a className="btn btn-sig btn-sm" href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent('Excel på norsk')}&organizationName=${encodeURIComponent('Formelskolen')}&issueYear=${new Date(c.issued_at).getFullYear()}&issueMonth=${new Date(c.issued_at).getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${c.id}`} target="_blank" rel="noopener">Legg til på LinkedIn</a>
        <a className="btn btn-line btn-sm" href="/">Til Formelskolen</a>
      </div>
    </main>
  );
}

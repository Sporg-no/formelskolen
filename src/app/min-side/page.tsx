import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CertForm from './CertForm';
import { getSession, serverProgress } from '@/lib/access';
import { supabaseServer } from '@/lib/supabase/server';
import { LESSONS } from '@/content/lessons';
import { CONTACT } from '@/lib/env';

export const metadata: Metadata = { title: 'Min side', robots: { index: false } };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' }) : '');

export default async function Page({ searchParams }: { searchParams: Promise<{ kjop?: string }> }) {
  const sp = await searchParams;
  const { user, sub, active, owner } = await getSession();
  if (!user) redirect('/logg-inn?neste=/min-side');
  const done = new Set(await serverProgress());
  const n = LESSONS.filter(l => done.has(l.slug)).length;
  const sb = await supabaseServer();
  const { data: cert } = await sb.from('fs_certificates').select('id, name').eq('user_id', user.id).maybeSingle();

  let status = 'Gratis konto. Du har tilgang til de gratis leksjonene.';
  if (owner) status = 'Eier. Full tilgang uten abonnement.';
  else if (sub?.status === 'lifetime') status = 'Livstidstilgang.';
  else if (active && sub) status = sub.cancel_at_period_end
    ? `Abonnementet er sagt opp og stopper ${fmt(sub.current_period_end)}.`
    : `${sub.interval === 'year' ? 'Årsabonnement' : 'Månedsabonnement'}. Fornyes ${fmt(sub.current_period_end)}.`;
  else if (sub?.status === 'canceled') status = 'Abonnementet er avsluttet.';

  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Min side</div>
        <h1 className="h2">{user.email}</h1>
        {sp.kjop === 'ok' && <div className="ok" style={{ marginTop: 20, maxWidth: 720 }}>Takk for kjøpet. Tilgangen er aktiv. Kommer den ikke med en gang, last siden på nytt om noen sekunder.</div>}
        <div className="grid2" style={{ marginTop: 32 }}>
          <div className="card">
            <div className="label">Tilgang</div>
            <p style={{ fontSize: 18, fontWeight: 600 }}>{status}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!active && <a className="btn btn-sig btn-sm" href="/priser">Få full tilgang</a>}
              {sub?.stripe_customer_id && sub.status !== 'lifetime' && (
                <form action="/api/portal" method="post"><button className="btn btn-line btn-sm">Endre eller si opp</button></form>
              )}
              {sub?.stripe_customer_id && sub.status === 'lifetime' && (
                <form action="/api/portal" method="post"><button className="btn btn-line btn-sm">Kvitteringer</button></form>
              )}
              <form action="/api/logout" method="post"><button className="btn btn-ghost btn-sm">Logg ut</button></form>
            </div>
          </div>
          <div className="card">
            <div className="label">Fremdrift</div>
            <p style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 32, margin: '10px 0' }}>{n} av {LESSONS.length} leksjoner</p>
            <div className="progressbar"><div style={{ width: `${(n / LESSONS.length) * 100}%` }} /></div>
            <a className="btn btn-line btn-sm" href="/leksjoner" style={{ marginTop: 16 }}>Til leksjonene</a>
          </div>
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <div className="label">Sertifikat</div>
          {cert ? (
            <>
              <p style={{ color: 'var(--body)' }}>Sertifikatet ditt er klart. Del lenken på LinkedIn under «Lisenser og sertifiseringer».</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                <a className="btn btn-sig btn-sm" href={`/sertifikat/${cert.id}`}>Vis sertifikatet</a>
              </div>
              <CertForm initial={cert.name} />
            </>
          ) : n === LESSONS.length && active ? (
            <>
              <p style={{ color: 'var(--body)' }}>Du har fullført alle leksjonene. Skriv navnet ditt slik det skal stå på sertifikatet.</p>
              <CertForm />
            </>
          ) : (
            <p style={{ color: 'var(--body)' }}>Fullfør alle {LESSONS.length} leksjonene for å få sertifikatet. Du mangler {LESSONS.length - n}.</p>
          )}
        </div>
        {owner && <p style={{ marginTop: 28 }}><a className="btn btn-line btn-sm" href="/admin/klasser">Klassekoder (admin)</a></p>}
        <p className="small muted" style={{ marginTop: 28 }}>Spørsmål om kontoen eller betaling: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { LESSONS, MODULES, TASK_COUNT } from '@/content/lessons';
import { CONTACT } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Excel-oppgaver for elever – gratis for skoleklasser',
  description: `Interaktive Excel- og regnearkoppgaver på norsk med automatisk retting. ${LESSONS.length} leksjoner og ${TASK_COUNT} oppgaver. Gratis for skoleklasser, uten elevkontoer.`,
};

const USES = [
  ['Matematikk', 'Formler, prosent, regnerekkefølge, gjennomsnitt og budsjett.', ['din-forste-formel', 'prosent-og-mva', 'parenteser-og-rekkefolge', 'gjennomsnitt-min-storst', 'prosjekt-budsjett']],
  ['Økonomi og salg', 'MVA, rabatter, faktura, lån og salgsrapporter.', ['prosent-og-mva', 'finn-rad-omtrentlig', 'prosjekt-faktura', 'boliglan-avdrag', 'prosjekt-salgsrapport']],
  ['IT og kontorfag', 'Oppslag, tekstfunksjoner, datoer og betinget logikk.', ['hvis', 'finn-rad', 'xoppslag', 'sla-sammen-tekst', 'regn-med-datoer']],
] as const;

export default function Page() {
  const mail = `mailto:${CONTACT}?subject=${encodeURIComponent('Klassekode til Formelskolen')}&body=${encodeURIComponent('Skole:\nFag og trinn:\nAntall elever:\nHvor lenge dere trenger tilgang:\n')}`;
  const title = (slug: string) => LESSONS.find(l => l.slug === slug)?.title ?? slug;
  return (
    <>
      <Nav />
      <main>
        <section className="wrap" style={{ paddingTop: 24, paddingBottom: 56 }}>
          <div className="eyebrow">For lærere</div>
          <h1 className="h2" style={{ marginTop: 10, maxWidth: 900 }}>Excel-oppgaver for elever. Rettes automatisk.</h1>
          <p className="lead" style={{ marginTop: 18 }}>
            {LESSONS.length} leksjoner og {TASK_COUNT} oppgaver på norsk. Elevene skriver formlene i et regneark i nettleseren og får vite med en gang om de er riktige. Du slipper å rette, og skoleklasser bruker det gratis.
          </p>
          <div className="hero-cta" style={{ marginTop: 26 }}>
            <a className="btn btn-sig" href={mail}>Be om klassekode</a>
            <a className="btn btn-line" href="/leksjoner/din-forste-formel">Prøv en leksjon selv</a>
          </div>
        </section>

        <section className="dark">
          <div className="section wrap">
            <div className="grid3">
              <div className="feature">
                <div className="feature-icon">✓</div>
                <h3 className="h3">Retting som ikke lar seg lure</h3>
                <p>Retteren bytter ut tallene i arket i bakgrunnen og sjekker at formelen fortsatt gir riktig svar. Å skrive inn svaret direkte, eller glemme $, blir oppdaget.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">0</div>
                <h3 className="h3">Ingen elevkontoer</h3>
                <p>Elevene skriver inn en klassekode. Vi lagrer ingen navn, e-poster eller andre opplysninger om dem. Fremdriften ligger bare i nettleseren deres.</p>
              </div>
              <div className="feature">
                <div className="feature-icon">■</div>
                <h3 className="h3">Ingen installasjon</h3>
                <p>Virker i nettleseren på skolens PC-er, Mac og Chromebook. Elevene trenger ikke Excel. Formlene er de samme som i norsk Excel.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section wrap">
          <div className="eyebrow">Bruk i fag</div>
          <h2 className="h2">Leksjoner som passer til faget ditt.</h2>
          <div className="grid3" style={{ marginTop: 32 }}>
            {USES.map(([fag, txt, slugs]) => (
              <div key={fag} className="card">
                <h3 className="h3">{fag}</h3>
                <p style={{ color: 'var(--body)' }}>{txt}</p>
                <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--body)' }}>
                  {slugs.map(s => <li key={s} style={{ margin: '4px 0' }}><a href={`/leksjoner/${s}`}>{title(s)}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 20 }}>Hele kurset har {MODULES.length} deler: {MODULES.join(', ').toLowerCase()}.</p>
        </section>

        <section className="section wrap" style={{ paddingTop: 0 }}>
          <div className="eyebrow">Slik kommer dere i gang</div>
          <h2 className="h2">Tre steg.</h2>
          <div className="grid3" style={{ marginTop: 32 }}>
            <div className="card"><div className="label">1</div><h3 className="h3" style={{ marginTop: 8 }}>Send en e-post</h3><p style={{ color: 'var(--body)' }}>Skriv fra skoleadressen din til {CONTACT} med skole, fag og trinn.</p></div>
            <div className="card"><div className="label">2</div><h3 className="h3" style={{ marginTop: 8 }}>Få en lenke</h3><p style={{ color: 'var(--body)' }}>Du får en klassekode og en lenke samme dag. Tilgangen varer ut semesteret.</p></div>
            <div className="card"><div className="label">3</div><h3 className="h3" style={{ marginTop: 8 }}>Del med elevene</h3><p style={{ color: 'var(--body)' }}>Legg lenken i Teams, Classroom eller på tavla. Elevene er i gang på under ett minutt.</p></div>
          </div>
          <div style={{ marginTop: 32 }}><a className="btn btn-sig" href={mail}>Be om klassekode</a></div>
        </section>
      </main>
      <Footer />
    </>
  );
}

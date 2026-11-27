import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { CATALOG, type Category } from '@/lib/engine/functions';
import { LESSONS } from '@/content/lessons';
import { fnSlug } from '@/content/fnSlug';

export const metadata: Metadata = {
  title: 'Excel-funksjoner på norsk og engelsk',
  description: `Oversikt over ${CATALOG.length} Excel-funksjoner med norsk og engelsk navn: FINN.RAD = VLOOKUP, HVIS = IF, SUMMERHVIS = SUMIF, ANTALL.HVIS = COUNTIF og flere.`,
};

const ORDER: Category[] = ['Matte', 'Statistikk', 'Logikk', 'Oppslag', 'Tekst', 'Dato', 'Økonomi', 'Info'];

function lessonFor(no: string) {
  return LESSONS.find(l => l.tasks.some(t => (t.mustUse ?? []).includes(no)));
}

export default function Page() {
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Oppslagsverk</div>
        <h1 className="h2">Excel-funksjoner på norsk og engelsk.</h1>
        <p className="lead" style={{ margin: '16px 0 0' }}>Norsk Excel bruker norske funksjonsnavn og semikolon mellom argumentene. Her er {CATALOG.length} av de mest brukte, med engelsk navn og hva de gjør.</p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '28px 0 12px' }}>
          {ORDER.map(c => <a key={c} href={`#${c}`} className="pill gray" style={{ textDecoration: 'none' }}>{c}</a>)}
        </nav>
        {ORDER.map(cat => {
          const list = CATALOG.filter(f => f.cat === cat).sort((a, b) => a.no.localeCompare(b.no, 'nb'));
          if (!list.length) return null;
          return (
            <section key={cat} id={cat} style={{ marginTop: 40 }}>
              <h2 className="h3" style={{ fontSize: 26 }}>{cat}</h2>
              <div className="card" style={{ padding: 6, marginTop: 14, overflowX: 'auto' }}>
                <table className="compare">
                  <thead><tr><th>Norsk</th><th>Engelsk</th><th>Bruk</th><th>Gjør</th></tr></thead>
                  <tbody>
                    {list.map(f => {
                      const l = lessonFor(f.no);
                      return (
                        <tr key={f.no} id={f.no}>
                          <td><a href={`/funksjoner/${fnSlug(f.no)}`} style={{ color: 'inherit' }}>{f.no}</a></td>
                          <td>{f.en}</td>
                          <td className="mono" style={{ fontSize: 13, color: 'var(--body)', whiteSpace: 'nowrap' }}>={f.syntax}</td>
                          <td>{f.desc}{l && <> <a href={`/leksjoner/${l.slug}`} className="small" style={{ color: 'var(--sig-ink)', fontWeight: 600 }}>Øv på det →</a></>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        <div className="card" style={{ marginTop: 48 }}>
          <h2 className="h3">Komma eller semikolon?</h2>
          <p style={{ color: 'var(--body)' }}>Når Windows er satt opp med norsk språk, bruker Excel komma som desimaltegn. Da kan ikke komma også skille argumentene, så Excel bruker semikolon: <code>=AVRUND(A1;2)</code>. I engelsk oppsett skrives det <code>=ROUND(A1,2)</code>.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

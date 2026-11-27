import Nav from '@/components/Nav';
import TesterBanner from '@/components/TesterBanner';
import Footer from '@/components/Footer';
import DemoSheet from '@/components/DemoSheet';
import PlanCards from '@/components/PlanCards';
import { LESSONS, MODULES, FREE_COUNT, TASK_COUNT } from '@/content/lessons';
import { CATALOG } from '@/lib/engine/functions';
import { getSession } from '@/lib/access';
import { stripeConfigured, CONTACT } from '@/lib/env';

const SHOW = ['SUMMER', 'HVIS', 'FINN.RAD', 'ANTALL.HVIS', 'SUMMERHVIS', 'XOPPSLAG', 'AVRUND', 'STØRST'];

const FAQ = [
  ['Trenger jeg å ha Excel?', 'Nei. Regnearket kjører i nettleseren. Du kan bruke PC, Mac eller nettbrett. Det går på mobil også, men en større skjerm er bedre.'],
  ['Jeg har engelsk Excel. Passer kurset for meg?', 'Ja. Hver leksjon viser både det norske og det engelske funksjonsnavnet, og regnearket godtar begge. Komma fungerer også som skilletegn.'],
  ['Hvordan vet jeg at formelen er riktig?', 'Retteren sjekker svaret med en gang. Den endrer også tallene i arket i bakgrunnen og sjekker at formelen fortsatt gir riktig svar. Skriver du inn et tall i stedet for en formel, eller glemmer $, får du beskjed.'],
  ['Hva får jeg når jeg er ferdig?', 'Et sertifikat med navnet ditt og en egen lenke som andre kan bruke for å bekrefte det. Lenken kan legges på LinkedIn eller i CV-en.'],
  ['Kan jeg si opp?', 'Ja, når som helst under Min side. Du beholder tilgangen ut perioden du har betalt for.'],
  ['Kan arbeidsgiveren betale?', `Ja. Vi sender faktura til bedrifter og gir rabatt for flere brukere. Skriv til ${CONTACT}.`],
];

export default async function Home() {
  const { user } = await getSession();
  const modCounts = MODULES.map(m => ({ m, n: LESSONS.filter(l => l.module === m).length, ex: LESSONS.filter(l => l.module === m).slice(0, 3).map(l => l.title) }));
  const show = SHOW.map(n => CATALOG.find(f => f.no === n)!).filter(Boolean);
  return (
    <>
      <TesterBanner />
      <Nav />
      <header className="hero wrap">
        <div>
          <div className="eyebrow">Excel-kurs på norsk</div>
          <h1 className="h1" style={{ marginTop: 14 }}>Lær Excel ved å gjøre det.</h1>
          <p className="lead">{LESSONS.length} leksjoner med oppgaver i et ekte regneark i nettleseren. Norske funksjonsnavn, semikolon og desimalkomma, slik Excel ser ut på jobben. Formlene rettes med en gang.</p>
          <div className="hero-cta">
            <a className="btn btn-sig" href="/leksjoner/din-forste-formel">Start gratis</a>
            <a className="btn btn-line" href="/leksjoner">Se alle leksjoner</a>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>De {FREE_COUNT} første leksjonene er gratis. Ingen innlogging.</p>
          <div className="facts">
            <div className="fact"><b>{LESSONS.length}</b><span>leksjoner</span></div>
            <div className="fact"><b>{TASK_COUNT}</b><span>oppgaver</span></div>
            <div className="fact"><b>{CATALOG.length}</b><span>funksjoner</span></div>
          </div>
        </div>
        <DemoSheet />
      </header>

      <section className="dark">
        <div className="section wrap">
          <div className="eyebrow">Hvorfor norsk</div>
          <h2 className="h2">Engelske kurs gir norske feilmeldinger.</h2>
          <p className="lead" style={{ marginTop: 18 }}>
            I norsk Excel heter VLOOKUP <code>FINN.RAD</code>, argumentene skilles med semikolon, og desimaltall skrives med komma. Følger du en engelsk video, får du <code>#NAVN?</code>. Her lærer du formlene slik de faktisk skrives på en norsk PC.
          </p>
          <div className="grid3" style={{ marginTop: 44 }}>
            <div className="feature">
              <div className="feature-icon">;</div>
              <h3 className="h3">Norsk syntaks</h3>
              <p>Semikolon mellom argumenter, komma i tall og norske navn. Engelske navn godtas også, så du kan bruke begge.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <h3 className="h3">Retting som ikke lar seg lure</h3>
              <p>Retteren endrer tallene i arket og sjekker at formelen fortsatt stemmer. Riktig tall uten riktig formel holder ikke.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">■</div>
              <h3 className="h3">Som i Excel</h3>
              <p>Klikk på celler for å sette inn referanser, dra i fyllhåndtaket, kopier med Ctrl+C og få forslag til funksjoner mens du skriver.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="eyebrow">Innhold</div>
        <h2 className="h2">Fra første formel til ferdig rapport.</h2>
        <div className="grid3" style={{ marginTop: 36 }}>
          {modCounts.map(({ m, n, ex }) => (
            <div key={m} className="card">
              <div className="label">{n} leksjoner</div>
              <h3 className="h3" style={{ marginTop: 8 }}>{m}</h3>
              <p className="small muted" style={{ margin: '8px 0 0' }}>{ex.join(' · ')}</p>
            </div>
          ))}
          <div className="card" style={{ background: 'var(--tint)', borderColor: 'transparent' }}>
            <div className="label">Til slutt</div>
            <h3 className="h3" style={{ marginTop: 8 }}>Sertifikat</h3>
            <p className="small" style={{ margin: '8px 0 0', color: 'var(--body)' }}>Med navnet ditt og en lenke for verifisering som du kan legge på LinkedIn.</p>
          </div>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="grid2" style={{ alignItems: 'center', gap: 48 }}>
          <div>
            <div className="eyebrow">Norsk og engelsk</div>
            <h2 className="h2">Samme funksjon. To navn.</h2>
            <p className="lead" style={{ marginTop: 16 }}>Oversikten over alle {CATALOG.length} funksjonene ligger åpent, med norsk navn, engelsk navn og hva de gjør.</p>
            <a className="btn btn-line" href="/funksjoner" style={{ marginTop: 10 }}>Se alle funksjonene</a>
          </div>
          <div className="card" style={{ padding: 8, overflowX: 'auto' }}>
            <table className="compare">
              <thead><tr><th>Norsk</th><th>Engelsk</th><th>Gjør</th></tr></thead>
              <tbody>{show.map(f => <tr key={f.no}><td>{f.no}</td><td>{f.en}</td><td>{f.desc}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section wrap" id="priser" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="eyebrow">Priser</div>
        <h2 className="h2">Tre leksjoner gratis. Resten for 49 kr i måneden.</h2>
        <p className="lead" style={{ margin: '16px 0 36px' }}>Prøv de første leksjonene uten å registrere deg. Lærere får gratis tilgang for elevene sine.</p>
        <PlanCards loggedIn={!!user} configured={stripeConfigured()} />
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="card" style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--ink)', color: 'var(--paper)', borderColor: 'transparent' }}>
          <div style={{ maxWidth: 640 }}>
            <div className="eyebrow" style={{ color: 'var(--sig)' }}>Skoler og bedrifter</div>
            <h3 className="h3" style={{ marginTop: 8, fontSize: 28 }}>Gratis for skoleklasser. Faktura for bedrifter.</h3>
            <p style={{ color: '#C9D3CC', margin: '10px 0 0' }}>Lærere i ungdomsskole, videregående og voksenopplæring får gratis tilgang for elevene. Bedrifter får samlet faktura og rabatt fra fem brukere.</p>
          </div>
          <a className="btn btn-sig" href="/bedrift">Les mer</a>
        </div>
      </section>

      <section className="section wrap" style={{ paddingTop: 0 }}>
        <div className="eyebrow">Spørsmål</div>
        <h2 className="h2">Ofte spurt.</h2>
        <div style={{ marginTop: 24 }}>
          {FAQ.map(([q, a]) => <details key={q} className="faq-item"><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>
      <Footer />
    </>
  );
}

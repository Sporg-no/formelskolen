import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import PlanCards from '@/components/PlanCards';
import { getSession } from '@/lib/access';
import { stripeConfigured } from '@/lib/env';
import { LESSONS, FREE_COUNT } from '@/content/lessons';

export const metadata: Metadata = { title: 'Priser', description: 'Full tilgang til alle Excel-leksjonene fra 49 kr i måneden. Tre leksjoner er gratis.' };

export default async function Page({ searchParams }: { searchParams: Promise<{ avbrutt?: string }> }) {
  const sp = await searchParams;
  const { user, active, sub } = await getSession();
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Priser</div>
        <h1 className="h2">Full tilgang. Velg hvordan du betaler.</h1>
        <p className="lead" style={{ margin: '16px 0 36px' }}>Alle {LESSONS.length} leksjonene, prosjektene og sertifikatet. De {FREE_COUNT} første leksjonene er gratis uansett.</p>
        {sp.avbrutt && <div className="err" style={{ marginBottom: 24, maxWidth: 720 }}>Betalingen ble avbrutt. Ingenting er trukket.</div>}
        {active && <div className="ok" style={{ marginBottom: 24, maxWidth: 720 }}>Du har allerede full tilgang{sub?.status === 'lifetime' ? ' for alltid' : ''}. <a href="/min-side">Gå til Min side</a>.</div>}
        {process.env.NEXT_PUBLIC_TESTER_CODE && !active && (
          <div className="ok" style={{ marginBottom: 24, maxWidth: 720 }}>
            <b>Testbruker?</b> Logg inn, huk av samtykket og velg <b>Måned</b>. Trykk «Legg til kampanjekode» i kassen og skriv <b className="mono">{process.env.NEXT_PUBLIC_TESTER_CODE}</b>. Det koster 0 kr, og du trenger ikke legge inn kort.
          </div>
        )}
        <PlanCards loggedIn={!!user} configured={stripeConfigured()} />
        <div className="grid2" style={{ marginTop: 56, maxWidth: 980 }}>
          <div className="card">
            <h2 className="h3">For lærere</h2>
            <p style={{ color: 'var(--body)' }}>Elevene dine får gratis tilgang. Lærere må ta kontakt. Vi kan ikke gi gratis tilgang til elever som skriver direkte.</p>
            <a href="/bedrift" className="linkbtn">Les mer</a>
          </div>
          <div className="card">
            <h2 className="h3">For bedrifter</h2>
            <p style={{ color: 'var(--body)' }}>Samlet faktura, en oversikt over hvem som har fullført, og rabatt fra fem brukere.</p>
            <a href="/bedrift" className="linkbtn">Be om tilbud</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

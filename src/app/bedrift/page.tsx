import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { CONTACT } from '@/lib/env';
import { LESSONS } from '@/content/lessons';

export const metadata: Metadata = { title: 'For skoler og bedrifter', description: 'Gratis Excel-kurs på norsk for skoleklasser. Bedriftslisens med faktura for ansatte.' };

export default function Page() {
  const school = `mailto:${CONTACT}?subject=${encodeURIComponent('Gratis tilgang for skoleklasse')}&body=${encodeURIComponent('Skole:\nFag og trinn:\nAntall elever:\nMin e-post på skolen:\n')}`;
  const firm = `mailto:${CONTACT}?subject=${encodeURIComponent('Tilbud bedriftslisens')}&body=${encodeURIComponent('Bedrift og org.nr.:\nAntall ansatte som skal ha tilgang:\nKontaktperson:\nFakturaadresse/EHF:\n')}`;
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Skoler og bedrifter</div>
        <h1 className="h2">Excel-opplæring for hele gruppa.</h1>
        <p className="lead" style={{ margin: '16px 0 40px' }}>{LESSONS.length} leksjoner som lærer bort Excel på norsk, med retting som sjekker formlene. Ingen installasjon, alt kjører i nettleseren.</p>
        <div className="grid2">
          <div className="card">
            <div className="label">Skoler</div>
            <h2 className="h3" style={{ marginTop: 8, fontSize: 28 }}>Gratis for elever.</h2>
            <ul style={{ color: 'var(--body)', paddingLeft: 20 }}>
              <li>Ungdomsskole, videregående, fagskole og voksenopplæring</li>
              <li>Passer til regneark i matematikk, økonomi og IT-fag</li>
              <li>Læreren får en klassekode. Elevene trenger ikke konto</li>
            </ul>
            <p className="small muted">Læreren må ta kontakt fra skolens e-postadresse. Vi kan ikke gi gratis tilgang til elever direkte.</p>
            <a className="btn btn-sig" href={school}>Be om skoletilgang</a>
          </div>
          <div className="card">
            <div className="label">Bedrifter</div>
            <h2 className="h3" style={{ marginTop: 8, fontSize: 28 }}>Faktura og rabatt.</h2>
            <ul style={{ color: 'var(--body)', paddingLeft: 20 }}>
              <li>Én samlet faktura, også EHF</li>
              <li>Rabatt fra fem brukere</li>
              <li>Oversikt over hvem som har fullført og fått sertifikat</li>
            </ul>
            <p className="small muted">Fint som onboarding for nye ansatte i økonomi, logistikk, salg og administrasjon.</p>
            <a className="btn btn-ink" href={firm}>Be om tilbud</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

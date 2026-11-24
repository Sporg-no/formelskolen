import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { CONTACT, SELLER } from '@/lib/env';

export const metadata: Metadata = { title: 'Vilkår' };

export default function Page() {
  return (
    <>
      <Nav />
      <main className="wrap doc" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Vilkår</div>
        <h1 className="h2">Kjøpsvilkår</h1>
        <p>Formelskolen selges av {SELLER}. Kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        <h2>Hva du kjøper</h2>
        <p>Tilgang til alle leksjonene på formelskolen.no for valgt periode: én måned, ett år eller livstid. Livstid betyr så lenge tjenesten drives.</p>
        <h2>Pris og betaling</h2>
        <p>Prisene står på prissiden. Betalingen skjer med kort eller lommebok via Stripe. Måneds- og årsabonnement fornyes automatisk til samme pris til du sier opp.</p>
        <h2>Oppsigelse</h2>
        <p>Du kan si opp når som helst under Min side. Tilgangen varer ut perioden du har betalt for. Vi refunderer ikke påbegynte perioder.</p>
        <h2>Angrerett</h2>
        <p>Etter angrerettloven har du 14 dagers angrerett. Når du ber om tilgang med en gang og samtykker til det i kassen, faller angreretten bort når innholdet er levert, jf. angrerettloven § 22 bokstav n.</p>
        <h2>Endringer</h2>
        <p>Vi kan endre innhold og priser. Prisendringer på løpende abonnement varsles på e-post minst 30 dager før de gjelder.</p>
        <h2>Klager</h2>
        <p>Ta kontakt på e-post. Kommer vi ikke til enighet, kan du klage til Forbrukerrådet.</p>
      </main>
      <Footer />
    </>
  );
}

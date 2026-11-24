import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { CONTACT, SELLER } from '@/lib/env';

export const metadata: Metadata = { title: 'Personvern' };

export default function Page() {
  return (
    <>
      <Nav />
      <main className="wrap doc" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Personvern</div>
        <h1 className="h2">Personvernerklæring</h1>
        <p>Behandlingsansvarlig er {SELLER}. Kontakt: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
        <h2>Hva vi lagrer</h2>
        <ul>
          <li>E-postadressen din, for innlogging og kvitteringer</li>
          <li>Hvilke leksjoner du har fullført</li>
          <li>Navnet du skriver på sertifikatet</li>
          <li>Abonnementsstatus fra Stripe. Kortopplysninger lagres hos Stripe, ikke hos oss.</li>
        </ul>
        <p>Uten konto lagres arbeidet ditt bare i nettleseren din (localStorage). Vi bruker ingen sporingskapsler eller annonsenettverk.</p>
        <h2>Hvor dataene ligger</h2>
        <p>Databasen driftes av Supabase i EU (Stockholm). Nettsiden driftes av Vercel. Betaling håndteres av Stripe.</p>
        <h2>Grunnlag</h2>
        <p>Vi behandler opplysningene for å oppfylle avtalen med deg (GDPR art. 6 nr. 1 b) og for å oppfylle regnskapsplikten (art. 6 nr. 1 c).</p>
        <h2>Rettighetene dine</h2>
        <p>Du kan be om innsyn, retting og sletting på e-post. Du kan klage til Datatilsynet.</p>
      </main>
      <Footer />
    </>
  );
}

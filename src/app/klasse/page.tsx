import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ClassForm from './ClassForm';
import { getClassAccess } from '@/lib/access';

export const metadata: Metadata = { title: 'Klassetilgang', robots: { index: false } };

const fmt = (iso: string) => new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' });

export default async function Page({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  const sp = await searchParams;
  const klasse = await getClassAccess();
  return (
    <>
      <Nav />
      <div className="formwrap">
        <div className="formcard">
          <div className="eyebrow">Klassetilgang</div>
          {klasse ? (
            <>
              <h1>Du har tilgang via {klasse.school}.</h1>
              <p className="lead" style={{ margin: 0, fontSize: 17 }}>Alle leksjonene er åpne til {fmt(klasse.expires_at)}. Fremdriften lagres i denne nettleseren.</p>
              <a className="btn btn-sig btn-block" href="/leksjoner">Til leksjonene</a>
            </>
          ) : (
            <>
              <h1>Skriv inn klassekoden.</h1>
              <p className="lead" style={{ margin: 0, fontSize: 17 }}>Koden får du av læreren. Du trenger ikke lage konto, og fremdriften lagres i denne nettleseren.</p>
              <ClassForm initial={(sp.kode ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import LoginForm from './LoginForm';
import { getSession } from '@/lib/access';

export const metadata: Metadata = { title: 'Logg inn', robots: { index: false } };

const MSG: Record<string, string> = {
  lenke: 'Lenken er brukt eller utløpt. Be om en ny.',
  feil: 'Innloggingen ble avbrutt. Prøv igjen.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ neste?: string; e?: string }> }) {
  const sp = await searchParams;
  const { user, configured } = await getSession();
  const next = sp.neste && sp.neste.startsWith('/') && !sp.neste.startsWith('//') ? sp.neste : '/leksjoner';
  if (user) redirect(next);
  return (
    <>
      <Nav />
      <div className="formwrap">
        <div className="formcard">
          <div className="eyebrow">Logg inn</div>
          <h1>Lagre fremdriften din.</h1>
          <p className="lead" style={{ margin: 0, fontSize: 17 }}>Med konto lagres fullførte leksjoner på tvers av PC og mobil. Du trenger konto for å kjøpe tilgang.</p>
          {sp.e && MSG[sp.e] && <div className="err">{MSG[sp.e]}</div>}
          {configured ? <LoginForm next={next} /> : <div className="err">Innlogging åpner snart. Du kan bruke de gratis leksjonene uten konto.</div>}
        </div>
      </div>
      <Footer />
    </>
  );
}

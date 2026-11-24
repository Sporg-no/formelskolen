import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import LessonList from '@/components/LessonList';
import { LESSONS, MODULES, FREE_COUNT } from '@/content/lessons';
import { getSession, serverProgress } from '@/lib/access';

export const metadata: Metadata = { title: 'Alle leksjoner', description: `${LESSONS.length} interaktive Excel-leksjoner på norsk, fra første formel til FINN.RAD, HVIS og ferdige prosjekter.` };

export default async function Page() {
  const { user, active } = await getSession();
  const server = await serverProgress();
  const items = LESSONS.map(l => ({ slug: l.slug, nr: l.nr, title: l.title, summary: l.summary, minutes: l.minutes, free: !!l.free, module: l.module }));
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 24, paddingBottom: 88 }}>
        <div className="eyebrow">Leksjoner</div>
        <h1 className="h2" style={{ marginBottom: 12 }}>{LESSONS.length} leksjoner. Én formel om gangen.</h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          {active ? 'Du har full tilgang.' : <>De {FREE_COUNT} første er gratis. <a href="/priser">Lås opp resten</a> fra 49 kr i måneden.</>}
        </p>
        <LessonList modules={MODULES} lessons={items} server={server} active={active} loggedIn={!!user} />
      </main>
      <Footer />
    </>
  );
}

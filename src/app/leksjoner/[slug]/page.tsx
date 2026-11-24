import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import LessonPlayer from '@/components/LessonPlayer';
import { LESSONS, lessonBySlug, nextLesson, FREE_COUNT } from '@/content/lessons';
import { getSession } from '@/lib/access';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = lessonBySlug((await params).slug);
  if (!l) return {};
  return { title: `${l.title} – Excel på norsk`, description: `${l.summary} Interaktiv Excel-leksjon på norsk med ${l.tasks.length} oppgaver.` };
}

export default async function Page({ params }: P) {
  const lesson = lessonBySlug((await params).slug);
  if (!lesson) notFound();
  const { user, active } = await getSession();
  const open = lesson.free || active;
  const nx = nextLesson(lesson.slug);

  if (!open) {
    return (
      <>
        <Nav />
        <main className="wrap">
          <div className="paywall">
            <div className="eyebrow">Leksjon {lesson.nr} · {lesson.module}</div>
            <h1 className="h2">{lesson.title}</h1>
            <p className="lead" style={{ margin: '16px auto 0' }}>{lesson.summary} {lesson.tasks.length} oppgaver, ca. {lesson.minutes} minutter.</p>
            <div className="card">
              <h2 className="h3">Denne leksjonen krever full tilgang.</h2>
              <p style={{ color: 'var(--body)' }}>Du har {FREE_COUNT} gratis leksjoner. Full tilgang gir alle {LESSONS.length} leksjonene, prosjektene og sertifikatet.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                <a className="btn btn-sig" href="/priser">Se priser</a>
                {!user && <a className="btn btn-line" href={`/logg-inn?neste=/leksjoner/${lesson.slug}`}>Jeg har allerede tilgang</a>}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <Nav />
      <LessonPlayer
        lesson={lesson}
        total={LESSONS.length}
        loggedIn={!!user}
        next={nx ? { slug: nx.slug, title: nx.title, open: !!nx.free || active } : null}
      />
    </>
  );
}

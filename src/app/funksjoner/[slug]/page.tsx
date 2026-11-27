import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FunctionDemo from '@/components/FunctionDemo';
import { CATALOG } from '@/lib/engine/functions';
import { EXAMPLES } from '@/content/functionExamples';
import { fnSlug, fnBySlug, fnByEnglishSlug } from '@/content/fnSlug';
import { LESSONS } from '@/content/lessons';

type P = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATALOG.map(f => ({ slug: fnSlug(f.no) }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const f = fnBySlug((await params).slug);
  if (!f) return {};
  const same = f.no === f.en;
  return {
    title: same ? `${f.no} i Excel på norsk – forklaring og eksempel` : `${f.no} i Excel (${f.en} på norsk) – forklaring og eksempel`,
    description: `${same ? `${f.no}` : `${f.en} heter ${f.no} i norsk Excel.`} ${f.desc} Se syntaks og prøv et eksempel med norske semikolon direkte i nettleseren.`,
    alternates: { canonical: `/funksjoner/${fnSlug(f.no)}` },
  };
}

function lessonFor(no: string) {
  return LESSONS.find(l => l.tasks.some(t => (t.mustUse ?? []).includes(no)));
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const f = fnBySlug(slug);
  if (!f) {
    const en = fnByEnglishSlug(slug);
    if (en) permanentRedirect(`/funksjoner/${fnSlug(en.no)}`);
    notFound();
  }
  const ex = EXAMPLES[f.no];
  const same = f.no === f.en;
  const lesson = lessonFor(f.no);
  const related = CATALOG.filter(o => o.cat === f.cat && o.no !== f.no).slice(0, 8);
  return (
    <>
      <Nav />
      <main className="wrap" style={{ paddingTop: 20, paddingBottom: 88 }}>
        <nav className="small muted" style={{ marginBottom: 14 }}>
          <a href="/funksjoner" style={{ color: 'inherit' }}>Funksjoner</a> / <a href={`/funksjoner#${f.cat}`} style={{ color: 'inherit' }}>{f.cat}</a>
        </nav>
        <div className="grid2" style={{ alignItems: 'start', gap: 40 }}>
          <div>
            <div className="eyebrow">{f.cat}</div>
            <h1 className="h2" style={{ marginTop: 8 }}>{f.no} i Excel</h1>
            <p className="lead" style={{ marginTop: 14 }}>
              {same ? <>{f.no} heter det samme i norsk og engelsk Excel.</> : <><b>{f.en}</b> heter <b>{f.no}</b> i norsk Excel.</>} {f.desc}
            </p>
            <div className="label" style={{ marginTop: 26 }}>Syntaks</div>
            <p style={{ margin: '8px 0 0' }}><code style={{ fontSize: 15, padding: '6px 10px', whiteSpace: 'normal' }}>={f.syntax}</code></p>
            <p className="small muted" style={{ marginTop: 10 }}>Argumenter i klammeparentes er valgfrie. Norsk Excel skiller argumentene med semikolon, ikke komma.</p>
            {ex.tips && ex.tips.length > 0 && (
              <>
                <div className="label" style={{ marginTop: 26 }}>Verdt å vite</div>
                <ul style={{ color: 'var(--body)', paddingLeft: 20, marginTop: 8 }}>{ex.tips.map(t => <li key={t} style={{ margin: '6px 0' }}>{t}</li>)}</ul>
              </>
            )}
          </div>
          <div>
            <div className="label">Eksempel</div>
            <p style={{ margin: '8px 0 14px', color: 'var(--body)' }}>{ex.text} Formelen i {ex.at}: <code>{ex.formula}</code></p>
            <FunctionDemo cells={ex.cells} at={ex.at} formula={ex.formula} formats={ex.formats} widths={ex.widths} />
          </div>
        </div>

        <div className="card" style={{ marginTop: 48, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--ink)', color: 'var(--paper)', borderColor: 'transparent' }}>
          <div style={{ maxWidth: 620 }}>
            <h2 className="h3" style={{ fontSize: 26 }}>{lesson ? `Øv på ${f.no} med oppgaver som rettes med en gang.` : 'Lær Excel på norsk med oppgaver som rettes med en gang.'}</h2>
            <p style={{ color: '#C9D3CC', margin: '8px 0 0' }}>{lesson ? `Leksjonen «${lesson.title}» har ${lesson.tasks.length} oppgaver i et ekte regneark.` : `${LESSONS.length} leksjoner fra første formel til FINN.RAD og ferdige prosjekter.`} De tre første leksjonene er gratis.</p>
          </div>
          <a className="btn btn-sig" href={lesson ? `/leksjoner/${lesson.slug}` : '/leksjoner/din-forste-formel'}>{lesson ? `Øv på ${f.no}` : 'Start gratis'}</a>
        </div>

        {!same && (
          <section style={{ marginTop: 48, maxWidth: 760 }}>
            <h2 className="h3">Hva heter {f.en} på norsk?</h2>
            <p style={{ color: 'var(--body)' }}>
              I Excel med norsk språk heter {f.en} <b>{f.no}</b>. Formelen skrives <code>={f.syntax.split('(')[0]}(…)</code> med semikolon mellom argumentene. Skriver du det engelske navnet i norsk Excel, får du <code>#NAVN?</code>.
              {f.aliases.length > 0 && <> Du kan også møte navnet {f.aliases.join(' og ')}.</>}
            </p>
          </section>
        )}

        <section style={{ marginTop: 40 }}>
          <h2 className="h3">Andre funksjoner i {f.cat.toLowerCase()}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {related.map(o => <a key={o.no} href={`/funksjoner/${fnSlug(o.no)}`} className="pill gray" style={{ textDecoration: 'none', fontFamily: 'var(--f-mono)' }}>{o.no}</a>)}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

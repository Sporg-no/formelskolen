'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SheetView from '@/components/sheet/SheetView';
import Prose from '@/components/Prose';
import { Sheet } from '@/lib/engine/sheet';
import { gradeTask, taskCells, expand, type GradeResult } from '@/lib/engine/grade';
import { shiftFormula } from '@/lib/engine/sheet';
import { parseAddr } from '@/lib/engine/core';
import { expandFormats, type Lesson } from '@/content/types';
import { loadSheet, saveSheet, clearSheet, markDoneLocal, syncDone } from '@/lib/progress';

type Props = {
  lesson: Lesson & { nr: number };
  total: number;
  loggedIn: boolean;
  next: { slug: string; title: string; open: boolean } | null;
};

export default function LessonPlayer({ lesson, total, loggedIn, next }: Props) {
  const formats = useMemo(() => expandFormats(lesson.formats), [lesson]);
  const fixed = useMemo(() => expand(lesson.fixed ?? []), [lesson]);
  const [sheet, setSheet] = useState(() => new Sheet(lesson.cells));
  const [results, setResults] = useState<GradeResult[]>(() => lesson.tasks.map(() => ({ ok: false, message: '' })));
  const [feedback, setFeedback] = useState<{ i: number; text: string } | null>(null);
  const [hint, setHint] = useState<Record<number, 'hint' | 'solution'>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);
  const doneOnce = useRef(false);

  const grade = useCallback((s: Sheet) => lesson.tasks.map(t => gradeTask(s, t, fixed)), [lesson, fixed]);

  // Hent lagret arbeid
  useEffect(() => {
    const saved = loadSheet(lesson.slug);
    const s = new Sheet({ ...lesson.cells, ...(saved ?? {}) });
    if (saved) for (const k of Object.keys(lesson.cells)) if (!(k in saved)) s.set(k, lesson.cells[k]);
    setSheet(s);
    setResults(grade(s));
    setSheetKey(k => k + 1);
  }, [lesson, grade]);

  const current = results.findIndex(r => !r.ok);
  const allDone = current === -1;

  useEffect(() => {
    if (!allDone || doneOnce.current) return;
    doneOnce.current = true;
    markDoneLocal(lesson.slug);
    if (loggedIn) syncDone([lesson.slug]);
  }, [allDone, lesson.slug, loggedIn]);

  const onChange = (changed: string[]) => {
    saveSheet(lesson.slug, sheet.toJSON());
    const r = grade(sheet);
    setResults(r);
    const set = new Set(changed);
    const touched = lesson.tasks.findIndex((t, i) => !r[i].ok && taskCells(t).some(c => set.has(c)));
    if (touched >= 0) {
      const all = taskCells(lesson.tasks[touched]);
      const filled = all.filter(c => sheet.getRaw(c) !== '').length;
      // Ved utfylling av flere celler venter vi med feilmeldingen til cellene er fylt
      if (all.length === 1 || filled === all.length || !r[touched].message.includes('er tom')) setFeedback({ i: touched, text: r[touched].message });
    } else setFeedback(null);
  };

  const insertSolution = (i: number) => {
    const t = lesson.tasks[i];
    const cells = taskCells(t);
    const first = parseAddr(cells[0])!;
    const ch: Record<string, string> = {};
    for (const c of cells) { const p = parseAddr(c)!; ch[c] = shiftFormula(t.solution, p.col - first.col, p.row - first.row); }
    sheet.setMany(ch);
    setSheetKey(k => k + 1);
    onChange(cells);
  };

  const reset = () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 4000); return; }
    clearSheet(lesson.slug);
    const s = new Sheet(lesson.cells);
    setSheet(s);
    setResults(grade(s));
    setFeedback(null);
    setHint({});
    setConfirmReset(false);
    setSheetKey(k => k + 1);
  };

  // Hold aktiv oppgave synlig i panelet (bare når panelet står ved siden av arket)
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1081px)').matches) return;
    const el = panelRef.current?.querySelector(allDone ? '.donebox' : '.task.cur') as HTMLElement | null;
    if (!el || !panelRef.current) return;
    const pr = panelRef.current.getBoundingClientRect(), er = el.getBoundingClientRect();
    if (er.bottom > pr.bottom || er.top < pr.top) panelRef.current.scrollTo({ top: panelRef.current.scrollTop + er.top - pr.top - 80, behavior: 'smooth' });
  }, [current, allDone]);

  const targets = current >= 0 ? [{ spec: lesson.tasks[current].cell, ok: false }] : [];
  const doneCount = results.filter(r => r.ok).length;

  return (
    <div className="lesson wrap">
      <aside className="lpanel" ref={panelRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow">Leksjon {lesson.nr} av {total} · {lesson.module}</span>
        </div>
        <h1>{lesson.title}</h1>
        <Prose text={lesson.intro} />

        <div className="tasks" aria-live="polite">
          {lesson.tasks.map((t, i) => {
            const st = results[i]?.ok ? 'done' : i === current ? 'cur' : 'todo';
            return (
              <div key={i} className={`task ${st}`}>
                <div className="task-head">
                  <div className="task-dot">{results[i]?.ok ? '✓' : i + 1}</div>
                  <div>
                    <div className="task-cell">{t.cell}</div>
                    <p>{t.prompt}</p>
                  </div>
                </div>
                {st === 'cur' && (
                  <>
                    {feedback?.i === i && feedback.text && <div className="feedback bad">{feedback.text}</div>}
                    {hint[i] && <div className="feedback hint">{hint[i] === 'solution' ? <>Løsning: <code>{t.solution}</code></> : t.hint ?? 'Se forklaringen over.'}</div>}
                    <div className="task-actions">
                      {!hint[i] && <button type="button" className="btn btn-line btn-xs" onClick={() => setHint(h => ({ ...h, [i]: 'hint' }))}>Vis hint</button>}
                      {hint[i] === 'hint' && <button type="button" className="btn btn-line btn-xs" onClick={() => setHint(h => ({ ...h, [i]: 'solution' }))}>Vis løsning</button>}
                      {hint[i] === 'solution' && <button type="button" className="btn btn-line btn-xs" onClick={() => insertSolution(i)}>Sett inn løsningen</button>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="donebox">
            <div className="eyebrow">Fullført</div>
            <h3 style={{ marginTop: 6 }}>Alle oppgavene er riktige.</h3>
            {!loggedIn && <p className="small" style={{ color: '#C9D3CC', margin: '8px 0 0' }}>Fremdriften er lagret i denne nettleseren. <a href={`/logg-inn?neste=/leksjoner/${lesson.slug}`}>Logg inn</a> for å lagre den på kontoen din.</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              {next ? (
                next.open
                  ? <a className="btn btn-sig btn-sm" href={`/leksjoner/${next.slug}`}>Neste: {next.title}</a>
                  : <a className="btn btn-sig btn-sm" href="/priser">Lås opp neste leksjon</a>
              ) : <a className="btn btn-sig btn-sm" href="/min-side">Hent sertifikatet</a>}
              <a className="btn btn-line btn-sm" href="/leksjoner">Alle leksjoner</a>
            </div>
          </div>
        )}
      </aside>

      <section className="lmain">
        <div className="ltop">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
            <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{doneCount} av {lesson.tasks.length} oppgaver</span>
            <div className="progressbar" style={{ flex: 1, maxWidth: 260 }}><div style={{ width: `${(doneCount / lesson.tasks.length) * 100}%` }} /></div>
          </div>
          <button type="button" className="btn btn-ghost btn-xs" onClick={reset}>{confirmReset ? 'Klikk igjen for å tilbakestille' : 'Tilbakestill arket'}</button>
        </div>
        <SheetView
          key={sheetKey}
          sheet={sheet}
          formats={formats}
          widths={lesson.widths}
          bold={lesson.bold}
          targets={targets}
          onChange={onChange}
          initialSelect={current >= 0 ? taskCells(lesson.tasks[current])[0] : 'A1'}
        />
      </section>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { localProgress, onProgress, syncDone } from '@/lib/progress';

type Item = { slug: string; nr: number; title: string; summary: string; minutes: number; free: boolean; module: string };

export default function LessonList({ modules, lessons, server, active, loggedIn }: { modules: string[]; lessons: Item[]; server: string[]; active: boolean; loggedIn: boolean }) {
  const [done, setDone] = useState<Set<string>>(new Set(server));
  useEffect(() => {
    const read = () => setDone(new Set([...server, ...Object.keys(localProgress())]));
    read();
    // Fremdrift fra før innlogging lagres på kontoen
    if (loggedIn) {
      const local = Object.keys(localProgress()).filter(s => !server.includes(s));
      if (local.length) syncDone(local);
    }
    return onProgress(read);
  }, [server, loggedIn]);

  const n = lessons.filter(l => done.has(l.slug)).length;
  const nextUp = lessons.find(l => !done.has(l.slug));
  return (
    <>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="label">Din fremdrift</div>
          <div style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 30, marginTop: 4 }}>{n} av {lessons.length} leksjoner</div>
          <div className="progressbar" style={{ marginTop: 10 }}><div style={{ width: `${(n / lessons.length) * 100}%` }} /></div>
        </div>
        {nextUp && <a className="btn btn-sig" href={`/leksjoner/${nextUp.slug}`}>{n ? 'Fortsett' : 'Start'}: {nextUp.title}</a>}
      </div>
      <div className="modlist">
        {modules.map(m => {
          const list = lessons.filter(l => l.module === m);
          return (
            <div key={m} className="mod">
              <h2>{m} <span>{list.filter(l => done.has(l.slug)).length}/{list.length}</span></h2>
              <div className="lessons">
                {list.map(l => {
                  const open = l.free || active;
                  return (
                    <a key={l.slug} href={`/leksjoner/${l.slug}`} className={`lrow${done.has(l.slug) ? ' done' : ''}`}>
                      <span className="num">{done.has(l.slug) ? '✓' : l.nr}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="t" style={{ display: 'block' }}>{l.title}</span>
                        <span className="s" style={{ display: 'block' }}>{l.summary}</span>
                      </span>
                      <span className="meta">
                        {l.free && !active ? <span className="pill">Gratis</span> : !open ? <span className="lock" aria-label="Låst">🔒</span> : null}
                        <span>{l.minutes} min</span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

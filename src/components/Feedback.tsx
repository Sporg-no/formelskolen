'use client';
import { useState } from 'react';

export default function Feedback({ lesson, label = 'Gi tilbakemelding', prompt, loggedIn, dark }: { lesson?: string; label?: string; prompt?: string; loggedIn?: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [err, setErr] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState('busy'); setErr('');
    const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, email, hp, lesson, page: window.location.pathname }) });
    const j = await r.json().catch(() => ({}));
    if (j.ok) { setState('sent'); return; }
    setState('idle'); setErr(j.error || 'Noe gikk galt.');
  }

  if (state === 'sent') return <div className="ok">Takk. Tilbakemeldingen er sendt.</div>;
  if (!open) return <button type="button" className={dark ? 'linkbtn' : 'btn btn-ghost btn-xs'} style={dark ? { color: '#8BE0B0' } : undefined} onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <label className="label" htmlFor="fb" style={dark ? { color: '#A9B6AE' } : undefined}>{prompt ?? 'Hva var uklart, vanskelig eller irriterende?'}</label>
      <textarea id="fb" className="input" style={{ height: 96, padding: 12, resize: 'vertical', color: 'var(--ink)' }} maxLength={2000} required value={msg} onChange={e => setMsg(e.target.value)} />
      {!loggedIn && <input className="input" type="email" placeholder="E-post (valgfritt, hvis du vil ha svar)" value={email} onChange={e => setEmail(e.target.value)} style={{ color: 'var(--ink)' }} />}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={e => setHp(e.target.value)} style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
      {err && <div className="err">{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-sig btn-sm" disabled={state === 'busy' || msg.trim().length < 2}>{state === 'busy' ? 'Sender …' : 'Send'}</button>
        <button type="button" className="btn btn-ghost btn-sm" style={dark ? { color: '#DCE4DE' } : undefined} onClick={() => setOpen(false)}>Avbryt</button>
      </div>
    </form>
  );
}

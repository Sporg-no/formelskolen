'use client';
import { useState } from 'react';

export default function ClassForm({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/klasse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (j.ok) { window.location.href = '/leksjoner'; return; }
    setErr(j.error || 'Noe gikk galt.');
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field">
        <label htmlFor="kode" className="label">Klassekode</label>
        <input id="kode" className="input code" autoComplete="off" autoCapitalize="characters" maxLength={12} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
      </div>
      {err && <div className="err">{err}</div>}
      <button className="btn btn-sig btn-block" disabled={busy || code.length < 4}>{busy ? 'Sjekker …' : 'Start med klassen'}</button>
    </form>
  );
}

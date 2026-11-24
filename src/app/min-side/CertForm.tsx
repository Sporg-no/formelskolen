'use client';
import { useState } from 'react';

export default function CertForm({ initial }: { initial?: string }) {
  const [name, setName] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/certificate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (j.id) { window.location.href = `/sertifikat/${j.id}`; return; }
    setErr(j.error || 'Noe gikk galt.');
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }}>
      <div className="field">
        <label htmlFor="nm" className="label">Navn på sertifikatet</label>
        <input id="nm" className="input" required minLength={3} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Fornavn Etternavn" />
      </div>
      {err && <div className="err">{err}</div>}
      <button className="btn btn-sig" disabled={busy}>{busy ? 'Lager …' : initial ? 'Oppdater navnet' : 'Lag sertifikatet'}</button>
    </form>
  );
}

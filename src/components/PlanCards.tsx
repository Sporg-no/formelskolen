'use client';
import { useState } from 'react';

type Plan = 'maaned' | 'aar' | 'livstid';
const CARDS: { plan: Plan; title: string; price: string; per: string; note: string; tag?: string; points: string[] }[] = [
  { plan: 'maaned', title: 'Måned', price: '199 kr', per: 'per måned', note: 'Si opp når du vil.', points: ['Alle leksjoner og prosjekter', 'Sertifikat når du er ferdig', 'Nye leksjoner fortløpende'] },
  { plan: 'aar', title: 'År', price: '590 kr', per: 'per år', note: 'Tilsvarer 49 kr i måneden.', tag: 'Spar 75 %', points: ['Alt i månedsplanen', '12 måneder tilgang', 'Si opp fornyelsen når du vil'] },
  { plan: 'livstid', title: 'Livstid', price: '1 490 kr', per: 'én gang', note: 'Ingen abonnement.', points: ['Alt innhold for alltid', 'Alle framtidige leksjoner', 'Betal én gang'] },
];

export default function PlanCards({ loggedIn, configured }: { loggedIn: boolean; configured: boolean }) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<Plan | null>(null);
  const [err, setErr] = useState('');

  async function buy(plan: Plan) {
    setErr('');
    if (!loggedIn) { window.location.href = `/logg-inn?neste=${encodeURIComponent(`/priser?plan=${plan}`)}`; return; }
    if (!consent) { setErr('Kryss av for samtykket under før du går videre.'); return; }
    setBusy(plan);
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, consent }) });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setErr(j.error || 'Noe gikk galt. Prøv igjen.');
    } catch { setErr('Fikk ikke kontakt. Sjekk nettet og prøv igjen.'); }
    setBusy(null);
  }

  return (
    <div>
      <div className="prices">
        {CARDS.map(c => (
          <div key={c.plan} className={`pcard${c.tag ? ' best' : ''}`}>
            {c.tag && <span className="tag">{c.tag}</span>}
            <div className="label">{c.title}</div>
            <div className="price">{c.price} <small>{c.per}</small></div>
            <div className="small muted">{c.note}</div>
            <ul>{c.points.map(p => <li key={p}>{p}</li>)}</ul>
            <div className="grow" />
            <button type="button" className={`btn ${c.tag ? 'btn-sig' : 'btn-ink'} btn-block`} disabled={!!busy || !configured} onClick={() => buy(c.plan)}>
              {busy === c.plan ? 'Sender deg til betaling …' : !configured ? 'Åpner snart' : loggedIn ? 'Velg' : 'Logg inn og velg'}
            </button>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 720, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>Jeg vil ha tilgang med en gang, og samtykker til at angreretten faller bort når det digitale innholdet er levert.</span>
        </label>
        {err && <div className="err">{err}</div>}
        <p className="small muted" style={{ margin: 0 }}>Betaling med kort, Apple Pay eller Google Pay via Stripe. Priser inkl. eventuell MVA.</p>
      </div>
    </div>
  );
}

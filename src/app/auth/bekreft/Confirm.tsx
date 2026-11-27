'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Brand } from '@/components/Brand';

function nextFrom(sp: URLSearchParams): string {
  const direct = sp.get('next');
  if (direct && direct.startsWith('/') && !direct.startsWith('//')) return direct;
  const r = sp.get('r');
  if (r) {
    try {
      const n = new URL(r).searchParams.get('next');
      if (n && n.startsWith('/') && !n.startsWith('//')) return n;
    } catch { /* ugyldig adresse */ }
  }
  return '/leksjoner';
}

export default function Confirm() {
  const sp = useSearchParams();
  const tokenHash = sp.get('token_hash');
  const type = (sp.get('type') || 'email') as EmailOtpType;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    if (!tokenHash) return;
    setBusy(true); setErr('');
    const { error } = await supabaseBrowser().auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) { setBusy(false); setErr('Lenken er brukt eller utløpt. Be om en ny innloggingslenke.'); return; }
    window.location.href = nextFrom(new URLSearchParams(window.location.search));
  }

  return (
    <>
      <Brand />
      <h1 style={{ marginTop: 12 }}>Fullfør innloggingen.</h1>
      {tokenHash ? (
        <>
          <p className="lead" style={{ margin: 0, fontSize: 17 }}>Trykk på knappen for å logge inn på Formelskolen.</p>
          {err && <div className="err">{err}</div>}
          <button type="button" className="btn btn-sig btn-block" onClick={go} disabled={busy}>{busy ? 'Logger inn …' : 'Logg inn'}</button>
          {err && <a className="linkbtn" href="/logg-inn">Be om en ny lenke</a>}
        </>
      ) : (
        <>
          <div className="err">Lenken mangler informasjon. Be om en ny innloggingslenke.</div>
          <a className="btn btn-sig btn-block" href="/logg-inn">Til innlogging</a>
        </>
      )}
    </>
  );
}

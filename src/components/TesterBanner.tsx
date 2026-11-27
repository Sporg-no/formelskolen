import { getSession } from '@/lib/access';

// Vises for besøkende uten tilgang så lenge NEXT_PUBLIC_TESTER_CODE er satt i Vercel.
export default async function TesterBanner() {
  const code = process.env.NEXT_PUBLIC_TESTER_CODE;
  if (!code) return null;
  const { active } = await getSession();
  if (active) return null;
  return (
    <div style={{ background: 'var(--sig)', color: '#fff' }}>
      <div className="wrap" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '10px 0', fontSize: 15, textAlign: 'center' }}>
        <span><b>Bli testbruker:</b> én måned gratis med koden <b className="mono">{code}</b>. Begrenset antall plasser.</span>
        <a href="/priser" style={{ color: '#fff', fontWeight: 700 }}>Slik gjør du det →</a>
      </div>
    </div>
  );
}

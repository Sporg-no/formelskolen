import type { Metadata } from 'next';
import { Suspense } from 'react';
import Confirm from './Confirm';

export const metadata: Metadata = { title: 'Fullfør innlogging', robots: { index: false } };

// E-postlenken peker hit i stedet for rett til Supabase. Virusskannere i e-post (f.eks. Microsoft 365)
// åpner lenker automatisk og ville ellers brukt opp engangslenken før brukeren rekker å trykke.
export default function Page() {
  return (
    <div className="formwrap">
      <div className="formcard">
        <Suspense>
          <Confirm />
        </Suspense>
      </div>
    </div>
  );
}

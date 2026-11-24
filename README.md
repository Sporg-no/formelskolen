# Formelskolen

Interaktive Excel-leksjoner på norsk. Next.js 15 + Supabase + Stripe, kjører på Vercel (arn1).

- `src/lib/engine/` – formelmotoren: norske og engelske funksjonsnavn, semikolon, desimalkomma, datoer, oppslag. Retteren (`grade.ts`) endrer tallene i arket for å avsløre hardkodede svar.
- `src/content/` – leksjonene. Legg til en leksjon i `lessons-a.ts`/`lessons-b.ts`; `npm test` sjekker at fasitene består.
- `supabase/migrations/0001_init.sql` – tabeller og RLS.

## Stripe-webhook
Endepunkt: `https://<domene>/api/stripe/webhook`
Hendelser: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`.

## Kommandoer
`npm run dev` · `npm test` · `npm run build` · `/api/health` viser hvilke miljøvariabler som mangler.

import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter-tight/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './globals.css';
import { siteUrl } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'Formelskolen – lær Excel på norsk', template: '%s · Formelskolen' },
  description: 'Interaktive Excel-oppgaver på norsk. Øv på SUMMER, HVIS, FINN.RAD og over 80 andre funksjoner i et ekte regneark i nettleseren. Start gratis uten innlogging.',
  openGraph: { type: 'website', locale: 'nb_NO', siteName: 'Formelskolen' },
};
export const viewport: Viewport = { themeColor: '#10201A', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  );
}

import { Brand } from '@/components/Brand';
import { getSession } from '@/lib/access';

export default async function Nav({ dark = false }: { dark?: boolean }) {
  const { user, active, klasse } = await getSession();
  return (
    <div className={dark ? 'dark' : undefined}>
      <nav className="nav wrap">
        <Brand />
        <div className="nav-links">
          <a href="/leksjoner" className="hide-sm">Leksjoner</a>
          <a href="/funksjoner" className="hide-sm">Funksjoner</a>
          {!active && <a href="/priser" className="hide-sm">Priser</a>}
          {klasse && !user && <a href="/klasse" className="hide-sm">Klasse: {klasse.school}</a>}
          {user
            ? <a href="/min-side" className="btn btn-line btn-sm">Min side</a>
            : <a href="/logg-inn" className="hide-sm">Logg inn</a>}
          {!user && !klasse && <a href="/leksjoner/din-forste-formel" className="btn btn-sig btn-sm">Start gratis</a>}
        </div>
      </nav>
    </div>
  );
}

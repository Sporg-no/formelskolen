import { CONTACT, SELLER } from '@/lib/env';

export default function Footer() {
  return (
    <footer className="dark">
      <div className="footer wrap">
        <div>
          <a href="/leksjoner">Leksjoner</a>
          <a href="/funksjoner">Norske funksjonsnavn</a>
          <a href="/priser">Priser</a>
          <a href="/bedrift">Skoler og bedrifter</a>
          <a href="/vilkar">Vilkår</a>
          <a href="/personvern">Personvern</a>
        </div>
        <div>© {new Date().getFullYear()} Formelskolen · {SELLER} · <a href={`mailto:${CONTACT}`} style={{ marginRight: 0 }}>{CONTACT}</a></div>
      </div>
      <div className="wrap small" style={{ color: '#7F8C84', paddingBottom: 32 }}>
        Excel er et varemerke for Microsoft Corporation. Formelskolen har ingen tilknytning til Microsoft.
      </div>
    </footer>
  );
}

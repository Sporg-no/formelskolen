import Nav from '@/components/Nav';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="wrap center" style={{ paddingTop: 80, paddingBottom: 120 }}>
        <div className="mono" style={{ fontSize: 48, color: 'var(--bad)', fontWeight: 700 }}>#REF!</div>
        <h1 className="h2">Siden finnes ikke.</h1>
        <p className="lead" style={{ margin: '16px auto 28px' }}>Referansen peker på en celle som er slettet.</p>
        <a className="btn btn-sig" href="/leksjoner">Til leksjonene</a>
      </main>
    </>
  );
}

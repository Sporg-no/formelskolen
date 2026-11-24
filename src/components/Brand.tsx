export function Brand({ href = '/' }: { href?: string }) {
  return (
    <a href={href} className="brand" aria-label="Formelskolen, til forsiden">
      <span className="brand-mark" aria-hidden>fx</span>
      Formelskolen
    </a>
  );
}

import { Fragment, type ReactNode } from 'react';

/** Minimal markdown: `kode`, **fet**, avsnitt og punktlister. Nok for leksjonstekstene. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const t = m[0];
    out.push(t.startsWith('`') ? <code key={i++}>{t.slice(1, -1)}</code> : <b key={i++}>{t.slice(2, -2)}</b>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return out;
}

export default function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every(l => /^(- |\d+\. )/.test(l.trim()))) {
          const ordered = /^\d+\./.test(lines[0].trim());
          const items = lines.map((l, j) => <li key={j}>{inline(l.trim().replace(/^(- |\d+\. )/, ''))}</li>);
          return ordered ? <ol key={i} style={{ margin: '10px 0 0', paddingLeft: 20 }}>{items}</ol> : <ul key={i}>{items}</ul>;
        }
        const head = lines.filter(l => !/^(- |\d+\. )/.test(l.trim()));
        const list = lines.filter(l => /^(- |\d+\. )/.test(l.trim()));
        if (head.length === 1 && /^`[^`]+`$/.test(head[0].trim()) && !list.length) return <p key={i} className="codeline">{inline(head[0].trim())}</p>;
        return (
          <Fragment key={i}>
            <p>{inline(head.join(' '))}</p>
            {list.length > 0 && <ul>{list.map((l, j) => <li key={j}>{inline(l.trim().replace(/^- /, ''))}</li>)}</ul>}
          </Fragment>
        );
      })}
    </div>
  );
}

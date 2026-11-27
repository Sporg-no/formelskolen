'use client';
import { useMemo, useState } from 'react';
import SheetView from '@/components/sheet/SheetView';
import { Sheet } from '@/lib/engine/sheet';
import { expandFormats } from '@/content/types';
import type { CellFormat } from '@/lib/engine/format';

type Props = { cells: Record<string, string>; at: string; formula: string; formats?: Record<string, CellFormat>; widths?: Record<string, number> };

export default function FunctionDemo({ cells, at, formula, formats, widths }: Props) {
  const [key, setKey] = useState(0);
  const sheet = useMemo(() => new Sheet({ ...cells, [at]: formula }), [cells, at, formula, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const fmt = useMemo(() => expandFormats(formats), [formats]);
  return (
    <div>
      <SheetView key={key} sheet={sheet} formats={fmt} widths={{ A: 120, B: 110, C: 110, D: 110, ...widths }} bold={[1]} minCols={4} minRows={8} compact initialSelect={at} targets={[{ spec: at, ok: true }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <span className="small muted">Klikk på {at} for å se formelen. Endre tallene, så regnes svaret ut på nytt.</span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => setKey(k => k + 1)}>Tilbakestill</button>
      </div>
    </div>
  );
}

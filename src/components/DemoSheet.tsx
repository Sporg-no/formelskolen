'use client';
import { useMemo, useState } from 'react';
import SheetView from '@/components/sheet/SheetView';
import { Sheet } from '@/lib/engine/sheet';
import { gradeTask } from '@/lib/engine/grade';
import { expandFormats } from '@/content/types';

const CELLS = { A1: 'Måned', B1: 'Strøm', A2: 'Januar', B2: '3 010', A3: 'Februar', B3: '2 574', A4: 'Mars', B4: '1 892', A5: 'Sum' };
const TASK = { cell: 'B5', solution: '=SUMMER(B2:B4)', prompt: '', mustUse: ['SUMMER'] };

export default function DemoSheet() {
  const sheet = useMemo(() => new Sheet(CELLS), []);
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState('');
  const formats = useMemo(() => expandFormats({ 'B2:B5': 'kr' }), []);
  return (
    <div className="demo">
      <div className="demo-task">
        <span className={`task-dot`} style={ok ? { background: 'var(--sig)', borderColor: 'var(--sig)', color: '#fff' } : { borderColor: 'var(--sig)', color: 'var(--sig-ink)' }}>{ok ? '✓' : '1'}</span>
        <span>{ok ? <b>Riktig. Slik fungerer alle oppgavene.</b> : <>Prøv selv: skriv <code>=SUMMER(B2:B4)</code> i B5 og trykk Enter.</>}</span>
      </div>
      <SheetView
        sheet={sheet}
        formats={formats}
        widths={{ A: 110, B: 110 }}
        bold={[1, 5]}
        minCols={4}
        minRows={7}
        compact
        initialSelect="B5"
        targets={[{ spec: 'B5', ok }]}
        onChange={() => { const r = gradeTask(sheet, TASK); setOk(r.ok); setMsg(r.ok ? '' : r.message); }}
      />
      {msg && <div className="feedback bad">{msg}</div>}
    </div>
  );
}

import type { Task } from '@/lib/engine/grade';
import type { CellFormat } from '@/lib/engine/format';
import { addrName, parseAddr } from '@/lib/engine/core';

export type Lesson = {
  slug: string;
  title: string;
  module: string;
  free?: boolean;
  minutes: number;
  /** Kort beskrivelse til lister og søk. */
  summary: string;
  /** Forklaring. Avsnitt skilles med tom linje. `kode`, **fet**, linjer som starter med «- » blir punkter. */
  intro: string;
  cells: Record<string, string>;
  formats?: Record<string, CellFormat>;
  widths?: Record<string, number>;
  /** Rader med fet skrift (1-basert), typisk overskriftsrader. */
  bold?: number[];
  /** Celler som retteren ikke skal endre når den tester formlene (nøkler, terskler). */
  fixed?: string[];
  tasks: Task[];
};

/** Fyller inn en tabell fra øverste venstre celle. Tomme strenger hoppes over. */
export function table(topLeft: string, rows: (string | number | null)[][]): Record<string, string> {
  const s = parseAddr(topLeft)!;
  const out: Record<string, string> = {};
  rows.forEach((row, r) => row.forEach((v, c) => {
    if (v === null || v === '') return;
    out[addrName({ col: s.col + c, row: s.row + r })] = typeof v === 'number' ? String(v).replace('.', ',') : v;
  }));
  return out;
}

export function expandFormats(f: Record<string, CellFormat> = {}): Record<string, CellFormat> {
  const out: Record<string, CellFormat> = {};
  for (const [spec, fmt] of Object.entries(f)) {
    const [a, b] = spec.split(':');
    const A = parseAddr(a)!, B = b ? parseAddr(b)! : A;
    for (let r = A.row; r <= B.row; r++) for (let c = A.col; c <= B.col; c++) out[addrName({ col: c, row: r })] = fmt;
  }
  return out;
}

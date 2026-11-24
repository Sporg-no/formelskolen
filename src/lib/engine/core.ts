// Grunntyper for formelmotoren. Norsk Excel: semikolon mellom argumenter, desimalkomma.

export type ErrCode = '#DIV/0!' | '#NAVN?' | '#VERDI!' | '#I/T' | '#REF!' | '#TALL!' | '#SIRKEL!';

export class XlErr {
  constructor(public code: ErrCode) {}
  toString() { return this.code; }
}

/** Kastes inne i evalueringen og fanges til en feilverdi i cellen. */
export class XlThrow extends Error {
  constructor(public code: ErrCode) { super(code); }
}

export type Scalar = number | string | boolean | null | XlErr;
export type Matrix = { kind: 'matrix'; rows: Scalar[][] };
export type Value = Scalar | Matrix;

export const isMatrix = (v: unknown): v is Matrix => typeof v === 'object' && v !== null && (v as Matrix).kind === 'matrix';
export const isErr = (v: unknown): v is XlErr => v instanceof XlErr;
export const fail = (code: ErrCode): never => { throw new XlThrow(code); };
export const matrix = (rows: Scalar[][]): Matrix => ({ kind: 'matrix', rows });

export function flat(v: Value): Scalar[] {
  return isMatrix(v) ? v.rows.flat() : [v];
}

/** Gjør om en matrise til én verdi (øverste venstre celle), slik Excel gjør i en enkeltcelle. */
export function scalar(v: Value): Scalar {
  if (!isMatrix(v)) return v;
  return v.rows[0]?.[0] ?? null;
}

/** Tolker tekst som tall slik en norsk Excel gjør: «1 234,5», «1234.5», «25 %», «-3». */
export function parseNumberText(raw: string): number | null {
  let s = raw.trim().replace(/ /g, ' ');
  if (!s) return null;
  let pct = false;
  if (s.endsWith('%')) { pct = true; s = s.slice(0, -1).trim(); }
  s = s.replace(/^kr\.?\s*/i, '').replace(/\s*(kr|,-)$/i, '');
  if (/^[-+]?\d{1,3}( \d{3})+(,\d+)?$/.test(s)) s = s.replace(/ /g, '');
  if (!/^[-+]?(\d+([.,]\d*)?|[.,]\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return pct ? n / 100 : n;
}

export function toNumber(v: Value): number {
  const s = scalar(v);
  if (isErr(s)) throw new XlThrow(s.code);
  if (s === null) return 0;
  if (typeof s === 'number') return s;
  if (typeof s === 'boolean') return s ? 1 : 0;
  const d = parseDateText(s);
  if (d !== null) return d;
  const n = parseNumberText(s);
  if (n === null) return fail('#VERDI!');
  return n;
}

export function toText(v: Value): string {
  const s = scalar(v);
  if (isErr(s)) throw new XlThrow(s.code);
  if (s === null) return '';
  if (typeof s === 'boolean') return s ? 'SANN' : 'USANN';
  if (typeof s === 'number') return numToText(s);
  return s;
}

/** Tall som tekst uten tusenskille, med desimalkomma (slik =A1&"" gir i norsk Excel). */
export function numToText(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const r = Number(n.toPrecision(15));
  return String(r).replace('.', ',');
}

export function toBool(v: Value): boolean {
  const s = scalar(v);
  if (isErr(s)) throw new XlThrow(s.code);
  if (s === null) return false;
  if (typeof s === 'boolean') return s;
  if (typeof s === 'number') return s !== 0;
  const u = s.toUpperCase();
  if (u === 'SANN' || u === 'TRUE') return true;
  if (u === 'USANN' || u === 'FALSE') return false;
  return fail('#VERDI!');
}

// ---------- Datoer (Excel-serienummer, 1900-systemet) ----------
const EPOCH = Date.UTC(1899, 11, 30);
const DAY = 864e5;

export function dateToSerial(y: number, m: number, d: number): number {
  // Date.UTC håndterer måned/dag utenfor området slik DATO() gjør
  const t = Date.UTC(y, m - 1, d);
  const s = Math.round((t - EPOCH) / DAY);
  // Excels kjente 1900-skuddårsfeil: serienummer under 61 er forskjøvet med én dag
  return s <= 60 ? s - 1 : s;
}

export function serialToDate(serial: number): Date {
  const s = Math.floor(serial);
  const adj = s <= 60 ? s + 1 : s;
  return new Date(EPOCH + adj * DAY);
}

export function parseDateText(s: string): number | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = +m[1], mo = +m[2];
  let y = +m[3];
  if (m[3].length === 2) y += y < 30 ? 2000 : 1900;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const serial = dateToSerial(y, mo, d);
  const back = serialToDate(serial);
  if (back.getUTCDate() !== d) return null;
  return serial;
}

// ---------- Cellereferanser ----------
export type Addr = { col: number; row: number }; // 0-basert

export function colName(c: number): string {
  let s = '';
  c += 1;
  while (c > 0) { const r = (c - 1) % 26; s = String.fromCharCode(65 + r) + s; c = Math.floor((c - 1) / 26); }
  return s;
}
export function colIndex(name: string): number {
  let n = 0;
  for (const ch of name.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
export const addrName = (a: Addr) => `${colName(a.col)}${a.row + 1}`;
export function parseAddr(ref: string): Addr | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { col: colIndex(m[1]), row: Number(m[2]) - 1 };
}

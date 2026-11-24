import {
  XlErr, XlThrow, addrName, colName, colIndex, flat, isErr, isMatrix, matrix, parseAddr, parseDateText, parseNumberText,
  scalar, toNumber, toText, type Matrix, type Scalar, type Value, type Addr,
} from './core';
import { parse, ParseError, type Node } from './parser';
import { lookupFn, type Ev } from './functions';

export type RawCells = Record<string, string>;

/** Tolker det brukeren skriver i en celle som ikke er en formel. */
export function parseInput(raw: string): Scalar {
  if (raw === '') return null;
  if (raw.startsWith("'")) return raw.slice(1);
  const t = raw.trim();
  const up = t.toUpperCase();
  if (up === 'SANN') return true;
  if (up === 'USANN') return false;
  const d = parseDateText(t);
  if (d !== null) return d;
  const tm = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (tm && +tm[1] < 24 && +tm[2] < 60) return (+tm[1] * 60 + +tm[2]) / 1440;
  const n = parseNumberText(t);
  if (n !== null) return n;
  return raw;
}

const rank = (v: Scalar) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : typeof v === 'boolean' ? 2 : 0);

function compare(a: Scalar, b: Scalar): number {
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase().localeCompare(b.toLowerCase(), 'nb');
  const x = Number(a), y = Number(b);
  return x === y ? 0 : x < y ? -1 : 1;
}

function binScalar(op: string, a: Scalar, b: Scalar): Scalar {
  if (isErr(a)) throw new XlThrow(a.code);
  if (isErr(b)) throw new XlThrow(b.code);
  switch (op) {
    case '+': return toNumber(a) + toNumber(b);
    case '-': return toNumber(a) - toNumber(b);
    case '*': return toNumber(a) * toNumber(b);
    case '/': { const d = toNumber(b); const n = toNumber(a); if (d === 0) throw new XlThrow('#DIV/0!'); return n / d; }
    case '^': { const r = Math.pow(toNumber(a), toNumber(b)); if (!Number.isFinite(r)) throw new XlThrow('#TALL!'); return r; }
    case '&': return toText(a) + toText(b);
    case '=': return compare(a, b) === 0;
    case '<>': return compare(a, b) !== 0;
    case '<': return compare(a, b) < 0;
    case '>': return compare(a, b) > 0;
    case '<=': return compare(a, b) <= 0;
    case '>=': return compare(a, b) >= 0;
  }
  throw new XlThrow('#VERDI!');
}

function broadcast(a: Value, b: Value, f: (x: Scalar, y: Scalar) => Scalar): Value {
  if (!isMatrix(a) && !isMatrix(b)) return f(a, b);
  const A = isMatrix(a) ? a.rows : [[a]];
  const B = isMatrix(b) ? b.rows : [[b]];
  const R = Math.max(A.length, B.length), C = Math.max(A[0].length, B[0].length);
  const pick = (M: Scalar[][], r: number, c: number) => M[M.length === 1 ? 0 : r]?.[M[0].length === 1 ? 0 : c] ?? new XlErr('#I/T');
  const rows: Scalar[][] = [];
  for (let r = 0; r < R; r++) {
    const row: Scalar[] = [];
    for (let c = 0; c < C; c++) {
      try { row.push(f(pick(A, r, c), pick(B, r, c))); } catch (e) { if (e instanceof XlThrow) row.push(new XlErr(e.code)); else throw e; }
    }
    rows.push(row);
  }
  return matrix(rows);
}

function mapM(v: Value, f: (x: Scalar) => Scalar): Value {
  if (!isMatrix(v)) return f(v);
  return matrix(v.rows.map(r => r.map(x => { try { return f(x); } catch (e) { if (e instanceof XlThrow) return new XlErr(e.code); throw e; } })));
}

export type CellInfo = { value: Scalar; error?: string };

export class Sheet {
  private raw = new Map<string, string>();
  private cache = new Map<string, CellInfo>();
  private stack = new Set<string>();
  private parsed = new Map<string, Node | ParseError>();
  now: () => Date;

  constructor(cells: RawCells = {}, opts: { now?: () => Date } = {}) {
    for (const [k, v] of Object.entries(cells)) if (v !== '') this.raw.set(k.toUpperCase(), v);
    this.now = opts.now ?? (() => new Date());
  }

  clone(): Sheet {
    const s = new Sheet(this.toJSON(), { now: this.now });
    return s;
  }
  toJSON(): RawCells { return Object.fromEntries(this.raw); }
  getRaw(a: string): string { return this.raw.get(a.toUpperCase()) ?? ''; }
  set(a: string, v: string) {
    const k = a.toUpperCase();
    if (v === '') this.raw.delete(k); else this.raw.set(k, v);
    this.cache.clear();
  }
  setMany(m: RawCells) {
    for (const [k, v] of Object.entries(m)) { const key = k.toUpperCase(); if (v === '') this.raw.delete(key); else this.raw.set(key, v); }
    this.cache.clear();
  }
  isFormula(a: string) { return this.getRaw(a).startsWith('='); }
  keys() { return [...this.raw.keys()]; }
  bounds() {
    let maxR = 0, maxC = 0;
    for (const k of this.raw.keys()) { const p = parseAddr(k)!; maxR = Math.max(maxR, p.row); maxC = Math.max(maxC, p.col); }
    return { maxR, maxC };
  }

  private node(formula: string): Node | ParseError {
    let n = this.parsed.get(formula);
    if (!n) {
      try { n = parse(formula); } catch (e) { n = e instanceof ParseError ? e : new ParseError(String(e)); }
      this.parsed.set(formula, n);
    }
    return n;
  }

  info(a: string): CellInfo {
    const k = a.toUpperCase();
    const hit = this.cache.get(k);
    if (hit) return hit;
    const raw = this.raw.get(k) ?? '';
    let out: CellInfo;
    if (!raw.startsWith('=') || raw === '=') out = { value: parseInput(raw) };
    else if (this.stack.has(k)) return { value: new XlErr('#SIRKEL!'), error: 'Sirkelreferanse: formelen viser til seg selv.' };
    else {
      const n = this.node(raw);
      if (n instanceof ParseError) out = { value: new XlErr('#NAVN?'), error: n.message };
      else {
        this.stack.add(k);
        try {
          const v = scalar(this.evaluate(n));
          out = { value: v };
        } catch (e) {
          if (e instanceof XlThrow) out = { value: new XlErr(e.code) };
          else throw e;
        } finally { this.stack.delete(k); }
      }
    }
    this.cache.set(k, out);
    return out;
  }
  value(a: string): Scalar { return this.info(a).value; }

  /** Evaluerer en formel som om den stod i en celle (brukes av retteren). */
  evalFormula(formula: string): Scalar {
    const n = this.node(formula);
    if (n instanceof ParseError) return new XlErr('#NAVN?');
    try { return scalar(this.evaluate(n)); } catch (e) { if (e instanceof XlThrow) return new XlErr(e.code); throw e; }
  }

  private range(c1: number, r1: number, c2: number, r2: number): Matrix {
    const rows: Scalar[][] = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      const row: Scalar[] = [];
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) row.push(this.value(addrName({ col: c, row: r })));
      rows.push(row);
    }
    return matrix(rows);
  }

  evaluate(n: Node): Value {
    const ev: Ev = { val: x => this.evaluate(x), now: this.now };
    switch (n.t) {
      case 'num': return n.v;
      case 'str': return n.v;
      case 'bool': return n.v;
      case 'errlit': return new XlErr(n.code);
      case 'empty': return null;
      case 'ref': return this.value(addrName({ col: n.col, row: n.row }));
      case 'range': return this.range(n.a.col, n.a.row, n.b.col, n.b.row);
      case 'cols': return this.range(n.c1, 0, n.c2, this.bounds().maxR);
      case 'name': throw new XlThrow('#NAVN?');
      case 'fn': {
        const f = lookupFn(n.name);
        if (!f) throw new XlThrow('#NAVN?');
        return f(n.args, ev);
      }
      case 'un': {
        const v = this.evaluate(n.e);
        return n.op === '-' ? mapM(v, x => -toNumber(x)) : mapM(v, x => toNumber(x));
      }
      case 'pct': return mapM(this.evaluate(n.e), x => toNumber(x) / 100);
      case 'bin': {
        const l = this.evaluate(n.l), r = this.evaluate(n.r);
        return broadcast(l, r, (x, y) => binScalar(n.op, x, y));
      }
    }
  }
}

// ---------- Kopiering av formler (relative referanser) ----------
const REF_AT = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9_.(ÆØÅæøå])/;
const COLS_AT = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})(?![A-Za-z0-9_.(ÆØÅæøå])/;

/** Flytter relative referanser i en formel, slik Excel gjør når du kopierer eller fyller ned. */
export function shiftFormula(formula: string, dc: number, dr: number): string {
  if (!formula.startsWith('=')) return formula;
  let out = '', i = 0;
  const s = formula;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"') {
      const j = s.indexOf('"', i + 1);
      let end = j < 0 ? s.length : j + 1;
      while (end < s.length && s[end] === '"') { const k = s.indexOf('"', end + 1); end = k < 0 ? s.length : k + 1; }
      out += s.slice(i, end); i = end; continue;
    }
    const prev = i > 0 ? s[i - 1] : '';
    if (!/[A-Za-z0-9_.ÆØÅæøå$]/.test(prev)) {
      const rest = s.slice(i);
      let m = COLS_AT.exec(rest);
      if (m) {
        const c1 = m[1] ? colIndex(m[2]) : colIndex(m[2]) + dc;
        const c2 = m[3] ? colIndex(m[4]) : colIndex(m[4]) + dc;
        out += c1 < 0 || c2 < 0 ? '#REF!' : `${m[1]}${colName(c1)}:${m[3]}${colName(c2)}`;
        i += m[0].length; continue;
      }
      m = REF_AT.exec(rest);
      if (m) {
        const c = m[1] ? colIndex(m[2]) : colIndex(m[2]) + dc;
        const r = m[3] ? Number(m[4]) : Number(m[4]) + dr;
        out += c < 0 || r < 1 ? '#REF!' : `${m[1]}${colName(c)}${m[3]}${r}`;
        i += m[0].length; continue;
      }
    }
    out += ch; i++;
  }
  return out;
}

/** Cellene en formel viser til (for fargemarkering i rutenettet). */
export function referencedRanges(formula: string): { c1: number; r1: number; c2: number; r2: number }[] {
  if (!formula.startsWith('=')) return [];
  const out: { c1: number; r1: number; c2: number; r2: number }[] = [];
  const s = formula.replace(/"(?:[^"]|"")*"/g, m => ' '.repeat(m.length));
  const re = /(?<![A-Za-z0-9_.ÆØÅæøå$])\$?([A-Za-z]{1,3})\$?(\d+)(?::\$?([A-Za-z]{1,3})\$?(\d+))?(?![A-Za-z0-9_.(ÆØÅæøå])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const c1 = colIndex(m[1]), r1 = Number(m[2]) - 1;
    const c2 = m[3] ? colIndex(m[3]) : c1, r2 = m[4] ? Number(m[4]) - 1 : r1;
    out.push({ c1: Math.min(c1, c2), r1: Math.min(r1, r2), c2: Math.max(c1, c2), r2: Math.max(r1, r2) });
  }
  return out;
}

export { flat, parseAddr, addrName, colName, type Addr };

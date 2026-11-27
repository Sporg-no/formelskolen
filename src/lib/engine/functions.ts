import {
  XlErr, XlThrow, fail, flat, isErr, isMatrix, matrix, parseNumberText, parseDateText, scalar,
  toBool, toNumber, toText, dateToSerial, serialToDate, numToText,
  type Matrix, type Scalar, type Value,
} from './core';
import { formatCode } from './format';
import type { Node } from './parser';

export interface Ev {
  val(n: Node): Value;
  now(): Date;
}

type Impl = (args: Node[], ev: Ev) => Value;
export type Category = 'Matte' | 'Statistikk' | 'Logikk' | 'Oppslag' | 'Tekst' | 'Dato' | 'Økonomi' | 'Info';
export type FnMeta = { no: string; en: string; cat: Category; syntax: string; desc: string; aliases: string[] };

const REG = new Map<string, Impl>();
export const CATALOG: FnMeta[] = [];

function def(no: string, en: string, cat: Category, syntax: string, desc: string, impl: Impl, extra: string[] = []) {
  const aliases = [no, en, ...extra];
  aliases.forEach(a => REG.set(a.toUpperCase(), impl));
  CATALOG.push({ no, en, cat, syntax, desc, aliases: extra });
}

export function lookupFn(name: string): Impl | undefined {
  return REG.get(name.toUpperCase().replace(/^_XLFN\./, ''));
}

// ---------- hjelpere ----------
const isRangeNode = (n: Node) => n.t === 'range' || n.t === 'cols';
const argc = (args: Node[], min: number, max = min) => {
  if (args.length < min || args.length > max) fail('#VERDI!');
};
const opt = (args: Node[], i: number) => (args[i] && args[i].t !== 'empty' ? args[i] : undefined);

/** Tall fra argumentene slik SUMMER/GJENNOMSNITT gjør: i områder telles bare tall, direkte verdier tolkes. */
function numbers(args: Node[], ev: Ev): number[] {
  const out: number[] = [];
  for (const a of args) {
    if (a.t === 'empty') continue;
    const v = ev.val(a);
    if (isMatrix(v) || isRangeNode(a)) {
      for (const s of flat(v)) {
        if (isErr(s)) throw new XlThrow(s.code);
        if (typeof s === 'number') out.push(s);
      }
    } else {
      if (isErr(v)) throw new XlThrow(v.code);
      if (v === null) continue;
      out.push(toNumber(v));
    }
  }
  return out;
}

function rowsOf(v: Value): Scalar[][] {
  return isMatrix(v) ? v.rows : [[v]];
}

function rnd(n: number, d: number, mode: 'n' | 'u' | 'd') {
  const f = Math.pow(10, d);
  const x = Number((Math.abs(n) * f).toPrecision(15));
  const r = mode === 'n' ? Math.round(x) : mode === 'u' ? Math.ceil(x) : Math.floor(x);
  return Math.sign(n) * r / f;
}

const eq = (a: Scalar, b: Scalar) => {
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase() === b.toLowerCase();
  if (a === null) return b === '' || b === null;
  if (b === null) return a === '';
  return a === b;
};

function wildcardRe(pat: string) {
  let re = '';
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === '~' && i + 1 < pat.length) { re += pat[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); continue; }
    if (c === '*') re += '.*';
    else if (c === '?') re += '.';
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

/** Lager en testfunksjon for vilkår i ANTALL.HVIS, SUMMERHVIS osv. */
export function criterion(c: Scalar): (v: Scalar) => boolean {
  if (isErr(c)) throw new XlThrow(c.code);
  if (typeof c === 'number' || typeof c === 'boolean') return v => v === c || (typeof v === 'string' && parseNumberText(v) === c);
  const s = c ?? '';
  const m = /^(<=|>=|<>|=|<|>)?(.*)$/s.exec(s)!;
  const op = m[1] || '=';
  const rest = m[2];
  const num = parseDateText(rest) ?? parseNumberText(rest);
  const isNum = num !== null && rest.trim() !== '';
  if (rest === '') {
    if (op === '=') return v => v === null || v === '';
    if (op === '<>') return v => v !== null && v !== '';
  }
  if (isNum) {
    const n = num as number;
    return v => {
      if (typeof v !== 'number') return op === '<>' ? true : false;
      switch (op) {
        case '=': return v === n;
        case '<>': return v !== n;
        case '<': return v < n;
        case '>': return v > n;
        case '<=': return v <= n;
        default: return v >= n;
      }
    };
  }
  const re = wildcardRe(rest);
  const low = rest.toLowerCase();
  return v => {
    const t = v === null ? '' : typeof v === 'string' ? v : null;
    if (op === '=') return t !== null && re.test(t);
    if (op === '<>') return t === null || !re.test(t);
    if (t === null) return false;
    const cmp = t.toLowerCase().localeCompare(low, 'nb');
    return op === '<' ? cmp < 0 : op === '>' ? cmp > 0 : op === '<=' ? cmp <= 0 : cmp >= 0;
  };
}

/** Celler som oppfyller alle vilkårspar (område1; vilkår1; område2; vilkår2 …). */
function maskFor(pairs: Node[], ev: Ev, shape?: Scalar[][]): boolean[] {
  let mask: boolean[] | null = null;
  for (let i = 0; i < pairs.length; i += 2) {
    const range = flat(ev.val(pairs[i]));
    if (shape && range.length !== shape.flat().length) fail('#VERDI!');
    const test = criterion(scalar(ev.val(pairs[i + 1])));
    const m = range.map(test);
    if (mask && m.length !== mask.length) fail('#VERDI!');
    mask = mask ? mask.map((b, j) => b && m[j]) : m;
  }
  return mask ?? [];
}

function compareForSort(a: Scalar, b: Scalar): number {
  const rank = (v: Scalar) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : typeof v === 'boolean' ? 2 : 3);
  const ra = rank(a), rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a.toLowerCase().localeCompare(b.toLowerCase(), 'nb');
  return 0;
}

function matchIndex(needle: Scalar, list: Scalar[], mode: number): number {
  if (mode === 0) {
    const re = typeof needle === 'string' && /[*?~]/.test(needle) ? wildcardRe(needle) : null;
    return list.findIndex(v => (re && typeof v === 'string' ? re.test(v) : eq(v, needle)));
  }
  let best = -1;
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    if (v === null) continue;
    const c = compareForSort(v, needle);
    if (mode > 0 ? c <= 0 : c >= 0) best = i;
    else if (mode > 0) break;
  }
  return best;
}

const serialNow = (ev: Ev) => {
  const d = ev.now();
  return dateToSerial(d.getFullYear(), d.getMonth() + 1, d.getDate());
};
const ymd = (serial: number) => {
  const d = serialToDate(serial);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay() };
};
const isoWeek = (serial: number) => {
  const d = serialToDate(serial);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 864e5 + 1) / 7);
};
function holidaysSet(args: Node[], i: number, ev: Ev): Set<number> {
  const n = opt(args, i);
  if (!n) return new Set();
  return new Set(flat(ev.val(n)).filter((v): v is number => typeof v === 'number').map(Math.floor));
}
const isWorkday = (s: number, hol: Set<number>) => { const wd = ymd(s).wd; return wd !== 0 && wd !== 6 && !hol.has(s); };

// ---------- Matte ----------
def('SUMMER', 'SUM', 'Matte', 'SUMMER(tall1; [tall2]; …)', 'Legger sammen tall og områder.', (a, ev) => numbers(a, ev).reduce((s, n) => s + n, 0));
def('PRODUKT', 'PRODUCT', 'Matte', 'PRODUKT(tall1; [tall2]; …)', 'Ganger sammen alle tallene.', (a, ev) => numbers(a, ev).reduce((s, n) => s * n, 1));
def('SUMMERPRODUKT', 'SUMPRODUCT', 'Matte', 'SUMMERPRODUKT(matrise1; [matrise2]; …)', 'Ganger områdene element for element og summerer.', (a, ev) => {
  if (!a.length) fail('#VERDI!');
  const arrs = a.map(n => flat(ev.val(n)));
  const len = arrs[0].length;
  if (arrs.some(x => x.length !== len)) fail('#VERDI!');
  let s = 0;
  for (let i = 0; i < len; i++) {
    let p = 1;
    for (const arr of arrs) {
      const v = arr[i];
      if (isErr(v)) throw new XlThrow(v.code);
      p *= typeof v === 'number' ? v : typeof v === 'boolean' && arrs.length === 1 ? (v ? 1 : 0) : typeof v === 'boolean' ? (v ? 1 : 0) : 0;
    }
    s += p;
  }
  return s;
});
def('AVRUND', 'ROUND', 'Matte', 'AVRUND(tall; antall_sifre)', 'Runder av til gitt antall desimaler.', (a, ev) => { argc(a, 2); return rnd(toNumber(ev.val(a[0])), toNumber(ev.val(a[1])), 'n'); });
def('AVRUND.OPP', 'ROUNDUP', 'Matte', 'AVRUND.OPP(tall; antall_sifre)', 'Runder alltid bort fra null.', (a, ev) => { argc(a, 2); return rnd(toNumber(ev.val(a[0])), toNumber(ev.val(a[1])), 'u'); });
def('AVRUND.NED', 'ROUNDDOWN', 'Matte', 'AVRUND.NED(tall; antall_sifre)', 'Runder alltid mot null.', (a, ev) => { argc(a, 2); return rnd(toNumber(ev.val(a[0])), toNumber(ev.val(a[1])), 'd'); });
def('AVKORT', 'TRUNC', 'Matte', 'AVKORT(tall; [antall_sifre])', 'Kutter desimaler uten å runde.', (a, ev) => { argc(a, 1, 2); return rnd(toNumber(ev.val(a[0])), opt(a, 1) ? toNumber(ev.val(a[1])) : 0, 'd'); });
def('HELTALL', 'INT', 'Matte', 'HELTALL(tall)', 'Runder ned til nærmeste heltall.', (a, ev) => { argc(a, 1); return Math.floor(toNumber(ev.val(a[0]))); });
def('ABS', 'ABS', 'Matte', 'ABS(tall)', 'Tallverdien uten fortegn.', (a, ev) => { argc(a, 1); return Math.abs(toNumber(ev.val(a[0]))); });
def('ROT', 'SQRT', 'Matte', 'ROT(tall)', 'Kvadratroten av et tall.', (a, ev) => { argc(a, 1); const n = toNumber(ev.val(a[0])); if (n < 0) fail('#TALL!'); return Math.sqrt(n); });
def('OPPHØYD.I', 'POWER', 'Matte', 'OPPHØYD.I(tall; potens)', 'Opphøyer et tall i en potens (samme som ^).', (a, ev) => { argc(a, 2); return Math.pow(toNumber(ev.val(a[0])), toNumber(ev.val(a[1]))); }, ['POTENS']);
def('REST', 'MOD', 'Matte', 'REST(tall; divisor)', 'Resten etter divisjon.', (a, ev) => {
  argc(a, 2);
  const n = toNumber(ev.val(a[0])), d = toNumber(ev.val(a[1]));
  if (d === 0) fail('#DIV/0!');
  return n - d * Math.floor(n / d);
});
def('PI', 'PI', 'Matte', 'PI()', 'Tallet pi.', a => { argc(a, 0); return Math.PI; });

// ---------- Statistikk ----------
def('GJENNOMSNITT', 'AVERAGE', 'Statistikk', 'GJENNOMSNITT(tall1; [tall2]; …)', 'Gjennomsnittet av tallene.', (a, ev) => {
  const n = numbers(a, ev);
  if (!n.length) fail('#DIV/0!');
  return n.reduce((s, x) => s + x, 0) / n.length;
});
def('MIN', 'MIN', 'Statistikk', 'MIN(tall1; [tall2]; …)', 'Minste tall.', (a, ev) => { const n = numbers(a, ev); return n.length ? Math.min(...n) : 0; });
def('STØRST', 'MAX', 'Statistikk', 'STØRST(tall1; [tall2]; …)', 'Største tall.', (a, ev) => { const n = numbers(a, ev); return n.length ? Math.max(...n) : 0; }, ['MAKS']);
def('MEDIAN', 'MEDIAN', 'Statistikk', 'MEDIAN(tall1; [tall2]; …)', 'Midterste verdi.', (a, ev) => {
  const n = numbers(a, ev).sort((x, y) => x - y);
  if (!n.length) fail('#TALL!');
  const h = Math.floor(n.length / 2);
  return n.length % 2 ? n[h] : (n[h - 1] + n[h]) / 2;
});
def('ANTALL', 'COUNT', 'Statistikk', 'ANTALL(verdi1; [verdi2]; …)', 'Teller celler med tall.', (a, ev) => {
  let c = 0;
  for (const n of a) {
    if (n.t === 'empty') continue;
    const v = ev.val(n);
    if (isMatrix(v) || isRangeNode(n)) c += flat(v).filter(x => typeof x === 'number').length;
    else if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && parseNumberText(v) !== null)) c++;
  }
  return c;
});
def('ANTALLA', 'COUNTA', 'Statistikk', 'ANTALLA(verdi1; [verdi2]; …)', 'Teller celler som ikke er tomme.', (a, ev) => {
  let c = 0;
  for (const n of a) { if (n.t === 'empty') continue; c += flat(ev.val(n)).filter(x => x !== null).length; }
  return c;
});
def('TELLBLANKE', 'COUNTBLANK', 'Statistikk', 'TELLBLANKE(område)', 'Teller tomme celler.', (a, ev) => { argc(a, 1); return flat(ev.val(a[0])).filter(x => x === null || x === '').length; }, ['ANTALL.BLANKE']);
def('N.STØRST', 'LARGE', 'Statistikk', 'N.STØRST(matrise; k)', 'Det k-te største tallet.', (a, ev) => {
  argc(a, 2);
  const n = numbers([a[0]], ev).sort((x, y) => y - x), k = Math.floor(toNumber(ev.val(a[1])));
  if (k < 1 || k > n.length) fail('#TALL!');
  return n[k - 1];
});
def('N.MINST', 'SMALL', 'Statistikk', 'N.MINST(matrise; k)', 'Det k-te minste tallet.', (a, ev) => {
  argc(a, 2);
  const n = numbers([a[0]], ev).sort((x, y) => x - y), k = Math.floor(toNumber(ev.val(a[1])));
  if (k < 1 || k > n.length) fail('#TALL!');
  return n[k - 1];
});
def('RANG', 'RANK', 'Statistikk', 'RANG(tall; ref; [rekkefølge])', 'Plassering av et tall i en liste (0 = synkende).', (a, ev) => {
  argc(a, 2, 3);
  const x = toNumber(ev.val(a[0])), list = numbers([a[1]], ev);
  const asc = opt(a, 2) ? toNumber(ev.val(a[2])) !== 0 : false;
  if (!list.includes(x)) fail('#I/T');
  return 1 + list.filter(v => (asc ? v < x : v > x)).length;
}, ['RANG.EKV', 'RANK.EQ', 'RANGERING']);
def('GJENNOMSNITTHVIS', 'AVERAGEIF', 'Statistikk', 'GJENNOMSNITTHVIS(område; vilkår; [gjennomsnittsområde])', 'Gjennomsnitt av cellene som oppfyller vilkåret.', (a, ev) => {
  argc(a, 2, 3);
  const mask = maskFor([a[0], a[1]], ev);
  const vals = flat(ev.val(opt(a, 2) ?? a[0]));
  const n = vals.filter((v, i) => mask[i] && typeof v === 'number') as number[];
  if (!n.length) fail('#DIV/0!');
  return n.reduce((s, x) => s + x, 0) / n.length;
});
def('GJENNOMSNITT.HVIS.SETT', 'AVERAGEIFS', 'Statistikk', 'GJENNOMSNITT.HVIS.SETT(gjennomsnittsområde; område1; vilkår1; …)', 'Gjennomsnitt med flere vilkår.', (a, ev) => {
  if (a.length < 3 || a.length % 2 === 0) fail('#VERDI!');
  const vals = flat(ev.val(a[0]));
  const mask = maskFor(a.slice(1), ev);
  const n = vals.filter((v, i) => mask[i] && typeof v === 'number') as number[];
  if (!n.length) fail('#DIV/0!');
  return n.reduce((s, x) => s + x, 0) / n.length;
});
def('ANTALL.HVIS', 'COUNTIF', 'Statistikk', 'ANTALL.HVIS(område; vilkår)', 'Teller cellene som oppfyller vilkåret.', (a, ev) => { argc(a, 2); return maskFor(a, ev).filter(Boolean).length; });
def('ANTALL.HVIS.SETT', 'COUNTIFS', 'Statistikk', 'ANTALL.HVIS.SETT(område1; vilkår1; [område2; vilkår2] …)', 'Teller cellene som oppfyller alle vilkårene.', (a, ev) => {
  if (a.length < 2 || a.length % 2) fail('#VERDI!');
  return maskFor(a, ev).filter(Boolean).length;
});
def('MAKS.HVIS.SETT', 'MAXIFS', 'Statistikk', 'MAKS.HVIS.SETT(maksområde; område1; vilkår1; …)', 'Største tall som oppfyller vilkårene.', (a, ev) => {
  const vals = flat(ev.val(a[0])); const mask = maskFor(a.slice(1), ev);
  const n = vals.filter((v, i) => mask[i] && typeof v === 'number') as number[];
  return n.length ? Math.max(...n) : 0;
}, ['STØRST.HVIS.SETT']);
def('MIN.HVIS.SETT', 'MINIFS', 'Statistikk', 'MIN.HVIS.SETT(minområde; område1; vilkår1; …)', 'Minste tall som oppfyller vilkårene.', (a, ev) => {
  const vals = flat(ev.val(a[0])); const mask = maskFor(a.slice(1), ev);
  const n = vals.filter((v, i) => mask[i] && typeof v === 'number') as number[];
  return n.length ? Math.min(...n) : 0;
});
def('SUMMERHVIS', 'SUMIF', 'Matte', 'SUMMERHVIS(område; vilkår; [summeringsområde])', 'Summerer cellene som oppfyller vilkåret.', (a, ev) => {
  argc(a, 2, 3);
  const mask = maskFor([a[0], a[1]], ev);
  const vals = flat(ev.val(opt(a, 2) ?? a[0]));
  let s = 0;
  vals.forEach((v, i) => { if (mask[i] && typeof v === 'number') s += v; if (mask[i] && isErr(v)) throw new XlThrow(v.code); });
  return s;
});
def('SUMMER.HVIS.SETT', 'SUMIFS', 'Matte', 'SUMMER.HVIS.SETT(summeringsområde; område1; vilkår1; [område2; vilkår2] …)', 'Summerer med flere vilkår.', (a, ev) => {
  if (a.length < 3 || a.length % 2 === 0) fail('#VERDI!');
  const vals = flat(ev.val(a[0]));
  const mask = maskFor(a.slice(1), ev);
  if (mask.length !== vals.length) fail('#VERDI!');
  let s = 0;
  vals.forEach((v, i) => { if (mask[i] && typeof v === 'number') s += v; });
  return s;
});

// ---------- Logikk ----------
def('HVIS', 'IF', 'Logikk', 'HVIS(test; [verdi_hvis_sann]; [verdi_hvis_usann])', 'Gir én verdi hvis testen er sann og en annen hvis den er usann.', (a, ev) => {
  argc(a, 1, 3);
  const ok = toBool(ev.val(a[0]));
  const pick = ok ? a[1] : a[2];
  if (!pick) return ok ? true : false;
  if (pick.t === 'empty') return 0;
  return ev.val(pick);
});
def('HVIS.SETT', 'IFS', 'Logikk', 'HVIS.SETT(test1; verdi1; [test2; verdi2] …)', 'Tester flere vilkår i rekkefølge og gir verdien til det første som er sant.', (a, ev) => {
  if (a.length < 2 || a.length % 2) fail('#VERDI!');
  for (let i = 0; i < a.length; i += 2) if (toBool(ev.val(a[i]))) return ev.val(a[i + 1]);
  return fail('#I/T');
});
def('OG', 'AND', 'Logikk', 'OG(logisk1; [logisk2]; …)', 'SANN hvis alle argumentene er sanne.', (a, ev) => {
  const vals = a.flatMap(n => flat(ev.val(n)).filter(v => v !== null && typeof v !== 'string'));
  if (!vals.length) fail('#VERDI!');
  return vals.every(v => toBool(v));
});
def('ELLER', 'OR', 'Logikk', 'ELLER(logisk1; [logisk2]; …)', 'SANN hvis minst ett argument er sant.', (a, ev) => {
  const vals = a.flatMap(n => flat(ev.val(n)).filter(v => v !== null && typeof v !== 'string'));
  if (!vals.length) fail('#VERDI!');
  return vals.some(v => toBool(v));
});
def('IKKE', 'NOT', 'Logikk', 'IKKE(logisk)', 'Snur SANN til USANN og omvendt.', (a, ev) => { argc(a, 1); return !toBool(ev.val(a[0])); });
def('SANN', 'TRUE', 'Logikk', 'SANN()', 'Den logiske verdien SANN.', () => true);
def('USANN', 'FALSE', 'Logikk', 'USANN()', 'Den logiske verdien USANN.', () => false);
def('HVISFEIL', 'IFERROR', 'Logikk', 'HVISFEIL(verdi; verdi_hvis_feil)', 'Gir en annen verdi hvis formelen gir en feil.', (a, ev) => {
  argc(a, 2);
  try {
    const v = ev.val(a[0]);
    const s = scalar(v);
    if (isErr(s)) return ev.val(a[1]);
    return v;
  } catch (e) {
    if (e instanceof XlThrow) return ev.val(a[1]);
    throw e;
  }
});
def('HVIS.IT', 'IFNA', 'Logikk', 'HVIS.IT(verdi; verdi_hvis_it)', 'Gir en annen verdi hvis formelen gir #I/T.', (a, ev) => {
  argc(a, 2);
  try {
    const v = ev.val(a[0]);
    const s = scalar(v);
    if (isErr(s) && s.code === '#I/T') return ev.val(a[1]);
    return v;
  } catch (e) {
    if (e instanceof XlThrow && e.code === '#I/T') return ev.val(a[1]);
    throw e;
  }
});

// ---------- Info ----------
const safe = (n: Node, ev: Ev): Scalar => {
  try { return scalar(ev.val(n)); } catch (e) { if (e instanceof XlThrow) return new XlErr(e.code); throw e; }
};
def('ERTOM', 'ISBLANK', 'Info', 'ERTOM(verdi)', 'SANN hvis cellen er tom.', (a, ev) => { argc(a, 1); return safe(a[0], ev) === null; });
def('ERTALL', 'ISNUMBER', 'Info', 'ERTALL(verdi)', 'SANN hvis verdien er et tall.', (a, ev) => { argc(a, 1); return typeof safe(a[0], ev) === 'number'; });
def('ERTEKST', 'ISTEXT', 'Info', 'ERTEKST(verdi)', 'SANN hvis verdien er tekst.', (a, ev) => { argc(a, 1); return typeof safe(a[0], ev) === 'string'; });
def('ERFEIL', 'ISERROR', 'Info', 'ERFEIL(verdi)', 'SANN hvis verdien er en feil.', (a, ev) => { argc(a, 1); return isErr(safe(a[0], ev)); });

// ---------- Oppslag ----------
def('FINN.RAD', 'VLOOKUP', 'Oppslag', 'FINN.RAD(søkeverdi; tabellmatrise; kolonneindeks; [område])', 'Leter i første kolonne og henter verdien fra en annen kolonne på samme rad.', (a, ev) => {
  argc(a, 3, 4);
  const needle = scalar(ev.val(a[0]));
  if (isErr(needle)) throw new XlThrow(needle.code);
  const rows = rowsOf(ev.val(a[1]));
  const col = Math.floor(toNumber(ev.val(a[2])));
  const approx = opt(a, 3) ? toBool(ev.val(a[3])) : true;
  if (col < 1) fail('#VERDI!');
  if (col > (rows[0]?.length ?? 0)) fail('#REF!');
  const idx = matchIndex(needle, rows.map(r => r[0]), approx ? 1 : 0);
  if (idx < 0) fail('#I/T');
  return rows[idx][col - 1];
});
def('FINN.KOLONNE', 'HLOOKUP', 'Oppslag', 'FINN.KOLONNE(søkeverdi; tabellmatrise; radindeks; [område])', 'Leter i første rad og henter verdien fra en annen rad i samme kolonne.', (a, ev) => {
  argc(a, 3, 4);
  const needle = scalar(ev.val(a[0]));
  const rows = rowsOf(ev.val(a[1]));
  const row = Math.floor(toNumber(ev.val(a[2])));
  const approx = opt(a, 3) ? toBool(ev.val(a[3])) : true;
  if (row < 1) fail('#VERDI!');
  if (row > rows.length) fail('#REF!');
  const idx = matchIndex(needle, rows[0], approx ? 1 : 0);
  if (idx < 0) fail('#I/T');
  return rows[row - 1][idx];
});
def('SAMMENLIGNE', 'MATCH', 'Oppslag', 'SAMMENLIGNE(søkeverdi; søkematrise; [type])', 'Posisjonen til en verdi i en liste (0 = eksakt treff).', (a, ev) => {
  argc(a, 2, 3);
  const needle = scalar(ev.val(a[0]));
  const list = flat(ev.val(a[1]));
  const mode = opt(a, 2) ? toNumber(ev.val(a[2])) : 1;
  const i = matchIndex(needle, list, mode);
  if (i < 0) fail('#I/T');
  return i + 1;
});
def('INDEKS', 'INDEX', 'Oppslag', 'INDEKS(matrise; radnummer; [kolonnenummer])', 'Verdien på en gitt rad og kolonne i et område.', (a, ev) => {
  argc(a, 2, 3);
  const rows = rowsOf(ev.val(a[0]));
  let r = opt(a, 1) ? Math.floor(toNumber(ev.val(a[1]))) : 0;
  let c = opt(a, 2) ? Math.floor(toNumber(ev.val(a[2]))) : 0;
  if (rows.length === 1 && !opt(a, 2) && r > 0) { c = r; r = 1; }
  if (r < 0 || c < 0 || r > rows.length || c > (rows[0]?.length ?? 0)) fail('#REF!');
  if (r === 0 && c === 0) return matrix(rows);
  if (r === 0) return matrix(rows.map(row => [row[c - 1]]));
  if (c === 0) { if ((rows[0]?.length ?? 0) === 1) return rows[r - 1][0]; return matrix([rows[r - 1]]); }
  return rows[r - 1][c - 1];
});
def('XOPPSLAG', 'XLOOKUP', 'Oppslag', 'XOPPSLAG(søkeverdi; søkematrise; returmatrise; [hvis_ikke_funnet]; [samsvarsmodus])', 'Moderne oppslag: finner verdien og returnerer tilsvarende fra et annet område.', (a, ev) => {
  argc(a, 3, 6);
  const needle = scalar(ev.val(a[0]));
  const look = flat(ev.val(a[1]));
  const ret = ev.val(a[2]);
  const retRows = rowsOf(ret);
  const mode = opt(a, 4) ? toNumber(ev.val(a[4])) : 0;
  let idx = -1;
  if (mode === 0 || mode === 2) idx = matchIndex(needle, look, 0);
  else {
    let best = -1;
    look.forEach((v, i) => {
      if (v === null) return;
      const c = compareForSort(v, needle);
      if (c === 0) { if (best < 0 || compareForSort(look[best], needle) !== 0) best = i; return; }
      if (mode === -1 && c < 0 && (best < 0 || compareForSort(v, look[best]) > 0)) best = i;
      if (mode === 1 && c > 0 && (best < 0 || compareForSort(v, look[best]) < 0)) best = i;
    });
    idx = best;
  }
  if (idx < 0) { const nf = opt(a, 3); return nf ? ev.val(nf) : fail('#I/T'); }
  const vertical = retRows.length === look.length;
  if (vertical) return retRows[idx].length === 1 ? retRows[idx][0] : matrix([retRows[idx]]);
  if (retRows[0].length === look.length) return retRows.length === 1 ? retRows[0][idx] : matrix(retRows.map(r => [r[idx]]));
  return fail('#VERDI!');
});
def('VELG', 'CHOOSE', 'Oppslag', 'VELG(indeks; verdi1; [verdi2]; …)', 'Velger en verdi fra listen ut fra et nummer.', (a, ev) => {
  const i = Math.floor(toNumber(ev.val(a[0])));
  if (i < 1 || i >= a.length) fail('#VERDI!');
  return ev.val(a[i]);
});

// ---------- Tekst ----------
const txt = (a: Node[], i: number, ev: Ev) => toText(ev.val(a[i]));
def('VENSTRE', 'LEFT', 'Tekst', 'VENSTRE(tekst; [antall_tegn])', 'Tegn fra starten av teksten.', (a, ev) => {
  argc(a, 1, 2); const n = opt(a, 1) ? toNumber(ev.val(a[1])) : 1; if (n < 0) fail('#VERDI!'); return txt(a, 0, ev).slice(0, n);
});
def('HØYRE', 'RIGHT', 'Tekst', 'HØYRE(tekst; [antall_tegn])', 'Tegn fra slutten av teksten.', (a, ev) => {
  argc(a, 1, 2); const n = opt(a, 1) ? toNumber(ev.val(a[1])) : 1; if (n < 0) fail('#VERDI!'); const s = txt(a, 0, ev); return n === 0 ? '' : s.slice(-n);
});
def('DELTEKST', 'MID', 'Tekst', 'DELTEKST(tekst; startposisjon; antall_tegn)', 'Tegn fra midten av teksten.', (a, ev) => {
  argc(a, 3); const st = toNumber(ev.val(a[1])), n = toNumber(ev.val(a[2])); if (st < 1 || n < 0) fail('#VERDI!'); return txt(a, 0, ev).substr(st - 1, n);
});
def('LENGDE', 'LEN', 'Tekst', 'LENGDE(tekst)', 'Antall tegn i teksten.', (a, ev) => { argc(a, 1); return txt(a, 0, ev).length; });
def('STORE', 'UPPER', 'Tekst', 'STORE(tekst)', 'Gjør teksten om til store bokstaver.', (a, ev) => { argc(a, 1); return txt(a, 0, ev).toLocaleUpperCase('nb'); });
def('SMÅ', 'LOWER', 'Tekst', 'SMÅ(tekst)', 'Gjør teksten om til små bokstaver.', (a, ev) => { argc(a, 1); return txt(a, 0, ev).toLocaleLowerCase('nb'); });
def('STOR.FORBOKSTAV', 'PROPER', 'Tekst', 'STOR.FORBOKSTAV(tekst)', 'Stor forbokstav i hvert ord.', (a, ev) => {
  argc(a, 1); return txt(a, 0, ev).toLocaleLowerCase('nb').replace(/(^|[^a-zæøåäöüé])([a-zæøåäöüé])/g, (_, p, c) => p + c.toLocaleUpperCase('nb'));
});
def('TRIMME', 'TRIM', 'Tekst', 'TRIMME(tekst)', 'Fjerner ekstra mellomrom.', (a, ev) => { argc(a, 1); return txt(a, 0, ev).replace(/ +/g, ' ').trim(); });
def('KJEDE.SAMMEN', 'CONCATENATE', 'Tekst', 'KJEDE.SAMMEN(tekst1; [tekst2]; …)', 'Setter sammen tekster (samme som &).', (a, ev) => a.map((_, i) => txt(a, i, ev)).join(''));
def('KJED.SAMMEN', 'CONCAT', 'Tekst', 'KJED.SAMMEN(tekst1; [tekst2]; …)', 'Setter sammen tekster og områder.', (a, ev) => a.flatMap(n => flat(ev.val(n)).map(v => toText(v))).join(''));
def('TEKST.KOMBINER', 'TEXTJOIN', 'Tekst', 'TEKST.KOMBINER(skilletegn; ignorer_tomme; tekst1; …)', 'Setter sammen tekster med skilletegn mellom.', (a, ev) => {
  if (a.length < 3) fail('#VERDI!');
  const sep = txt(a, 0, ev), skip = toBool(ev.val(a[1]));
  const parts = a.slice(2).flatMap(n => flat(ev.val(n)).map(v => toText(v)));
  return parts.filter(p => !(skip && p === '')).join(sep);
});
def('FINN', 'FIND', 'Tekst', 'FINN(finn; innen_tekst; [startposisjon])', 'Posisjonen til en tekst (skiller mellom store og små bokstaver).', (a, ev) => {
  argc(a, 2, 3); const st = opt(a, 2) ? toNumber(ev.val(a[2])) : 1;
  const i = txt(a, 1, ev).indexOf(txt(a, 0, ev), st - 1); if (i < 0) fail('#VERDI!'); return i + 1;
});
def('SØK', 'SEARCH', 'Tekst', 'SØK(finn; innen_tekst; [startposisjon])', 'Posisjonen til en tekst (ikke skille mellom store og små, tillater * og ?).', (a, ev) => {
  argc(a, 2, 3); const st = opt(a, 2) ? toNumber(ev.val(a[2])) : 1;
  const hay = txt(a, 1, ev), pat = txt(a, 0, ev);
  const re = new RegExp(wildcardRe(pat).source.slice(1, -1), 'i');
  const m = re.exec(hay.slice(st - 1)); if (!m) fail('#VERDI!'); return st + m!.index;
});
def('BYTT.UT', 'SUBSTITUTE', 'Tekst', 'BYTT.UT(tekst; gammel; ny; [forekomst])', 'Bytter ut én tekst med en annen.', (a, ev) => {
  argc(a, 3, 4); const s = txt(a, 0, ev), old = txt(a, 1, ev), nu = txt(a, 2, ev);
  if (!old) return s;
  if (!opt(a, 3)) return s.split(old).join(nu);
  const k = toNumber(ev.val(a[3])); let i = -1;
  for (let j = 0; j < k; j++) { i = s.indexOf(old, i + 1); if (i < 0) return s; }
  return s.slice(0, i) + nu + s.slice(i + old.length);
});
def('ERSTATT', 'REPLACE', 'Tekst', 'ERSTATT(gammel_tekst; start; antall; ny_tekst)', 'Erstatter tegn på en gitt plass.', (a, ev) => {
  argc(a, 4); const s = txt(a, 0, ev), st = toNumber(ev.val(a[1])), n = toNumber(ev.val(a[2]));
  return s.slice(0, st - 1) + txt(a, 3, ev) + s.slice(st - 1 + n);
});
def('GJENTA', 'REPT', 'Tekst', 'GJENTA(tekst; antall)', 'Gjentar teksten et antall ganger.', (a, ev) => { argc(a, 2); return txt(a, 0, ev).repeat(Math.max(0, Math.floor(toNumber(ev.val(a[1]))))); });
def('EKSAKT', 'EXACT', 'Tekst', 'EKSAKT(tekst1; tekst2)', 'SANN hvis tekstene er helt like.', (a, ev) => { argc(a, 2); return txt(a, 0, ev) === txt(a, 1, ev); });
def('VERDI', 'VALUE', 'Tekst', 'VERDI(tekst)', 'Gjør tekst om til tall.', (a, ev) => { argc(a, 1); return toNumber(ev.val(a[0])); });
def('TEKST', 'TEXT', 'Tekst', 'TEKST(verdi; format)', 'Formaterer et tall som tekst, f.eks. "0,00" eller "dd.mm.åååå".', (a, ev) => {
  argc(a, 2); const v = scalar(ev.val(a[0]));
  if (typeof v === 'string' && parseNumberText(v) === null && parseDateText(v) === null) return v;
  return formatCode(toNumber(v), txt(a, 1, ev));
});

// ---------- Dato ----------
def('DATO', 'DATE', 'Dato', 'DATO(år; måned; dag)', 'Lager en dato av år, måned og dag.', (a, ev) => {
  argc(a, 3); return dateToSerial(Math.floor(toNumber(ev.val(a[0]))), Math.floor(toNumber(ev.val(a[1]))), Math.floor(toNumber(ev.val(a[2]))));
});
def('ÅR', 'YEAR', 'Dato', 'ÅR(dato)', 'Årstallet i en dato.', (a, ev) => { argc(a, 1); return ymd(toNumber(ev.val(a[0]))).y; });
def('MÅNED', 'MONTH', 'Dato', 'MÅNED(dato)', 'Måneden (1–12) i en dato.', (a, ev) => { argc(a, 1); return ymd(toNumber(ev.val(a[0]))).m; });
def('DAG', 'DAY', 'Dato', 'DAG(dato)', 'Dagen i måneden (1–31).', (a, ev) => { argc(a, 1); return ymd(toNumber(ev.val(a[0]))).d; });
def('IDAG', 'TODAY', 'Dato', 'IDAG()', 'Dagens dato.', (a, ev) => { argc(a, 0); return serialNow(ev); });
def('NÅ', 'NOW', 'Dato', 'NÅ()', 'Dato og klokkeslett nå.', (a, ev) => {
  argc(a, 0); const d = ev.now(); return serialNow(ev) + (d.getHours() * 60 + d.getMinutes()) / 1440;
});
def('UKEDAG', 'WEEKDAY', 'Dato', 'UKEDAG(dato; [type])', 'Ukedagnummer. Type 2 gir mandag = 1.', (a, ev) => {
  argc(a, 1, 2); const wd = ymd(toNumber(ev.val(a[0]))).wd; const t = opt(a, 1) ? toNumber(ev.val(a[1])) : 1;
  if (t === 2) return wd === 0 ? 7 : wd;
  if (t === 3) return wd === 0 ? 6 : wd - 1;
  return wd + 1;
});
def('ISOUKENR', 'ISOWEEKNUM', 'Dato', 'ISOUKENR(dato)', 'Ukenummer etter norsk (ISO) standard.', (a, ev) => { argc(a, 1); return isoWeek(toNumber(ev.val(a[0]))); });
def('UKENR', 'WEEKNUM', 'Dato', 'UKENR(dato; [type])', 'Ukenummer. Bruk type 21 for norsk ukenummer.', (a, ev) => {
  argc(a, 1, 2); const s = toNumber(ev.val(a[0])); const t = opt(a, 1) ? toNumber(ev.val(a[1])) : 1;
  if (t === 21) return isoWeek(s);
  const { y } = ymd(s); const jan1 = dateToSerial(y, 1, 1); const wd1 = ymd(jan1).wd; const start = t === 2 ? (wd1 + 6) % 7 : wd1;
  return Math.floor((Math.floor(s) - jan1 + start) / 7) + 1;
});
def('DAG.ETTER', 'EDATE', 'Dato', 'DAG.ETTER(startdato; måneder)', 'Datoen et antall måneder før eller etter.', (a, ev) => {
  argc(a, 2); const { y, m, d } = ymd(toNumber(ev.val(a[0]))); const k = Math.floor(toNumber(ev.val(a[1])));
  const last = ymd(dateToSerial(y, m + k + 1, 0)).d; return dateToSerial(y, m + k, Math.min(d, last));
});
def('MÅNEDSSLUTT', 'EOMONTH', 'Dato', 'MÅNEDSSLUTT(startdato; måneder)', 'Siste dag i måneden et antall måneder fram.', (a, ev) => {
  argc(a, 2); const { y, m } = ymd(toNumber(ev.val(a[0]))); return dateToSerial(y, m + Math.floor(toNumber(ev.val(a[1]))) + 1, 0);
});
def('DAGER', 'DAYS', 'Dato', 'DAGER(sluttdato; startdato)', 'Antall dager mellom to datoer.', (a, ev) => { argc(a, 2); return Math.floor(toNumber(ev.val(a[0]))) - Math.floor(toNumber(ev.val(a[1]))); });
def('NETT.ARBEIDSDAGER', 'NETWORKDAYS', 'Dato', 'NETT.ARBEIDSDAGER(startdato; sluttdato; [helligdager])', 'Antall arbeidsdager (man–fre) mellom to datoer, inkludert begge.', (a, ev) => {
  argc(a, 2, 3); let s = Math.floor(toNumber(ev.val(a[0]))), e = Math.floor(toNumber(ev.val(a[1])));
  const sign = e < s ? -1 : 1; if (e < s) [s, e] = [e, s];
  const hol = holidaysSet(a, 2, ev); let c = 0;
  for (let d = s; d <= e; d++) if (isWorkday(d, hol)) c++;
  return c * sign;
});
def('ARBEIDSDAG', 'WORKDAY', 'Dato', 'ARBEIDSDAG(startdato; dager; [helligdager])', 'Datoen et antall arbeidsdager fram.', (a, ev) => {
  argc(a, 2, 3); let d = Math.floor(toNumber(ev.val(a[0]))); let k = Math.floor(toNumber(ev.val(a[1])));
  const hol = holidaysSet(a, 2, ev); const step = k < 0 ? -1 : 1;
  while (k !== 0) { d += step; if (isWorkday(d, hol)) k -= step; }
  return d;
});
def('DATODIFF', 'DATEDIF', 'Dato', 'DATODIFF(startdato; sluttdato; enhet)', 'Forskjell mellom datoer i "Y" (år), "M" (måneder) eller "D" (dager).', (a, ev) => {
  argc(a, 3); const s = toNumber(ev.val(a[0])), e = toNumber(ev.val(a[1])); if (e < s) fail('#TALL!');
  const u = txt(a, 2, ev).toUpperCase(); const A = ymd(s), B = ymd(e);
  let months = (B.y - A.y) * 12 + (B.m - A.m); if (B.d < A.d) months--;
  if (u === 'D') return Math.floor(e) - Math.floor(s);
  if (u === 'M') return months;
  if (u === 'Y' || u === 'Å') return Math.floor(months / 12);
  return fail('#TALL!');
});

// ---------- Økonomi ----------
function pmt(rate: number, n: number, pv: number, fv = 0, type = 0) {
  if (n === 0) fail('#TALL!');
  if (rate === 0) return -(pv + fv) / n;
  const f = Math.pow(1 + rate, n);
  return -(rate * (pv * f + fv)) / ((1 + rate * type) * (f - 1));
}
def('AVDRAG', 'PMT', 'Økonomi', 'AVDRAG(rente; antall_innbet; nåverdi; [sluttverdi]; [type])', 'Fast terminbeløp på et annuitetslån (renter + avdrag).', (a, ev) => {
  argc(a, 3, 5);
  return pmt(toNumber(ev.val(a[0])), toNumber(ev.val(a[1])), toNumber(ev.val(a[2])), opt(a, 3) ? toNumber(ev.val(a[3])) : 0, opt(a, 4) ? toNumber(ev.val(a[4])) : 0);
});
def('NÅVERDI', 'PV', 'Økonomi', 'NÅVERDI(rente; antall_innbet; innbetaling; [sluttverdi]; [type])', 'Hva en serie framtidige betalinger er verdt i dag.', (a, ev) => {
  argc(a, 3, 5);
  const r = toNumber(ev.val(a[0])), n = toNumber(ev.val(a[1])), p = toNumber(ev.val(a[2]));
  const fv = opt(a, 3) ? toNumber(ev.val(a[3])) : 0, t = opt(a, 4) ? toNumber(ev.val(a[4])) : 0;
  if (r === 0) return -(p * n + fv);
  const f = Math.pow(1 + r, n);
  return -(p * (1 + r * t) * (f - 1) / r + fv) / f;
});
def('SLUTTVERDI', 'FV', 'Økonomi', 'SLUTTVERDI(rente; antall_innbet; innbetaling; [nåverdi]; [type])', 'Hva en sparing er verdt til slutt.', (a, ev) => {
  argc(a, 3, 5);
  const r = toNumber(ev.val(a[0])), n = toNumber(ev.val(a[1])), p = toNumber(ev.val(a[2]));
  const pv = opt(a, 3) ? toNumber(ev.val(a[3])) : 0, t = opt(a, 4) ? toNumber(ev.val(a[4])) : 0;
  if (r === 0) return -(pv + p * n);
  const f = Math.pow(1 + r, n);
  return -(pv * f + p * (1 + r * t) * (f - 1) / r);
});

export { numToText };
export type { Matrix };

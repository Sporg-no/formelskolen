import { isErr, serialToDate, type Scalar } from './core';

export type CellFormat = 'general' | 'int' | 'dec1' | 'dec2' | 'kr' | 'kr2' | 'pct' | 'pct1' | 'dato' | 'tid';

const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
const DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

/** Tall med fast antall desimaler, mellomrom som tusenskille og desimalkomma. */
export function fixed(n: number, dec: number, group = true): string {
  const neg = n < 0;
  const s = Math.abs(n).toFixed(dec);
  let [int, frac] = s.split('.');
  if (group) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg && Number(s) !== 0 ? '-' : '') + int + (frac ? ',' + frac : '');
}

export function general(n: number): string {
  if (!Number.isFinite(n)) return '#TALL!';
  if (Number.isInteger(n) && Math.abs(n) < 1e11) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-9 || abs >= 1e11)) return n.toExponential(4).replace('.', ',').replace('e', 'E');
  const r = Number(n.toPrecision(10));
  return String(r).replace('.', ',');
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function formatDate(serial: number, pattern = 'dd.mm.åååå'): string {
  const d = serialToDate(serial);
  const day = d.getUTCDate(), mon = d.getUTCMonth(), yr = d.getUTCFullYear(), wd = d.getUTCDay();
  return pattern
    .replace(/dddd/gi, '\u0001').replace(/ddd/gi, '\u0002').replace(/mmmm/gi, '\u0003').replace(/mmm/gi, '\u0004')
    .replace(/(åååå|yyyy)/gi, String(yr)).replace(/(åå|yy)/gi, pad(yr % 100))
    .replace(/dd/gi, pad(day)).replace(/mm/gi, pad(mon + 1))
    .replace(/(?<![a-zå])d(?![a-zå])/gi, String(day)).replace(/(?<![a-zå])m(?![a-zå])/gi, String(mon + 1))
    .replace('\u0001', DAYS[wd]).replace('\u0002', DAYS[wd].slice(0, 3)).replace('\u0003', MONTHS[mon]).replace('\u0004', MONTHS[mon].slice(0, 3));
}

/** Enkel utgave av TEKST()-formatkoder: 0, 0,00, # ##0, 0%, kr # ##0,00, dd.mm.åååå, dddd, mmmm … */
export function formatCode(n: number, code: string): string {
  if (/[dåy]/i.test(code) || /^m+$/i.test(code) || /mmmm/i.test(code)) return formatDate(n, code);
  const m = /^([^#0]*)([#0][#0  ]*)(,(0+))?(%?)(.*)$/.exec(code);
  if (!m) return general(n);
  const [, pre, intPart, , decs, pct, post] = m;
  const dec = decs ? decs.length : 0;
  const v = pct ? n * 100 : n;
  const group = /[  ]/.test(intPart);
  return pre + fixed(v, dec, group) + pct + post;
}

export function display(v: Scalar, fmt: CellFormat = 'general'): string {
  if (v === null) return '';
  if (isErr(v)) return v.code;
  if (typeof v === 'boolean') return v ? 'SANN' : 'USANN';
  if (typeof v === 'string') return v;
  switch (fmt) {
    case 'int': return fixed(v, 0);
    case 'dec1': return fixed(v, 1);
    case 'dec2': return fixed(v, 2);
    case 'kr': return `kr ${fixed(v, 0)}`;
    case 'kr2': return `kr ${fixed(v, 2)}`;
    case 'pct': return `${fixed(v * 100, 0)} %`;
    case 'pct1': return `${fixed(v * 100, 1)} %`;
    case 'dato': return formatDate(v);
    case 'tid': {
      const mins = Math.round((v - Math.floor(v)) * 1440);
      return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    }
    default: return general(v);
  }
}

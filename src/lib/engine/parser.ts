import { colIndex, type ErrCode } from './core';

export type Ref = { t: 'ref'; col: number; row: number; absC: boolean; absR: boolean };
export type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'errlit'; code: ErrCode }
  | Ref
  | { t: 'range'; a: Ref; b: Ref }
  | { t: 'cols'; c1: number; c2: number; abs1: boolean; abs2: boolean }
  | { t: 'fn'; name: string; args: Node[] }
  | { t: 'name'; name: string }
  | { t: 'empty' }
  | { t: 'un'; op: '-' | '+'; e: Node }
  | { t: 'pct'; e: Node }
  | { t: 'bin'; op: string; l: Node; r: Node };

type Tok =
  | { k: 'num'; v: number; s: string }
  | { k: 'str'; v: string; s: string }
  | { k: 'err'; v: ErrCode; s: string }
  | { k: 'ref'; s: string }
  | { k: 'cols'; s: string }
  | { k: 'id'; s: string }
  | { k: 'op'; s: string }
  | { k: 'end'; s: '' };

export class ParseError extends Error {}

const ERR_LITS: ErrCode[] = ['#DIV/0!', '#NAVN?', '#VERDI!', '#I/T', '#REF!', '#TALL!'];
const REF_RE = /^\$?[A-Za-z]{1,3}\$?\d+(?![A-Za-z0-9_.(ÆØÅæøå])/;
const COLS_RE = /^\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}(?![A-Za-z0-9_.(ÆØÅæøå])/;
const ID_RE = /^[A-Za-zÆØÅæøåÄÖäö_][A-Za-z0-9ÆØÅæøåÄÖäö_.]*/;
const NUM_RE = /^\d+([.,]\d+)?([eE][-+]?\d+)?/;

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === ' ') { i++; continue; }
    const rest = src.slice(i);
    if (ch === '"') {
      let j = i + 1, v = '';
      for (;;) {
        if (j >= src.length) throw new ParseError('Mangler avsluttende anførselstegn');
        if (src[j] === '"') {
          if (src[j + 1] === '"') { v += '"'; j += 2; continue; }
          break;
        }
        v += src[j++];
      }
      out.push({ k: 'str', v, s: src.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (ch === '#') {
      const lit = ERR_LITS.find(e => rest.toUpperCase().startsWith(e));
      if (!lit) throw new ParseError('Ukjent feilverdi');
      out.push({ k: 'err', v: lit, s: lit });
      i += lit.length;
      continue;
    }
    let m = COLS_RE.exec(rest);
    if (m) { out.push({ k: 'cols', s: m[0] }); i += m[0].length; continue; }
    m = REF_RE.exec(rest);
    if (m) { out.push({ k: 'ref', s: m[0] }); i += m[0].length; continue; }
    m = NUM_RE.exec(rest);
    if (m && /\d/.test(ch)) {
      out.push({ k: 'num', v: Number(m[0].replace(',', '.')), s: m[0] });
      i += m[0].length;
      continue;
    }
    m = ID_RE.exec(rest);
    if (m) { out.push({ k: 'id', s: m[0] }); i += m[0].length; continue; }
    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') { out.push({ k: 'op', s: two }); i += 2; continue; }
    if ('+-*/^&=<>%();,:'.includes(ch)) { out.push({ k: 'op', s: ch }); i++; continue; }
    throw new ParseError(`Ukjent tegn «${ch}»`);
  }
  out.push({ k: 'end', s: '' });
  return out;
}

function parseRef(s: string): Ref {
  const m = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/.exec(s)!;
  return { t: 'ref', col: colIndex(m[2]), row: Number(m[4]) - 1, absC: m[1] === '$', absR: m[3] === '$' };
}

/** Parser en formel. Tar imot teksten med eller uten innledende «=». */
export function parse(formula: string): Node {
  const src = formula.startsWith('=') ? formula.slice(1) : formula;
  if (!src.trim()) throw new ParseError('Tom formel');
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const isOp = (s: string) => peek().k === 'op' && peek().s === s;
  const expect = (s: string) => {
    if (!isOp(s)) throw new ParseError(s === ')' ? 'Mangler sluttparentes )' : `Forventet «${s}»`);
    p++;
  };

  function comparison(): Node {
    let l = concat();
    while (peek().k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(peek().s)) {
      const op = next().s;
      l = { t: 'bin', op, l, r: concat() };
    }
    return l;
  }
  function concat(): Node {
    let l = additive();
    while (isOp('&')) { next(); l = { t: 'bin', op: '&', l, r: additive() }; }
    return l;
  }
  function additive(): Node {
    let l = mult();
    while (isOp('+') || isOp('-')) { const op = next().s; l = { t: 'bin', op, l, r: mult() }; }
    return l;
  }
  function mult(): Node {
    let l = power();
    while (isOp('*') || isOp('/')) { const op = next().s; l = { t: 'bin', op, l, r: power() }; }
    return l;
  }
  function power(): Node {
    let l = unary();
    while (isOp('^')) { next(); l = { t: 'bin', op: '^', l, r: unary() }; }
    return l;
  }
  function unary(): Node {
    if (isOp('-') || isOp('+')) { const op = next().s as '-' | '+'; return { t: 'un', op, e: unary() }; }
    return postfix();
  }
  function postfix(): Node {
    let e = primary();
    while (isOp('%')) { next(); e = { t: 'pct', e }; }
    return e;
  }
  function args(): Node[] {
    const list: Node[] = [];
    if (isOp(')')) { next(); return list; }
    for (;;) {
      if (isOp(';') || isOp(',') || isOp(')')) list.push({ t: 'empty' });
      else list.push(comparison());
      if (isOp(';') || isOp(',')) { next(); continue; }
      expect(')');
      return list;
    }
  }
  function primary(): Node {
    const tk = next();
    switch (tk.k) {
      case 'num': return { t: 'num', v: tk.v };
      case 'str': return { t: 'str', v: tk.v };
      case 'err': return { t: 'errlit', code: tk.v };
      case 'cols': {
        const m = /^(\$?)([A-Za-z]{1,3}):(\$?)([A-Za-z]{1,3})$/.exec(tk.s)!;
        const c1 = colIndex(m[2]), c2 = colIndex(m[4]);
        return { t: 'cols', c1: Math.min(c1, c2), c2: Math.max(c1, c2), abs1: m[1] === '$', abs2: m[3] === '$' };
      }
      case 'ref': {
        const a = parseRef(tk.s);
        if (isOp(':')) {
          next();
          const b = next();
          if (b.k !== 'ref') throw new ParseError('Ugyldig område etter «:»');
          return { t: 'range', a, b: parseRef(b.s) };
        }
        return a;
      }
      case 'id': {
        const name = tk.s.toUpperCase();
        if (isOp('(')) { next(); return { t: 'fn', name, args: args() }; }
        if (name === 'SANN' || name === 'TRUE') return { t: 'bool', v: true };
        if (name === 'USANN' || name === 'FALSE') return { t: 'bool', v: false };
        return { t: 'name', name };
      }
      case 'op':
        if (tk.s === '(') { const e = comparison(); expect(')'); return e; }
        throw new ParseError(`Uventet «${tk.s}»`);
      default:
        throw new ParseError('Formelen slutter for tidlig');
    }
  }

  const tree = comparison();
  if (peek().k !== 'end') {
    const t = peek();
    throw new ParseError(t.k === 'op' && t.s === ')' ? 'For mange sluttparenteser' : `Uventet «${t.s}»`);
  }
  return tree;
}

/** Alle funksjonsnavn som brukes i formelen (store bokstaver). */
export function functionsUsed(n: Node, out = new Set<string>()): Set<string> {
  switch (n.t) {
    case 'fn': out.add(n.name); n.args.forEach(a => functionsUsed(a, out)); break;
    case 'un': case 'pct': functionsUsed(n.e, out); break;
    case 'bin': functionsUsed(n.l, out); functionsUsed(n.r, out); break;
  }
  return out;
}

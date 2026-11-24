import { isErr, parseAddr, addrName, parseDateText, type Scalar } from './core';
import { parse, functionsUsed, ParseError } from './parser';
import { lookupFn } from './functions';
import { Sheet, shiftFormula } from './sheet';
import { display, formatDate } from './format';

export type Task = {
  /** Én celle («D2») eller et område som skal fylles («D2:D6»). */
  cell: string;
  /** Fasitformel for første celle. Brukes bare til å regne ut riktig svar. */
  solution: string;
  prompt: string;
  hint?: string;
  /** Funksjoner som må være med (norsk eller engelsk navn godtas). */
  mustUse?: string[];
  /** Tegn som må være med, f.eks. «$» for absolutte referanser. */
  mustContain?: string[];
  /** Godta et tall eller en tekst uten formel. */
  allowValue?: boolean;
};

export type GradeResult = { ok: boolean; message: string; cell?: string };

function cellsOf(spec: string): string[] {
  const [a, b] = spec.toUpperCase().split(':');
  const A = parseAddr(a)!, B = b ? parseAddr(b)! : A;
  const out: string[] = [];
  for (let r = Math.min(A.row, B.row); r <= Math.max(A.row, B.row); r++)
    for (let c = Math.min(A.col, B.col); c <= Math.max(A.col, B.col); c++) out.push(addrName({ col: c, row: r }));
  return out;
}
export const taskCells = (t: Task) => cellsOf(t.cell);

function same(a: Scalar, b: Scalar): boolean {
  if (isErr(a) || isErr(b)) return isErr(a) && isErr(b) && a.code === b.code;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  if (a === null || a === '') return b === null || b === '';
  if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
  return a === b;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

/** Bytter ut inndata med nye tall slik at hardkodede svar avsløres. */
function perturb(sheet: Sheet, skip: Set<string>, seed: number): Sheet {
  const s = sheet.clone();
  const rand = rng(seed);
  const changes: Record<string, string> = {};
  for (const k of s.keys()) {
    if (skip.has(k)) continue;
    const raw = s.getRaw(k);
    if (raw.startsWith('=') || raw.startsWith("'")) continue;
    const d = parseDateText(raw.trim());
    if (d !== null) { changes[k] = formatDate(d + Math.floor(rand() * 60) - 20, 'dd.mm.åååå'); continue; }
    const v = s.value(k);
    if (typeof v !== 'number' || v === 0) continue;
    const decimals = (String(v).split('.')[1] ?? '').length;
    const f = 0.55 + rand() * 0.9;
    let n = Number((v * f).toFixed(Math.min(decimals, 4)));
    if (n === v) n = v + (decimals ? 1 / 10 ** decimals : 1) * (rand() < 0.5 ? -1 : 1);
    if (n === 0) n = v;
    changes[k] = String(n).replace('.', ',');
  }
  s.setMany(changes);
  return s;
}

/** Utvider et område «A2:A9» til cellenavn. */
export function expand(spec: string[]): Set<string> {
  return new Set(spec.flatMap(cellsOf));
}

export function gradeTask(sheet: Sheet, task: Task, fixedCells: Set<string> = new Set()): GradeResult {
  const cells = cellsOf(task.cell);
  const first = parseAddr(cells[0])!;
  const sol = (c: string) => {
    const p = parseAddr(c)!;
    return shiftFormula(task.solution, p.col - first.col, p.row - first.row);
  };

  for (const c of cells) {
    const raw = sheet.getRaw(c);
    if (!raw) return { ok: false, cell: c, message: cells.length > 1 ? `${c} er tom. Fyll formelen ned til ${cells[cells.length - 1]}.` : `${c} er tom.` };
    if (!task.allowValue && !raw.startsWith('=')) return { ok: false, cell: c, message: `${c} inneholder et tall, ikke en formel. Start med =.` };
    if (raw.startsWith('=')) {
      let tree;
      try { tree = parse(raw); } catch (e) {
        return { ok: false, cell: c, message: `Formelen i ${c} har en feil: ${e instanceof ParseError ? e.message : 'ugyldig formel'}.` };
      }
      const used = [...functionsUsed(tree)];
      for (const fn of used) if (!lookupFn(fn)) return { ok: false, cell: c, message: `${c}: Funksjonen ${fn} finnes ikke. Sjekk stavemåten. Norsk Excel bruker norske navn, f.eks. SUMMER og HVIS.` };
      for (const need of task.mustUse ?? []) {
        const want = lookupFn(need);
        if (!used.some(u => lookupFn(u) === want)) return { ok: false, cell: c, message: `${c}: Oppgaven krever at du bruker ${need}.` };
      }
      for (const ch of task.mustContain ?? []) if (!raw.includes(ch)) return { ok: false, cell: c, message: `${c}: Formelen skal inneholde «${ch}».` };
    }
    const got = sheet.value(c), want = sheet.evalFormula(sol(c));
    if (!same(got, want)) {
      return { ok: false, cell: c, message: `Ikke helt. ${c} viser «${display(got) || 'tom'}». Prøv igjen, eller se hintet.` };
    }
  }

  // Sjekk at formlene virker også når tallene i arket endres.
  const skip = new Set([...cells, ...fixedCells]);
  for (let k = 1; k <= 3; k++) {
    const p = perturb(sheet, skip, 7919 * k + cells.length);
    for (const c of cells) {
      if (!sheet.getRaw(c).startsWith('=')) continue;
      if (!same(p.value(c), p.evalFormula(sol(c)))) {
        return { ok: false, cell: c, message: `Svaret i ${c} stemmer nå, men ikke hvis tallene i arket endres. Har du skrevet inn et tall i stedet for en cellereferanse, eller glemt $?` };
      }
    }
  }
  return { ok: true, message: 'Riktig.' };
}

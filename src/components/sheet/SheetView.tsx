'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sheet, shiftFormula, referencedRanges, type RawCells } from '@/lib/engine/sheet';
import { addrName, colName, isErr, parseAddr, type Scalar } from '@/lib/engine/core';
import { display, type CellFormat } from '@/lib/engine/format';
import { CATALOG, type FnMeta } from '@/lib/engine/functions';
import { parse, ParseError } from '@/lib/engine/parser';

type Pos = { c: number; r: number };
type Rect = { c1: number; r1: number; c2: number; r2: number };
export type Target = { spec: string; ok: boolean };

const RH = 44, HH = 26, ROWH = 30, DEFW = 96;
const REF_COLORS = ['#2F6FDE', '#B5179E', '#E36414', '#0F9D8A', '#7B2CBF', '#C9184A'];
const POINT_BEFORE = /[=(;,+\-*/^&<>:]\s*$/;

const rectOf = (a: Pos, b: Pos): Rect => ({ c1: Math.min(a.c, b.c), r1: Math.min(a.r, b.r), c2: Math.max(a.c, b.c), r2: Math.max(a.r, b.r) });
const nameOf = (p: Pos) => addrName({ col: p.c, row: p.r });
const refText = (r: Rect) => (r.c1 === r.c2 && r.r1 === r.r2 ? nameOf({ c: r.c1, r: r.r1 }) : `${nameOf({ c: r.c1, r: r.r1 })}:${nameOf({ c: r.c2, r: r.r2 })}`);
function specRect(spec: string): Rect {
  const [a, b] = spec.split(':');
  const A = parseAddr(a)!, B = b ? parseAddr(b)! : A;
  return { c1: Math.min(A.col, B.col), r1: Math.min(A.row, B.row), c2: Math.max(A.col, B.col), r2: Math.max(A.row, B.row) };
}

/** Store bokstaver utenfor tekst og lukker parenteser, slik Excel gjør når du trykker Enter. */
export function normalizeInput(v: string): string {
  if (!v.startsWith('=')) return v;
  let out = '', inStr = false, depth = 0;
  for (const ch of v) {
    if (ch === '"') inStr = !inStr;
    if (!inStr) { if (ch === '(') depth++; if (ch === ')') depth--; out += ch.toLocaleUpperCase('nb'); }
    else out += ch;
  }
  if (inStr) out += '"';
  while (depth-- > 0) out += ')';
  return out;
}

/** Funksjonen markøren står inni, og hvilket argument. */
function callAt(before: string): { name: string; arg: number } | null {
  const stack: { name: string; arg: number }[] = [];
  let inStr = false;
  for (let i = 0; i < before.length; i++) {
    const ch = before[i];
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '(') {
      const m = /([A-Za-zÆØÅæøå][A-Za-z0-9ÆØÅæøå.]*)$/.exec(before.slice(0, i));
      stack.push({ name: m ? m[1].toUpperCase() : '', arg: 0 });
    } else if (ch === ')') stack.pop();
    else if ((ch === ';' || ch === ',') && stack.length) stack[stack.length - 1].arg++;
  }
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name) return stack[i];
  return null;
}

const byName = new Map<string, FnMeta>();
for (const f of CATALOG) { byName.set(f.no.toUpperCase(), f); byName.set(f.en.toUpperCase(), f); f.aliases.forEach(a => byName.set(a.toUpperCase(), f)); }

function suggestions(before: string): { token: string; list: FnMeta[] } | null {
  if (!before.startsWith('=')) return null;
  const m = /(^=|[=(;,+\-*/^&<> ])([A-Za-zÆØÅæøå][A-Za-z0-9ÆØÅæøå.]*)$/.exec(before);
  if (!m) return null;
  const tok = m[2].toUpperCase();
  if (/^[A-Z]{1,3}\d+$/.test(tok) && !CATALOG.some(f => f.no.startsWith(tok))) return null;
  const seen = new Set<string>();
  const list: FnMeta[] = [];
  for (const f of CATALOG) if (f.no.startsWith(tok) && !seen.has(f.no)) { seen.add(f.no); list.push(f); }
  for (const f of CATALOG) if (!seen.has(f.no) && (f.en.startsWith(tok) || f.aliases.some(a => a.startsWith(tok)))) { seen.add(f.no); list.push(f); }
  if (!list.length || (list.length === 1 && list[0].no === tok)) return null;
  return { token: m[2], list: list.slice(0, 6) };
}

export type SheetViewProps = {
  sheet: Sheet;
  formats?: Record<string, CellFormat>;
  widths?: Record<string, number>;
  bold?: number[];
  targets?: Target[];
  minCols?: number;
  minRows?: number;
  onChange?: (cells: string[]) => void;
  initialSelect?: string;
  compact?: boolean;
};

export default function SheetView({ sheet, formats = {}, widths = {}, bold = [], targets = [], minCols = 6, minRows = 12, onChange, initialSelect, compact }: SheetViewProps) {
  const [, setTick] = useState(0);
  const rerender = () => setTick(t => t + 1);
  const start = initialSelect ? parseAddr(initialSelect) : null;
  const [sel, setSel] = useState<Pos>(start ? { c: start.col, r: start.row } : { c: 0, r: 0 });
  const [anchor, setAnchor] = useState<Pos>(start ? { c: start.col, r: start.row } : { c: 0, r: 0 });
  const [editing, setEditing] = useState<null | 'cell' | 'bar'>(null);
  const [draft, setDraft] = useState('');
  const [acIndex, setAcIndex] = useState(0);
  const [caret, setCaret] = useState(0);
  const [fillTo, setFillTo] = useState<Rect | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellInput = useRef<HTMLInputElement>(null);
  const barInput = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const pointIns = useRef<{ start: number; end: number; anchor: Pos } | null>(null);
  const dragSel = useRef(false);
  const fillDrag = useRef<Rect | null>(null);
  const history = useRef<RawCells[]>([]);
  const future = useRef<RawCells[]>([]);
  const clip = useRef<{ text: string; cells: string[][]; origin: Pos } | null>(null);
  const dims = useRef({ cols: minCols, rows: minRows });

  // Størrelse på rutenettet: vokser, krymper aldri mens du jobber
  const { maxR, maxC } = sheet.bounds();
  let tc = 0, tr = 0;
  for (const t of targets) { const r = specRect(t.spec); tc = Math.max(tc, r.c2); tr = Math.max(tr, r.r2); }
  dims.current = {
    cols: Math.max(dims.current.cols, maxC + 2, tc + 2, minCols, sel.c + 1),
    rows: Math.max(dims.current.rows, maxR + 3, tr + 3, minRows, sel.r + 1),
  };
  const { cols: nCols, rows: nRows } = dims.current;
  const colW = useMemo(() => Array.from({ length: nCols }, (_, c) => widths[colName(c)] ?? DEFW), [nCols, widths]);
  const colX = useMemo(() => { const x = [RH]; colW.forEach(w => x.push(x[x.length - 1] + w)); return x; }, [colW]);
  const box = (r: Rect) => ({ left: colX[r.c1], top: HH + r.r1 * ROWH, width: colX[Math.min(r.c2 + 1, nCols)] - colX[r.c1], height: (r.r2 - r.r1 + 1) * ROWH });

  const selRect = rectOf(anchor, sel);
  const activeInput = () => (editing === 'bar' ? barInput.current : cellInput.current);

  useLayoutEffect(() => {
    if (pendingCaret.current === null) return;
    const el = activeInput();
    if (el) { el.focus(); el.setSelectionRange(pendingCaret.current, pendingCaret.current); }
    setCaret(pendingCaret.current);
    pendingCaret.current = null;
  });

  const mutate = useCallback((changes: RawCells) => {
    const keys = Object.keys(changes).filter(k => sheet.getRaw(k) !== changes[k]);
    if (!keys.length) return;
    history.current.push(sheet.toJSON());
    if (history.current.length > 100) history.current.shift();
    future.current = [];
    sheet.setMany(changes);
    rerender();
    onChange?.(keys);
  }, [sheet, onChange]);

  const restore = (snap: RawCells) => {
    const all = new Set([...sheet.keys(), ...Object.keys(snap)]);
    const changes: RawCells = {};
    all.forEach(k => { changes[k] = snap[k] ?? ''; });
    sheet.setMany(changes);
    rerender();
    onChange?.([...all]);
  };
  const undo = () => { const s = history.current.pop(); if (!s) return; future.current.push(sheet.toJSON()); restore(s); };
  const redo = () => { const s = future.current.pop(); if (!s) return; history.current.push(sheet.toJSON()); restore(s); };

  const focusGrid = () => gridRef.current?.focus({ preventScroll: true });
  const move = (dc: number, dr: number, extend = false) => {
    const n = { c: Math.max(0, Math.min(nCols - 1, sel.c + dc)), r: Math.max(0, Math.min(nRows - 1, sel.r + dr)) };
    setSel(n);
    if (!extend) setAnchor(n);
    scrollIntoView(n);
  };
  const scrollIntoView = (p: Pos) => {
    const sc = gridRef.current?.parentElement;
    if (!sc) return;
    const left = colX[p.c], right = colX[p.c + 1], top = HH + p.r * ROWH, bottom = top + ROWH;
    if (left - RH < sc.scrollLeft) sc.scrollLeft = left - RH;
    else if (right > sc.scrollLeft + sc.clientWidth) sc.scrollLeft = right - sc.clientWidth;
    if (top - HH < sc.scrollTop) sc.scrollTop = top - HH;
    else if (bottom > sc.scrollTop + sc.clientHeight) sc.scrollTop = bottom - sc.clientHeight;
  };

  const startEdit = (initial: string, where: 'cell' | 'bar') => {
    setEditing(where);
    setDraft(initial);
    setAcIndex(0);
    pointIns.current = null;
    pendingCaret.current = initial.length;
  };
  const cancelEdit = () => { setEditing(null); setDraft(''); pointIns.current = null; focusGrid(); };
  const commit = (dc: number, dr: number, refocus = true) => {
    const value = normalizeInput(draft);
    const target = nameOf(sel);
    setEditing(null);
    setDraft('');
    pointIns.current = null;
    mutate({ [target]: value });
    const n = { c: Math.max(0, Math.min(nCols - 1, sel.c + dc)), r: Math.max(0, Math.min(nRows - 1, sel.r + dr)) };
    setSel(n); setAnchor(n);
    scrollIntoView(n);
    if (refocus) focusGrid();
  };
  const wrapRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const commitLatest = useRef<() => void>(() => {});
  commitLatest.current = () => commit(0, 0, false);
  const onEditBlur = () => {
    setTimeout(() => {
      if (editingRef.current && !wrapRef.current?.contains(document.activeElement)) commitLatest.current();
    }, 0);
  };

  // ---------- kopier, lim inn, fyll ----------
  const rawGrid = (r: Rect) => {
    const rows: string[][] = [];
    for (let y = r.r1; y <= r.r2; y++) { const row: string[] = []; for (let x = r.c1; x <= r.c2; x++) row.push(sheet.getRaw(nameOf({ c: x, r: y }))); rows.push(row); }
    return rows;
  };
  const fill = (src: Rect, dest: Rect) => {
    const w = src.c2 - src.c1 + 1, h = src.r2 - src.r1 + 1;
    const ch: RawCells = {};
    for (let y = dest.r1; y <= dest.r2; y++) for (let x = dest.c1; x <= dest.c2; x++) {
      if (x >= src.c1 && x <= src.c2 && y >= src.r1 && y <= src.r2) continue;
      const sx = src.c1 + ((x - src.c1) % w + w) % w, sy = src.r1 + ((y - src.r1) % h + h) % h;
      ch[nameOf({ c: x, r: y })] = shiftFormula(sheet.getRaw(nameOf({ c: sx, r: sy })), x - sx, y - sy);
    }
    mutate(ch);
  };
  const doCopy = (cut = false) => {
    const cells = rawGrid(selRect);
    const text = cells.map(r => r.join('\t')).join('\n');
    clip.current = { text, cells, origin: { c: selRect.c1, r: selRect.r1 } };
    if (cut) { const ch: RawCells = {}; for (let y = selRect.r1; y <= selRect.r2; y++) for (let x = selRect.c1; x <= selRect.c2; x++) ch[nameOf({ c: x, r: y })] = ''; mutate(ch); }
    return text;
  };
  const doPaste = (text?: string) => {
    const cb = clip.current;
    let cells: string[][], origin: Pos | null = null;
    if (cb && (text === undefined || text.replace(/\r/g, '') === cb.text)) { cells = cb.cells; origin = cb.origin; }
    else if (text !== undefined) cells = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(l => l.split('\t'));
    else return;
    const h = cells.length, w = cells[0].length;
    const single = h === 1 && w === 1;
    const dest = single && (selRect.c2 > selRect.c1 || selRect.r2 > selRect.r1) ? selRect : { c1: sel.c < anchor.c ? sel.c : anchor.c, r1: Math.min(sel.r, anchor.r), c2: Math.min(sel.c, anchor.c) + w - 1, r2: Math.min(sel.r, anchor.r) + h - 1 };
    const ch: RawCells = {};
    for (let y = dest.r1; y <= dest.r2; y++) for (let x = dest.c1; x <= dest.c2; x++) {
      const sy = (y - dest.r1) % h, sx = (x - dest.c1) % w;
      const raw = cells[sy][sx] ?? '';
      ch[nameOf({ c: x, r: y })] = origin ? shiftFormula(raw, x - (origin.c + sx), y - (origin.r + sy)) : raw;
    }
    mutate(ch);
    setAnchor({ c: dest.c1, r: dest.r1 }); setSel({ c: dest.c2, r: dest.r2 });
  };

  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      if (document.activeElement !== gridRef.current || editing) return;
      e.preventDefault();
      e.clipboardData?.setData('text/plain', doCopy());
    };
    const onCut = (e: ClipboardEvent) => {
      if (document.activeElement !== gridRef.current || editing) return;
      e.preventDefault();
      e.clipboardData?.setData('text/plain', doCopy(true));
    };
    const onPaste = (e: ClipboardEvent) => {
      if (document.activeElement !== gridRef.current || editing) return;
      e.preventDefault();
      doPaste(e.clipboardData?.getData('text/plain') ?? undefined);
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    return () => { document.removeEventListener('copy', onCopy); document.removeEventListener('cut', onCut); document.removeEventListener('paste', onPaste); };
  });

  // ---------- tastatur ----------
  const onGridKey = (e: React.KeyboardEvent) => {
    if (editing) return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
    if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); if (selRect.r2 > selRect.r1) fill({ ...selRect, r2: selRect.r1 }, selRect); return; }
    if (mod && (k === 'r' || k === 'R')) { e.preventDefault(); if (selRect.c2 > selRect.c1) fill({ ...selRect, c2: selRect.c1 }, selRect); return; }
    if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); setAnchor({ c: 0, r: 0 }); setSel({ c: nCols - 1, r: nRows - 1 }); return; }
    if (mod) return; // kopier/lim inn håndteres av nettleserens hendelser
    switch (k) {
      case 'ArrowUp': e.preventDefault(); move(0, -1, e.shiftKey); return;
      case 'ArrowDown': e.preventDefault(); move(0, 1, e.shiftKey); return;
      case 'ArrowLeft': e.preventDefault(); move(-1, 0, e.shiftKey); return;
      case 'ArrowRight': e.preventDefault(); move(1, 0, e.shiftKey); return;
      case 'Enter': e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return;
      case 'Tab': e.preventDefault(); move(e.shiftKey ? -1 : 1, 0); return;
      case 'F2': e.preventDefault(); startEdit(sheet.getRaw(nameOf(sel)), 'cell'); return;
      case 'Delete': case 'Backspace': {
        e.preventDefault();
        const ch: RawCells = {};
        for (let y = selRect.r1; y <= selRect.r2; y++) for (let x = selRect.c1; x <= selRect.c2; x++) ch[nameOf({ c: x, r: y })] = '';
        mutate(ch);
        return;
      }
    }
    if (k.length === 1 && !e.altKey) { e.preventDefault(); setAnchor(sel); startEdit(k, 'cell'); }
  };

  const ac = editing ? suggestions(draft.slice(0, caret)) : null;
  const acceptAc = (f: FnMeta) => {
    if (!ac) return;
    const before = draft.slice(0, caret), after = draft.slice(caret);
    const head = before.slice(0, before.length - ac.token.length) + f.no + '(';
    setDraft(head + after);
    pendingCaret.current = head.length;
    setAcIndex(0);
  };
  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (ac) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => (i + 1) % ac.list.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcIndex(i => (i - 1 + ac.list.length) % ac.list.length); return; }
      if (e.key === 'Tab') { e.preventDefault(); acceptAc(ac.list[Math.min(acIndex, ac.list.length - 1)]); return; }
    }
    if (e.key === 'Enter') { e.preventDefault(); commit(0, e.shiftKey ? -1 : 1); return; }
    if (e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? -1 : 1, 0); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
  };
  const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    setCaret(e.target.selectionStart ?? e.target.value.length);
    pointIns.current = null;
    setAcIndex(0);
  };
  const trackCaret = (e: React.SyntheticEvent<HTMLInputElement>) => setCaret(e.currentTarget.selectionStart ?? 0);

  // ---------- mus og berøring ----------
  const posAt = (x: number, y: number): Pos | null => {
    const el = document.elementFromPoint(x, y)?.closest('[data-c]') as HTMLElement | null;
    if (!el || !gridRef.current?.contains(el)) return null;
    return { c: Number(el.dataset.c), r: Number(el.dataset.r) };
  };
  const canPoint = () => {
    if (!editing || !draft.startsWith('=')) return false;
    if (pointIns.current && caret === pointIns.current.end) return true;
    return POINT_BEFORE.test(draft.slice(0, caret));
  };
  const insertRef = (r: Rect) => {
    const ins = pointIns.current;
    const startAt = ins ? ins.start : caret;
    const endAt = ins ? ins.end : caret;
    const text = refText(r);
    const next = draft.slice(0, startAt) + text + draft.slice(endAt);
    setDraft(next);
    pointIns.current = { start: startAt, end: startAt + text.length, anchor: ins?.anchor ?? { c: r.c1, r: r.r1 } };
    pendingCaret.current = startAt + text.length;
  };

  const onCellDown = (e: React.PointerEvent, p: Pos) => {
    if (e.button !== 0) return;
    if (editing) {
      if (canPoint()) {
        e.preventDefault();
        pointIns.current = pointIns.current && caret === pointIns.current.end ? { ...pointIns.current, anchor: p } : null;
        insertRef(rectOf(p, p));
        if (pointIns.current) pointIns.current.anchor = p;
        dragSel.current = true;
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      commit(0, 0);
    }
    if (e.shiftKey) { setSel(p); return; }
    const already = p.c === sel.c && p.r === sel.r && anchor.c === sel.c && anchor.r === sel.r;
    setSel(p); setAnchor(p);
    if (e.pointerType === 'mouse') { dragSel.current = true; focusGrid(); }
    else if (already) { barInput.current?.focus(); }
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };
  const onGridMove = (e: React.PointerEvent) => {
    if (fillDrag.current) {
      const p = posAt(e.clientX, e.clientY); if (!p) return;
      const s = fillDrag.current;
      const down = p.r - s.r2, right = p.c - s.c2;
      if (down <= 0 && right <= 0) setFillTo(null);
      else if (down >= right) setFillTo({ ...s, r2: Math.max(s.r2, p.r) });
      else setFillTo({ ...s, c2: Math.max(s.c2, p.c) });
      return;
    }
    if (!dragSel.current || !(e.buttons & 1)) return;
    const p = posAt(e.clientX, e.clientY); if (!p) return;
    if (editing && pointIns.current) { insertRef(rectOf(pointIns.current.anchor, p)); return; }
    if (!editing) setSel(p);
  };
  const onGridUp = () => {
    dragSel.current = false;
    if (fillDrag.current) {
      const src = fillDrag.current;
      fillDrag.current = null;
      if (fillTo) { fill(src, fillTo); setAnchor({ c: fillTo.c1, r: fillTo.r1 }); setSel({ c: fillTo.c2, r: fillTo.r2 }); }
      setFillTo(null);
      focusGrid();
    }
  };
  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (editing) commit(0, 0);
    fillDrag.current = selRect;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  // ---------- visning ----------
  const selName = nameOf(sel);
  const selRaw = sheet.getRaw(selName);
  const shownFormula = editing ? draft : selRaw;
  const refs = shownFormula.startsWith('=') ? referencedRanges(shownFormula) : [];
  let parseErr = '';
  if (!editing && selRaw.startsWith('=')) {
    try { parse(selRaw); } catch (e) { if (e instanceof ParseError) parseErr = e.message; }
    if (!parseErr) { const info = sheet.info(selName); if (info.error) parseErr = info.error; }
  }
  const call = editing ? callAt(draft.slice(0, caret)) : null;
  const meta = call ? byName.get(call.name) : undefined;
  const syntaxParts = meta ? (() => { const m = /^([^(]+)\((.*)\)$/.exec(meta.syntax); return m ? { fn: m[1], args: m[2].split(';').map(s => s.trim()) } : null; })() : null;
  const boldSet = new Set(bold.map(r => r - 1));
  const selBox = box(selRect);
  const editW = Math.max(colW[sel.c] ?? DEFW, Math.min(560, draft.length * 8.6 + 20));

  const cellClass = (v: Scalar, r: number) => {
    let cls = 'c';
    if (typeof v === 'number') cls += ' num';
    else if (typeof v === 'boolean') cls += ' bool';
    else if (isErr(v)) cls += ' err';
    if (boldSet.has(r)) cls += ' b';
    return cls;
  };

  const rows = [];
  for (let r = 0; r < nRows; r++) {
    rows.push(<div key={`rh${r}`} className={`rh${r >= selRect.r1 && r <= selRect.r2 ? ' on' : ''}`} style={{ height: ROWH }}>{r + 1}</div>);
    for (let c = 0; c < nCols; c++) {
      const a = nameOf({ c, r });
      const v = sheet.value(a);
      rows.push(
        <div key={a} data-c={c} data-r={r} className={cellClass(v, r)} onPointerDown={e => onCellDown(e, { c, r })}
          onDoubleClick={() => { if (!editing) startEdit(sheet.getRaw(a), 'cell'); }} title={isErr(v) ? sheet.info(a).error : undefined}>
          {display(v, formats[a] ?? 'general')}
        </div>,
      );
    }
  }

  return (
    <div className="sheetwrap" ref={wrapRef}>
      <div className="fbar">
        <div className="nm">{selRect.c1 === selRect.c2 && selRect.r1 === selRect.r2 ? selName : refText(selRect)}</div>
        <div className="fx">fx</div>
        <input
          ref={barInput}
          aria-label="Formellinje"
          value={shownFormula}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="done"
          onFocus={() => { if (editing !== 'bar') { if (editing === 'cell') setEditing('bar'); else startEdit(selRaw, 'bar'); } }}
          onChange={onEditChange}
          onKeyDown={onEditKey}
          onKeyUp={trackCaret}
          onClick={trackCaret}
          onSelect={trackCaret}
          onBlur={onEditBlur}
        />
        {editing === 'bar' && ac && <Autocomplete ac={ac} index={acIndex} onPick={acceptAc} style={{ left: 106, top: 46 }} />}
        {editing === 'bar' && !ac && syntaxParts && <Syntax parts={syntaxParts} arg={call!.arg} style={{ left: 106, top: 48 }} />}
      </div>
      <div className="gridscroll" style={compact ? { maxHeight: 360 } : undefined}>
        <div
          ref={gridRef}
          className="grid"
          tabIndex={0}
          role="grid"
          aria-label="Regneark"
          onKeyDown={onGridKey}
          onPointerMove={onGridMove}
          onPointerUp={onGridUp}
          onPointerCancel={onGridUp}
          style={{ gridTemplateColumns: `${RH}px ${colW.map(w => `${w}px`).join(' ')}`, width: colX[nCols] }}
        >
          <div className="corner" style={{ height: HH }} />
          {colW.map((_, c) => <div key={`ch${c}`} className={`gh${c >= selRect.c1 && c <= selRect.c2 ? ' on' : ''}`}>{colName(c)}</div>)}
          {rows}

          {targets.map((t, i) => <div key={`t${i}`} className={`ov target${t.ok ? ' ok' : ''}`} style={box(specRect(t.spec))} />)}
          {refs.map((r, i) => <div key={`r${i}`} className="ov ref" style={{ ...box(r), borderColor: REF_COLORS[i % REF_COLORS.length], background: `${REF_COLORS[i % REF_COLORS.length]}14` }} />)}
          {(selRect.c1 !== selRect.c2 || selRect.r1 !== selRect.r2) && <div className="ov selfill" style={selBox} />}
          <div className="ov sel" style={selBox} />
          {fillTo && <div className="ov fillprev" style={box(fillTo)} />}
          {!editing && <div className="handle" onPointerDown={onHandleDown} style={{ left: selBox.left + selBox.width - 7, top: selBox.top + selBox.height - 7 }} aria-label="Fyllhåndtak" />}
          {!editing && parseErr && <div className="parseerr" style={{ left: selBox.left, top: selBox.top + selBox.height + 4 }}>{parseErr}</div>}

          {editing === 'cell' && (
            <input
              ref={cellInput}
              className="celledit"
              aria-label={`Rediger ${selName}`}
              value={draft}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              onChange={onEditChange}
              onKeyDown={onEditKey}
              onKeyUp={trackCaret}
              onClick={trackCaret}
              onSelect={trackCaret}
              onBlur={onEditBlur}
              style={{ left: colX[sel.c] - 1, top: HH + sel.r * ROWH - 1, width: editW, height: ROWH + 2 }}
            />
          )}
          {editing === 'cell' && ac && <Autocomplete ac={ac} index={acIndex} onPick={acceptAc} style={{ left: colX[sel.c], top: HH + (sel.r + 1) * ROWH + 4 }} />}
          {editing === 'cell' && !ac && syntaxParts && <Syntax parts={syntaxParts} arg={call!.arg} style={{ left: colX[sel.c], top: HH + (sel.r + 1) * ROWH + 4 }} />}
        </div>
      </div>
      {!compact && (
        <div className="sheetfoot">
          <span>
            <span className="kbd">Enter</span> lagre · <span className="kbd">Tab</span> velg funksjon · Dra <b style={{ color: 'var(--sig-ink)' }}>■</b> for å fylle ned · <span className="kbd">Ctrl</span>+<span className="kbd">C</span>/<span className="kbd">V</span> kopier
          </span>
          <span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={undo} disabled={!history.current.length}>Angre</button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={redo} disabled={!future.current.length}>Gjør om</button>
          </span>
        </div>
      )}
    </div>
  );
}

function Autocomplete({ ac, index, onPick, style }: { ac: { list: FnMeta[] }; index: number; onPick: (f: FnMeta) => void; style: React.CSSProperties }) {
  return (
    <div className="ac" style={style} role="listbox">
      {ac.list.map((f, i) => (
        <button key={f.no} type="button" role="option" aria-selected={i === index} onPointerDown={e => { e.preventDefault(); onPick(f); }}>
          <b>{f.no}{f.en !== f.no ? <span style={{ fontWeight: 400 }}> · {f.en}</span> : null}</b>
          <span>{f.desc}</span>
        </button>
      ))}
      <div style={{ padding: '6px 12px', fontSize: 11.5, color: 'var(--dim)', borderTop: '1px solid var(--line)' }}>Tab for å velge</div>
    </div>
  );
}

function Syntax({ parts, arg, style }: { parts: { fn: string; args: string[] }; arg: number; style: React.CSSProperties }) {
  const last = parts.args.length - 1;
  const on = parts.args[last]?.includes('…') && arg >= last ? last : Math.min(arg, last);
  return (
    <div className="syntax" style={style}>
      {parts.fn}(
      {parts.args.map((a, i) => <span key={i}>{i > 0 ? '; ' : ''}<span className={i === on ? 'on' : ''}>{a}</span></span>)}
      )
    </div>
  );
}

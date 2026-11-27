import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../src/lib/engine/functions';
import { EXAMPLES } from '../src/content/functionExamples';
import { Sheet } from '../src/lib/engine/sheet';
import { isErr } from '../src/lib/engine/core';
import { display } from '../src/lib/engine/format';
import { parse, functionsUsed } from '../src/lib/engine/parser';
import { lookupFn } from '../src/lib/engine/functions';

test('alle funksjoner har et eksempel som virker og bruker funksjonen', () => {
  for (const f of CATALOG) {
    const ex = EXAMPLES[f.no];
    assert.ok(ex, `mangler eksempel for ${f.no}`);
    const s = new Sheet({ ...ex.cells, [ex.at]: ex.formula }, { now: () => new Date(2026, 10, 27, 12) });
    const v = s.value(ex.at);
    if (!['ERFEIL', 'SANN', 'USANN'].includes(f.no)) assert.ok(!isErr(v), `${f.no}: ${ex.formula} gir ${display(v)}`);
    const used = [...functionsUsed(parse(ex.formula))];
    if (!['SANN', 'USANN'].includes(f.no)) assert.ok(used.some(u => lookupFn(u) === lookupFn(f.no)), `${f.no}: eksempelet bruker ikke funksjonen`);
    if (process.env.SHOW) console.log(f.no.padEnd(24), ex.formula.padEnd(60), display(v, ex.formats?.[ex.at] ?? 'general'));
  }
});

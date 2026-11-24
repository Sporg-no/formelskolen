import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS } from '../src/content/lessons';
import { Sheet, shiftFormula } from '../src/lib/engine/sheet';
import { gradeTask, taskCells, expand } from '../src/lib/engine/grade';
import { parseAddr } from '../src/lib/engine/core';
import { display } from '../src/lib/engine/format';

const now = () => new Date(2026, 10, 24, 12);

for (const l of LESSONS) {
  test(`leksjon ${l.nr}: ${l.title}`, () => {
    const sheet = new Sheet(l.cells, { now });
    const fixed = expand(l.fixed ?? []);
    // Tomt ark skal ikke bestå
    for (const t of l.tasks) assert.equal(gradeTask(sheet, t, fixed).ok, false, `tom ${t.cell} ble godkjent`);
    for (const t of l.tasks) {
      const cells = taskCells(t);
      const first = parseAddr(cells[0])!;
      for (const c of cells) {
        const p = parseAddr(c)!;
        sheet.set(c, shiftFormula(t.solution, p.col - first.col, p.row - first.row));
      }
      const r = gradeTask(sheet, t, fixed);
      assert.equal(r.ok, true, `${t.cell}: ${r.message}`);
      for (const c of cells) {
        const v = sheet.value(c);
        const ok = !(v && typeof v === 'object');
        assert.ok(ok || l.slug === 'xoppslag', `${c} gir feil ${display(v)}`);
      }
    }
    if (process.env.SHOW) for (const t of l.tasks) console.log(l.slug, t.cell, taskCells(t).map(c => display(sheet.value(c))).join(' | '));
  });
}

test('unike slugs', () => {
  assert.equal(new Set(LESSONS.map(l => l.slug)).size, LESSONS.length);
});

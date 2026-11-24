import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sheet, shiftFormula, parseInput } from '../src/lib/engine/sheet';
import { isErr } from '../src/lib/engine/core';
import { display } from '../src/lib/engine/format';
import { gradeTask } from '../src/lib/engine/grade';

const now = () => new Date(2026, 10, 24, 12, 0);
const S = (cells: Record<string, string>) => new Sheet(cells, { now });
const ev = (f: string, cells: Record<string, string> = {}) => S(cells).evalFormula(f);
const code = (v: unknown) => (isErr(v) ? v.code : v);

test('aritmetikk og presedens', () => {
  assert.equal(ev('=1+2*3'), 7);
  assert.equal(ev('=(1+2)*3'), 9);
  assert.equal(ev('=-2^2'), 4);
  assert.equal(ev('=2^3^2'), 64);
  assert.equal(ev('=10/4'), 2.5);
  assert.equal(ev('=1,5*2'), 3);
  assert.equal(ev('=200*25%'), 50);
  assert.equal(code(ev('=1/0')), '#DIV/0!');
  assert.equal(ev('="a"&"b"&1,5'), 'ab1,5');
  assert.equal(ev('=2>1'), true);
  assert.equal(ev('="abc"="ABC"'), true);
});

test('inndata tolkes norsk', () => {
  assert.equal(parseInput('1 234,5'), 1234.5);
  assert.equal(parseInput('25 %'), 0.25);
  assert.equal(parseInput('kr 199'), 199);
  assert.equal(parseInput('17.05.2026'), 46159);
  assert.equal(parseInput('Hei'), 'Hei');
  assert.equal(parseInput('07:30'), 7.5 / 24);
});

test('referanser, områder, sirkel', () => {
  const s = S({ A1: '2', A2: '3', A3: '=A1*A2', B1: '=SUMMER(A1:A3)', C1: '=C2', C2: '=C1' });
  assert.equal(s.value('A3'), 6);
  assert.equal(s.value('B1'), 11);
  assert.equal(code(s.value('C1')), '#SIRKEL!');
  assert.equal(code(S({ A1: '=FOO(1)' }).value('A1')), '#NAVN?');
  assert.equal(S({ A1: '=SUMMER(B:B)', B1: '1', B2: '2', B5: '4' }).value('A1'), 7);
});

test('statistikk', () => {
  const c = { A1: '4', A2: '8', A3: 'tekst', A4: '', A5: '6' };
  assert.equal(ev('=GJENNOMSNITT(A1:A5)', c), 6);
  assert.equal(ev('=STØRST(A1:A5)', c), 8);
  assert.equal(ev('=MAKS(A1:A5)', c), 8);
  assert.equal(ev('=MAX(A1:A5)', c), 8);
  assert.equal(ev('=MIN(A1:A5)', c), 4);
  assert.equal(ev('=ANTALL(A1:A5)', c), 3);
  assert.equal(ev('=ANTALLA(A1:A5)', c), 4);
  assert.equal(ev('=TELLBLANKE(A1:A5)', c), 1);
  assert.equal(ev('=MEDIAN(A1:A5)', c), 6);
  assert.equal(ev('=N.STØRST(A1:A5;2)', c), 6);
  assert.equal(ev('=RANG(8;A1:A5)', c), 1);
});

test('logikk', () => {
  assert.equal(ev('=HVIS(5>3;"Ja";"Nei")'), 'Ja');
  assert.equal(ev('=IF(5<3,"Ja","Nei")'), 'Nei');
  assert.equal(ev('=HVIS(OG(1>0;2>1);1;0)'), 1);
  assert.equal(ev('=ELLER(USANN;SANN)'), true);
  assert.equal(ev('=IKKE(SANN)'), false);
  assert.equal(ev('=HVIS.SETT(45>=90;"A";45>=40;"E";SANN;"F")'), 'E');
  assert.equal(ev('=HVISFEIL(1/0;"feil")'), 'feil');
  assert.equal(ev('=HVIS(1=1;1/0;0)') instanceof Object, true);
});

test('betinget telling og sum', () => {
  const c = { A1: 'Oslo', A2: 'Bergen', A3: 'Oslo', A4: 'Stavanger', B1: '100', B2: '200', B3: '50', B4: '300' };
  assert.equal(ev('=ANTALL.HVIS(A1:A4;"Oslo")', c), 2);
  assert.equal(ev('=ANTALL.HVIS(A1:A4;"S*")', c), 1);
  assert.equal(ev('=ANTALL.HVIS(B1:B4;">=200")', c), 2);
  assert.equal(ev('=SUMMERHVIS(A1:A4;"oslo";B1:B4)', c), 150);
  assert.equal(ev('=SUMMERHVIS(B1:B4;">100")', c), 500);
  assert.equal(ev('=SUMMER.HVIS.SETT(B1:B4;A1:A4;"Oslo";B1:B4;">60")', c), 100);
  assert.equal(ev('=ANTALL.HVIS.SETT(A1:A4;"<>Oslo";B1:B4;">250")', c), 1);
  assert.equal(ev('=GJENNOMSNITTHVIS(A1:A4;"Oslo";B1:B4)', c), 75);
});

test('oppslag', () => {
  const c = { A1: '101', B1: 'Kaffe', C1: '49', A2: '102', B2: 'Te', C2: '39', A3: '103', B3: 'Kakao', C3: '45' };
  assert.equal(ev('=FINN.RAD(102;A1:C3;2;USANN)', c), 'Te');
  assert.equal(ev('=VLOOKUP(103,A1:C3,3,FALSE)', c), 45);
  assert.equal(code(ev('=FINN.RAD(999;A1:C3;2;USANN)', c)), '#I/T');
  assert.equal(ev('=FINN.RAD(102,5;A1:C3;2)', c), 'Te');
  assert.equal(ev('=INDEKS(B1:B3;SAMMENLIGNE("Kakao";B1:B3;0))', c), 'Kakao');
  assert.equal(ev('=INDEKS(A1:C3;2;3)', c), 39);
  assert.equal(ev('=XOPPSLAG("Te";B1:B3;C1:C3)', c), 39);
  assert.equal(ev('=XOPPSLAG("Juice";B1:B3;C1:C3;"Finnes ikke")', c), 'Finnes ikke');
  assert.equal(ev('=SUMMERPRODUKT(A1:A3;C1:C3)', c), 101 * 49 + 102 * 39 + 103 * 45);
  assert.equal(ev('=SUMMERPRODUKT((C1:C3>40)*C1:C3)', c), 94);
});

test('tekst', () => {
  assert.equal(ev('=VENSTRE("Stavanger";4)'), 'Stav');
  assert.equal(ev('=HØYRE("Stavanger";3)'), 'ger');
  assert.equal(ev('=DELTEKST("Stavanger";5;2)'), 'an');
  assert.equal(ev('=LENGDE("Bryne")'), 5);
  assert.equal(ev('=STOR.FORBOKSTAV("ola nordmann")'), 'Ola Nordmann');
  assert.equal(ev('=STORE("ærlig")'), 'ÆRLIG');
  assert.equal(ev('=TRIMME("  to   ord ")'), 'to ord');
  assert.equal(ev('=FINN(" ";"Kari Hansen")'), 5);
  assert.equal(ev('=SØK("han";"Kari Hansen")'), 6);
  assert.equal(ev('=BYTT.UT("1.234";".";"")'), '1234');
  assert.equal(ev('=KJEDE.SAMMEN("a";"b";"c")'), 'abc');
  assert.equal(ev('=TEKST.KOMBINER(", ";SANN;"a";"";"b")'), 'a, b');
  assert.equal(ev('=TEKST(1234,5;"# ##0,00")'), '1 234,50');
  assert.equal(ev('=TEKST(0,256;"0,0%")'), '25,6%');
  assert.equal(ev('=VERDI("12,5")'), 12.5);
});

test('dato', () => {
  const c = { A1: '17.05.2026', A2: '24.12.2026' };
  assert.equal(ev('=ÅR(A1)', c), 2026);
  assert.equal(ev('=MÅNED(A1)', c), 5);
  assert.equal(ev('=DAG(A1)', c), 17);
  assert.equal(ev('=A2-A1', c), 221);
  assert.equal(ev('=DATO(2026;5;17)', c), 46159);
  assert.equal(ev('=UKEDAG(A1;2)', c), 7); // søndag
  assert.equal(ev('=ISOUKENR(DATO(2026;1;1))'), 1);
  assert.equal(ev('=ISOUKENR(DATO(2027;1;1))'), 53);
  assert.equal(ev('=NETT.ARBEIDSDAGER(DATO(2026;11;23);DATO(2026;11;29))'), 5);
  assert.equal(display(ev('=DAG.ETTER(DATO(2026;1;31);1)') as number, 'dato'), '28.02.2026');
  assert.equal(display(ev('=MÅNEDSSLUTT(DATO(2026;2;10);0)') as number, 'dato'), '28.02.2026');
  assert.equal(ev('=DATODIFF(DATO(1990;6;15);DATO(2026;6;14);"Y")'), 35);
  assert.equal(ev('=IDAG()'), 46350);
  assert.equal(display(1, 'dato'), '01.01.1900');
});

test('økonomi', () => {
  const p = ev('=AVDRAG(5%/12;300;-3000000)') as number;
  assert.ok(Math.abs(p - 17537.7) < 1);
  assert.equal(ev('=AVRUND(2,345;2)'), 2.35);
  assert.equal(ev('=AVRUND(-2,5;0)'), -3);
  assert.equal(ev('=AVRUND.OPP(2,01;0)'), 3);
  assert.equal(ev('=AVRUND.NED(2,99;0)'), 2);
  assert.equal(ev('=REST(-3;2)'), 1);
});

test('kopiering flytter relative referanser', () => {
  assert.equal(shiftFormula('=B2*C2', 0, 1), '=B3*C3');
  assert.equal(shiftFormula('=B2*$F$1', 0, 3), '=B5*$F$1');
  assert.equal(shiftFormula('=$B2+C$1', 1, 1), '=$B3+D$1');
  assert.equal(shiftFormula('=SUMMER(B2:B5)&"B2"', 1, 0), '=SUMMER(C2:C5)&"B2"');
  assert.equal(shiftFormula('=FINN.RAD(A2;$H$2:$I$9;2;USANN)', 0, 1), '=FINN.RAD(A3;$H$2:$I$9;2;USANN)');
  assert.equal(shiftFormula('=A1', 0, -1), '=#REF!');
});

test('retting avslører hardkoding og godtar riktige formler', () => {
  const base = { A1: 'Antall', B1: 'Pris', A2: '3', B2: '20', A3: '5', B3: '15' };
  const task = { cell: 'C2:C3', solution: '=A2*B2', prompt: '' };
  assert.equal(gradeTask(S({ ...base, C2: '=A2*B2', C3: '=A3*B3' }), task).ok, true);
  assert.equal(gradeTask(S({ ...base, C2: '=B2*A2', C3: '=PRODUKT(A3;B3)' }), task).ok, true);
  assert.equal(gradeTask(S({ ...base, C2: '=60', C3: '=75' }), task).ok, false);
  assert.equal(gradeTask(S({ ...base, C2: '60', C3: '75' }), task).ok, false);
  assert.equal(gradeTask(S({ ...base, C2: '=A2*B2' }), task).ok, false);
  const abs = { cell: 'C2:C3', solution: '=B2*$F$1', prompt: '', mustContain: ['$'] };
  const b2 = { ...base, F1: '25%' };
  assert.equal(gradeTask(S({ ...b2, C2: '=B2*$F$1', C3: '=B3*$F$1' }), abs).ok, true);
  assert.equal(gradeTask(S({ ...b2, C2: '=B2*F1', C3: '=B3*F2' }), abs).ok, false);
  const must = { cell: 'B4', solution: '=SUMMER(B2:B3)', prompt: '', mustUse: ['SUMMER'] };
  assert.equal(gradeTask(S({ ...base, B4: '=B2+B3' }), must).ok, false);
  assert.equal(gradeTask(S({ ...base, B4: '=SUM(B2:B3)' }), must).ok, true);
});

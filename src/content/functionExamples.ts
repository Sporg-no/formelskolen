// Ett eksempel per funksjon til funksjonssidene. Tabellen starter i A1; formelen står i `at`.
import { table } from './types';
import type { CellFormat } from '@/lib/engine/format';

export type FnExample = {
  cells: Record<string, string>;
  at: string;
  formula: string;
  /** Hva eksempelet viser, i én setning. */
  text: string;
  formats?: Record<string, CellFormat>;
  widths?: Record<string, number>;
  /** Vanlige feil eller tips (valgfritt). */
  tips?: string[];
};

const salg = table('A1', [['Selger', 'Region', 'Beløp'], ['Kari', 'Vest', 4200], ['Jonas', 'Øst', 7800], ['Kari', 'Øst', 6100], ['Mona', 'Vest', 3500], ['Jonas', 'Vest', 5400]]);
const tall = table('A1', [['Måned', 'Salg'], ['Jan', 120], ['Feb', 95], ['Mar', 143], ['Apr', 88], ['Mai', 160]]);
const varer = table('A1', [['Varenr', 'Vare', 'Pris'], [1001, 'Kaffe', 89.9], [1002, 'Te', 34.9], [1003, 'Kakao', 42.5], [1004, 'Melk', 22.9]]);
const datoer = table('A1', [['Dato', 'Svar'], ['17.05.2026']]);
const w = (o: Record<string, number>) => o;

export const EXAMPLES: Record<string, FnExample> = {
  // Matte
  'SUMMER': { cells: tall, at: 'B7', formula: '=SUMMER(B2:B6)', text: 'Summerer salget for alle fem månedene.', tips: ['Bruk kolon for område (B2:B6) og semikolon mellom flere områder: =SUMMER(B2:B3;B5).', 'Alt+= setter inn SUMMER automatisk i Excel.'] },
  'PRODUKT': { cells: table('A1', [['Faktor', 'Verdi'], ['Lengde', 4], ['Bredde', 2.5], ['Høyde', 3]]), at: 'B5', formula: '=PRODUKT(B2:B4)', text: 'Ganger lengde, bredde og høyde for å finne volumet.' },
  'SUMMERPRODUKT': { cells: table('A1', [['Vare', 'Antall', 'Pris'], ['Hammer', 4, 189], ['Skrutrekker', 10, 79], ['Tape', 25, 39]]), at: 'C5', formula: '=SUMMERPRODUKT(B2:B4;C2:C4)', text: 'Ganger antall med pris rad for rad og summerer: total lagerverdi.', tips: ['Alle områdene må være like store, ellers får du #VERDI!.'] },
  'AVRUND': { cells: table('A1', [['Utregnet', 'Avrundet'], [87.4562]]), at: 'B2', formula: '=AVRUND(A2;2)', text: 'Runder av til to desimaler (øre).', tips: ['Negativt antall sifre runder til tiere, hundrere osv.: =AVRUND(A2;-1).', 'Formatering endrer bare visningen. AVRUND endrer selve tallet.'] },
  'AVRUND.OPP': { cells: table('A1', [['Utregnet', 'Avrundet'], [12.01]]), at: 'B2', formula: '=AVRUND.OPP(A2;0)', text: 'Runder alltid opp til nærmeste hele tall.' },
  'AVRUND.NED': { cells: table('A1', [['Utregnet', 'Avrundet'], [12.99]]), at: 'B2', formula: '=AVRUND.NED(A2;0)', text: 'Runder alltid ned til nærmeste hele tall.' },
  'AVKORT': { cells: table('A1', [['Tall', 'Avkortet'], [-7.86]]), at: 'B2', formula: '=AVKORT(A2;1)', text: 'Kutter etter første desimal uten å runde.' },
  'HELTALL': { cells: table('A1', [['Tall', 'Heltall'], [7.86]]), at: 'B2', formula: '=HELTALL(A2)', text: 'Runder ned til nærmeste heltall.', tips: ['For negative tall går HELTALL lenger ned: HELTALL(-7,2) gir -8. Bruk AVKORT hvis du bare vil fjerne desimalene.'] },
  'ABS': { cells: table('A1', [['Avvik', 'Absolutt'], [-350]]), at: 'B2', formula: '=ABS(A2)', text: 'Fjerner minustegnet.' },
  'ROT': { cells: table('A1', [['Areal m²', 'Side'], [64]]), at: 'B2', formula: '=ROT(A2)', text: 'Finner sidelengden i et kvadrat ut fra arealet.' },
  'OPPHØYD.I': { cells: table('A1', [['Tall', 'Potens', 'Svar'], [2, 10]]), at: 'C2', formula: '=OPPHØYD.I(A2;B2)', text: 'Regner ut 2 opphøyd i 10. Det samme som =A2^B2.' },
  'REST': { cells: table('A1', [['Tall', 'Delt på', 'Rest'], [17, 5]]), at: 'C2', formula: '=REST(A2;B2)', text: 'Gir resten når 17 deles på 5.', tips: ['=REST(A2;2)=0 sjekker om et tall er partall.'] },
  'PI': { cells: table('A1', [['Radius', 'Areal'], [3]]), at: 'B2', formula: '=PI()*A2^2', text: 'Regner ut arealet av en sirkel.' },
  'SUMMERHVIS': { cells: salg, at: 'C8', formula: '=SUMMERHVIS(B2:B6;"Vest";C2:C6)', text: 'Summerer bare salget i region Vest.', tips: ['Rekkefølgen er: område som sjekkes; vilkår; område som summeres.', 'Lås områdene med $ hvis du skal fylle formelen ned.'] },
  'SUMMER.HVIS.SETT': { cells: salg, at: 'C8', formula: '=SUMMER.HVIS.SETT(C2:C6;A2:A6;"Kari";B2:B6;"Øst")', text: 'Summerer Karis salg i region Øst.', tips: ['Her kommer summeringsområdet først, i motsetning til SUMMERHVIS.'] },

  // Statistikk
  'GJENNOMSNITT': { cells: tall, at: 'B7', formula: '=GJENNOMSNITT(B2:B6)', text: 'Gjennomsnittlig salg per måned.', tips: ['Tomme celler og tekst hoppes over. Celler med 0 telles med.'] },
  'MIN': { cells: tall, at: 'B7', formula: '=MIN(B2:B6)', text: 'Den svakeste måneden.' },
  'STØRST': { cells: tall, at: 'B7', formula: '=STØRST(B2:B6)', text: 'Den beste måneden.', tips: ['STØRST heter MAX i engelsk Excel. Noen eldre lister bruker MAKS.'] },
  'MEDIAN': { cells: tall, at: 'B7', formula: '=MEDIAN(B2:B6)', text: 'Den midterste verdien når salget sorteres.' },
  'ANTALL': { cells: table('A1', [['Dag', 'Kolli'], ['Man', 412], ['Tir', 'Fri'], ['Ons', 455], ['Tor', ''], ['Fre', 520]]), at: 'B7', formula: '=ANTALL(B2:B6)', text: 'Teller dagene med et tall. «Fri» og den tomme cellen telles ikke.' },
  'ANTALLA': { cells: table('A1', [['Dag', 'Kolli'], ['Man', 412], ['Tir', 'Fri'], ['Ons', 455], ['Tor', ''], ['Fre', 520]]), at: 'B7', formula: '=ANTALLA(B2:B6)', text: 'Teller alle celler som ikke er tomme, også tekst.' },
  'TELLBLANKE': { cells: table('A1', [['Navn', 'Svar'], ['Ola', 'Ja'], ['Kari', ''], ['Per', 'Nei'], ['Lise', '']]), at: 'B6', formula: '=TELLBLANKE(B2:B5)', text: 'Teller hvor mange som ikke har svart.' },
  'N.STØRST': { cells: tall, at: 'B7', formula: '=N.STØRST(B2:B6;2)', text: 'Den nest beste måneden.' },
  'N.MINST': { cells: tall, at: 'B7', formula: '=N.MINST(B2:B6;2)', text: 'Den nest svakeste måneden.' },
  'RANG': { cells: tall, at: 'C2', formula: '=RANG(B2;$B$2:$B$6)', text: 'Plasseringen til januar, der 1 er best.', tips: ['Lås listen med $ når du fyller ned.'] },
  'GJENNOMSNITTHVIS': { cells: salg, at: 'C8', formula: '=GJENNOMSNITTHVIS(A2:A6;"Kari";C2:C6)', text: 'Gjennomsnittlig salg for Kari.' },
  'GJENNOMSNITT.HVIS.SETT': { cells: salg, at: 'C8', formula: '=GJENNOMSNITT.HVIS.SETT(C2:C6;B2:B6;"Vest";C2:C6;">4000")', text: 'Snittet av salg over 4 000 i region Vest.' },
  'ANTALL.HVIS': { cells: salg, at: 'C8', formula: '=ANTALL.HVIS(B2:B6;"Vest")', text: 'Teller salgene i region Vest.', tips: ['Sammenligninger skrives i anførselstegn: ">5000".', '* og ? fungerer som jokertegn: "K*" teller alt som starter med K.'] },
  'ANTALL.HVIS.SETT': { cells: salg, at: 'C8', formula: '=ANTALL.HVIS.SETT(B2:B6;"Vest";C2:C6;">4000")', text: 'Teller salg i Vest på over 4 000.' },
  'MAKS.HVIS.SETT': { cells: salg, at: 'C8', formula: '=MAKS.HVIS.SETT(C2:C6;B2:B6;"Øst")', text: 'Det største enkeltsalget i region Øst.' },
  'MIN.HVIS.SETT': { cells: salg, at: 'C8', formula: '=MIN.HVIS.SETT(C2:C6;A2:A6;"Jonas")', text: 'Jonas sitt minste salg.' },

  // Logikk
  'HVIS': { cells: table('A1', [['Kandidat', 'Poeng', 'Resultat'], ['A. Berg', 72]]), at: 'C2', formula: '=HVIS(B2>=50;"Bestått";"Ikke bestått")', text: 'Skriver «Bestått» når poengene er 50 eller mer.', tips: ['Tekst skrives i anførselstegn, tall uten.', 'Skriver du komma i stedet for semikolon i norsk Excel, får du feilmelding.'] },
  'HVIS.SETT': { cells: table('A1', [['Elev', 'Poeng', 'Karakter'], ['Ella', 64]]), at: 'C2', formula: '=HVIS.SETT(B2>=90;6;B2>=77;5;B2>=58;4;B2>=41;3;B2>=21;2;SANN;1)', text: 'Gir karakter ut fra poeng. SANN til slutt betyr «ellers».', widths: w({ C: 120 }) },
  'OG': { cells: table('A1', [['Søker', 'Alder', 'Førerkort', 'Kan kjøre'], ['Marius', 24, 'Ja']]), at: 'D2', formula: '=HVIS(OG(B2>=21;C2="Ja");"Ja";"Nei")', text: 'Kan kjøre bare hvis begge kravene er oppfylt.' },
  'ELLER': { cells: table('A1', [['Søker', 'Alder', 'Erfaring', 'Intervju'], ['Tobias', 33, 1]]), at: 'D2', formula: '=HVIS(ELLER(C2>=5;B2>=30);"Ja";"Nei")', text: 'Inn til intervju hvis minst ett krav er oppfylt.' },
  'IKKE': { cells: table('A1', [['Status', 'Åpen?'], ['Løst']]), at: 'B2', formula: '=IKKE(A2="Løst")', text: 'Gir SANN for alle saker som ikke er løst.' },
  'SANN': { cells: table('A1', [['Test', 'Svar'], ['Er 5 større enn 3?']]), at: 'B2', formula: '=5>3', text: 'En sammenligning gir SANN eller USANN. Funksjonen SANN() gir alltid SANN.' },
  'USANN': { cells: table('A1', [['Test', 'Svar'], ['Er 2 større enn 3?']]), at: 'B2', formula: '=2>3', text: 'En sammenligning som ikke stemmer gir USANN.' },
  'HVISFEIL': { cells: table('A1', [['Budsjett', 'Faktisk', 'Avvik'], [0, 1250]]), at: 'C2', formula: '=HVISFEIL(B2/A2-1;"Ingen budsjett")', text: 'Viser en tekst i stedet for #DIV/0! når budsjettet er 0.' },
  'HVIS.IT': { cells: varer, at: 'C7', formula: '=HVIS.IT(FINN.RAD(1009;A2:C5;2;USANN);"Finnes ikke")', text: 'Fanger bare #I/T, for eksempel når et oppslag ikke finner noe.' },

  // Info
  'ERTOM': { cells: table('A1', [['Navn', 'Svar', 'Mangler?'], ['Kari', '']]), at: 'C2', formula: '=ERTOM(B2)', text: 'Gir SANN når cellen er helt tom.' },
  'ERTALL': { cells: table('A1', [['Verdi', 'Tall?'], ['12,5']]), at: 'B2', formula: '=ERTALL(A2)', text: 'Sjekker om cellen inneholder et tall.', tips: ['=ERTALL(SØK("tekst";A2)) er en vanlig måte å sjekke om en celle inneholder et ord.'] },
  'ERTEKST': { cells: table('A1', [['Verdi', 'Tekst?'], ['Oslo']]), at: 'B2', formula: '=ERTEKST(A2)', text: 'Sjekker om cellen inneholder tekst.' },
  'ERFEIL': { cells: table('A1', [['Teller', 'Nevner', 'Feil?'], [10, 0]]), at: 'C2', formula: '=ERFEIL(A2/B2)', text: 'Gir SANN fordi delingen gir #DIV/0!.' },

  // Oppslag
  'FINN.RAD': { cells: varer, at: 'C7', formula: '=FINN.RAD(1003;A2:C5;3;USANN)', text: 'Finner varenummer 1003 i første kolonne og henter prisen fra kolonne 3.', formats: { 'C2:C7': 'kr2' }, tips: ['Husk USANN som siste argument for eksakt treff.', 'FINN.RAD leter bare i første kolonne. Bruk XOPPSLAG eller INDEKS/SAMMENLIGNE for å slå opp mot venstre.', 'Lås tabellen med $ når du fyller ned: $A$2:$C$5.'] },
  'FINN.KOLONNE': { cells: table('A1', [['Måned', 'Jan', 'Feb', 'Mar'], ['Salg', 120, 95, 143]]), at: 'B4', formula: '=FINN.KOLONNE("Feb";A1:D2;2;USANN)', text: 'Leter i første rad og henter verdien fra rad 2.' },
  'SAMMENLIGNE': { cells: varer, at: 'C7', formula: '=SAMMENLIGNE("Kakao";B2:B5;0)', text: 'Gir plassen til «Kakao» i listen. 0 betyr eksakt treff.' },
  'INDEKS': { cells: varer, at: 'C7', formula: '=INDEKS(A2:A5;SAMMENLIGNE("Kakao";B2:B5;0))', text: 'Henter varenummeret til «Kakao», som står til venstre for navnet.', tips: ['INDEKS + SAMMENLIGNE virker i alle versjoner av Excel og kan slå opp i alle retninger.'] },
  'XOPPSLAG': { cells: varer, at: 'C7', formula: '=XOPPSLAG("Te";B2:B5;C2:C5;"Finnes ikke")', text: 'Finner «Te» og henter prisen. Fjerde argument vises hvis varen ikke finnes.', formats: { 'C2:C7': 'kr2' }, tips: ['XOPPSLAG finnes i Microsoft 365 og Excel 2021 eller nyere.'] },
  'VELG': { cells: table('A1', [['Ukedagnr', 'Navn'], [3]]), at: 'B2', formula: '=VELG(A2;"Man";"Tir";"Ons";"Tor";"Fre";"Lør";"Søn")', text: 'Velger det tredje alternativet i listen.' },

  // Tekst
  'VENSTRE': { cells: table('A1', [['Ordrenr', 'Land'], ['NO-2026-00417']]), at: 'B2', formula: '=VENSTRE(A2;2)', text: 'Henter de to første tegnene.', widths: w({ A: 140 }) },
  'HØYRE': { cells: table('A1', [['Ordrenr', 'Løpenr'], ['NO-2026-00417']]), at: 'B2', formula: '=HØYRE(A2;5)', text: 'Henter de fem siste tegnene.', widths: w({ A: 140 }) },
  'DELTEKST': { cells: table('A1', [['Ordrenr', 'År'], ['NO-2026-00417']]), at: 'B2', formula: '=DELTEKST(A2;4;4)', text: 'Henter fire tegn fra og med plass 4.', widths: w({ A: 140 }) },
  'LENGDE': { cells: table('A1', [['Tekst', 'Tegn'], ['Kverneland']]), at: 'B2', formula: '=LENGDE(A2)', text: 'Teller antall tegn.' },
  'STORE': { cells: table('A1', [['Tekst', 'Store'], ['bryne']]), at: 'B2', formula: '=STORE(A2)', text: 'Gjør om til store bokstaver.' },
  'SMÅ': { cells: table('A1', [['Tekst', 'Små'], ['KARI@FIRMA.NO']]), at: 'B2', formula: '=SMÅ(A2)', text: 'Gjør om til små bokstaver.', widths: w({ A: 150, B: 150 }) },
  'STOR.FORBOKSTAV': { cells: table('A1', [['Tekst', 'Ryddet'], ['ola NORDMANN']]), at: 'B2', formula: '=STOR.FORBOKSTAV(A2)', text: 'Stor forbokstav i hvert ord.', widths: w({ A: 140, B: 140 }) },
  'TRIMME': { cells: table('A1', [['Tekst', 'Ryddet'], ['  Kari   Hansen ']]), at: 'B2', formula: '=TRIMME(A2)', text: 'Fjerner mellomrom foran, bak og doble mellomrom.', widths: w({ A: 140, B: 140 }) },
  'KJEDE.SAMMEN': { cells: table('A1', [['Fornavn', 'Etternavn', 'Fullt navn'], ['Kari', 'Nordmann']]), at: 'C2', formula: '=KJEDE.SAMMEN(A2;" ";B2)', text: 'Setter sammen fornavn og etternavn. =A2&" "&B2 gjør det samme.', widths: w({ C: 140 }) },
  'KJED.SAMMEN': { cells: table('A1', [['Del', 'Samlet'], ['A'], ['B'], ['C']]), at: 'B2', formula: '=KJED.SAMMEN(A2:A4)', text: 'Setter sammen et helt område.' },
  'TEKST.KOMBINER': { cells: table('A1', [['Navn', 'Liste'], ['Ola'], ['Kari'], [''], ['Per']]), at: 'B2', formula: '=TEKST.KOMBINER(", ";SANN;A2:A5)', text: 'Lager en kommaseparert liste og hopper over tomme celler.', widths: w({ B: 160 }) },
  'FINN': { cells: table('A1', [['Navn', 'Komma på plass'], ['Hansen, Kari']]), at: 'B2', formula: '=FINN(",";A2)', text: 'Finner plassen til kommaet. Skiller mellom store og små bokstaver.', widths: w({ A: 130, B: 130 }) },
  'SØK': { cells: table('A1', [['Tekst', 'Plass'], ['Faktura fra Bryne Bygg']]), at: 'B2', formula: '=SØK("bryne";A2)', text: 'Finner «bryne» uansett store og små bokstaver.', widths: w({ A: 180 }) },
  'BYTT.UT': { cells: table('A1', [['Telefon', 'Uten mellomrom'], ['+47 412 33 120']]), at: 'B2', formula: '=BYTT.UT(A2;" ";"")', text: 'Fjerner alle mellomrom.', widths: w({ A: 140, B: 140 }) },
  'ERSTATT': { cells: table('A1', [['Kode', 'Ny kode'], ['NO-2025-001']]), at: 'B2', formula: '=ERSTATT(A2;4;4;"2026")', text: 'Bytter ut fire tegn fra plass 4.', widths: w({ A: 120, B: 120 }) },
  'GJENTA': { cells: table('A1', [['Poeng', 'Stjerner'], [4]]), at: 'B2', formula: '=GJENTA("★";A2)', text: 'Gjentar et tegn så mange ganger som poengene.' },
  'EKSAKT': { cells: table('A1', [['Passord', 'Gjentatt', 'Like?'], ['Hemmelig', 'hemmelig']]), at: 'C2', formula: '=EKSAKT(A2;B2)', text: 'Gir USANN fordi store og små bokstaver er ulike.' },
  'VERDI': { cells: table('A1', [['Tekst', 'Tall'], ["'1250,50"]]), at: 'B2', formula: '=VERDI(A2)', text: 'Gjør om et tall lagret som tekst til et ekte tall.' },
  'TEKST': { cells: table('A1', [['Beløp', 'Som tekst'], [1234.5]]), at: 'B2', formula: '="Sum: "&TEKST(A2;"# ##0,00")&" kr"', text: 'Formaterer tallet med tusenskille og to desimaler inni en tekst.', widths: w({ B: 170 }) },

  // Dato
  'DATO': { cells: table('A1', [['År', 'Måned', 'Dag', 'Dato'], [2026, 5, 17]]), at: 'D2', formula: '=DATO(A2;B2;C2)', text: 'Lager en dato av tre tall.', formats: { D2: 'dato' } },
  'ÅR': { cells: datoer, at: 'B2', formula: '=ÅR(A2)', text: 'Henter årstallet.', formats: { A2: 'dato' } },
  'MÅNED': { cells: datoer, at: 'B2', formula: '=MÅNED(A2)', text: 'Henter månedsnummeret (1–12).', formats: { A2: 'dato' } },
  'DAG': { cells: datoer, at: 'B2', formula: '=DAG(A2)', text: 'Henter dagen i måneden.', formats: { A2: 'dato' } },
  'IDAG': { cells: table('A1', [['Fødselsdato', 'Dager siden'], ['17.05.1990']]), at: 'B2', formula: '=IDAG()-A2', text: 'Antall dager fra fødselsdatoen til i dag.', formats: { A2: 'dato', B2: 'int' }, tips: ['IDAG oppdateres hver gang arket regnes ut på nytt. Skriv Ctrl+; for å sette inn dagens dato som fast verdi.'] },
  'NÅ': { cells: table('A1', [['Nå'], ['']]), at: 'A2', formula: '=NÅ()', text: 'Dato og klokkeslett nå.', formats: { A2: 'dato' } },
  'UKEDAG': { cells: datoer, at: 'B2', formula: '=UKEDAG(A2;2)', text: 'Ukedagnummer der mandag er 1. 17. mai 2026 er en søndag.', formats: { A2: 'dato' }, tips: ['Uten 2 som andre argument starter uka på søndag, slik det er vanlig i USA.'] },
  'ISOUKENR': { cells: datoer, at: 'B2', formula: '=ISOUKENR(A2)', text: 'Ukenummer slik vi bruker det i Norge.', formats: { A2: 'dato' } },
  'UKENR': { cells: datoer, at: 'B2', formula: '=UKENR(A2;21)', text: 'Med 21 som andre argument gir UKENR norsk ukenummer.', formats: { A2: 'dato' }, tips: ['Uten 21 gir UKENR amerikanske ukenummer, som ofte er én uke feil i Norge.'] },
  'DAG.ETTER': { cells: table('A1', [['Startdato', 'Om 3 måneder'], ['31.01.2026']]), at: 'B2', formula: '=DAG.ETTER(A2;3)', text: 'Samme dag tre måneder senere. Finnes ikke dagen, brukes siste dag i måneden.', formats: { 'A2:B2': 'dato' }, widths: w({ B: 120 }) },
  'MÅNEDSSLUTT': { cells: table('A1', [['Dato', 'Siste i mnd'], ['10.02.2026']]), at: 'B2', formula: '=MÅNEDSSLUTT(A2;0)', text: 'Siste dag i samme måned.', formats: { 'A2:B2': 'dato' } },
  'DAGER': { cells: table('A1', [['Start', 'Slutt', 'Dager'], ['01.11.2026', '24.12.2026']]), at: 'C2', formula: '=DAGER(B2;A2)', text: 'Antall dager mellom to datoer. =B2-A2 gir det samme.', formats: { 'A2:B2': 'dato' } },
  'NETT.ARBEIDSDAGER': { cells: table('A1', [['Start', 'Slutt', 'Arbeidsdager'], ['02.11.2026', '13.11.2026']]), at: 'C2', formula: '=NETT.ARBEIDSDAGER(A2;B2)', text: 'Teller mandag til fredag, begge dager inkludert.', formats: { 'A2:B2': 'dato' }, widths: w({ C: 110 }), tips: ['Legg helligdager i et område og ta det med som tredje argument.'] },
  'ARBEIDSDAG': { cells: table('A1', [['Start', 'Dager', 'Ferdig'], ['20.11.2026', 5]]), at: 'C2', formula: '=ARBEIDSDAG(A2;B2)', text: 'Datoen fem arbeidsdager senere, uten helg.', formats: { A2: 'dato', C2: 'dato' } },
  'DATODIFF': { cells: table('A1', [['Født', 'I dag', 'Alder'], ['15.06.1990', '27.11.2026']]), at: 'C2', formula: '=DATODIFF(A2;B2;"Y")', text: 'Hele år mellom to datoer, altså alderen.', formats: { 'A2:B2': 'dato' }, tips: ['"M" gir hele måneder og "D" dager. Funksjonen vises ikke i funksjonslisten i Excel, men virker.'] },

  // Økonomi
  'AVDRAG': { cells: table('A1', [['Lån', 3000000], ['Rente', '5,2%'], ['År', 25], ['Per måned']]), at: 'B4', formula: '=AVDRAG(B2/12;B3*12;-B1)', text: 'Fast månedlig terminbeløp på et annuitetslån.', formats: { B1: 'kr', B2: 'pct1', B4: 'kr' }, widths: w({ B: 120 }), tips: ['Del årsrenten på 12 og gang årene med 12 ved månedlige terminer.', 'Minus foran lånebeløpet gjør svaret positivt.'] },
  'NÅVERDI': { cells: table('A1', [['Rente', '4%'], ['År', 10], ['Per år', 50000], ['Verdi i dag']]), at: 'B4', formula: '=NÅVERDI(B1;B2;-B3)', text: 'Hva 50 000 kr i året i ti år er verdt i dag.', formats: { B1: 'pct', B3: 'kr', B4: 'kr' }, widths: w({ B: 120 }) },
  'SLUTTVERDI': { cells: table('A1', [['Rente', '5%'], ['År', 20], ['Spart per år', 12000], ['Til slutt']]), at: 'B4', formula: '=SLUTTVERDI(B1;B2;-B3)', text: 'Hva du har etter 20 år med 12 000 kr spart hvert år.', formats: { B1: 'pct', B3: 'kr', B4: 'kr' }, widths: w({ A: 110, B: 120 }) },
};

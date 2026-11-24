import { table, type Lesson } from './types';

export const OPPSLAG = 'Oppslag';
export const TEKST = 'Tekst';
export const DATO = 'Datoer';
export const OKONOMI = 'Økonomi og prosjekter';

export const lessonsB: Lesson[] = [
  // ───────────────────────── Oppslag ─────────────────────────
  {
    slug: 'finn-rad',
    title: 'FINN.RAD',
    module: OPPSLAG,
    minutes: 8,
    summary: 'Hent navn og pris fra en produktliste.',
    intro: `\`FINN.RAD\` leter etter en verdi i **første kolonne** i en tabell og henter verdien fra en annen kolonne på samme rad:

\`=FINN.RAD(A2;$G$2:$I$8;2;USANN)\`

1. Hva du leter etter (varenummeret)
2. Tabellen. Lås den med \`$\` så du kan fylle ned.
3. Kolonnenummeret du vil hente, talt fra venstre i tabellen
4. \`USANN\` betyr eksakt treff. Glemmer du den, kan du få feil vare.

Finnes ikke verdien, får du \`#I/T\`. Engelsk navn: VLOOKUP.`,
    cells: {
      ...table('A1', [
        ['Varenr', 'Antall', 'Vare', 'Pris', 'Sum'],
        [1004, 2], [1001, 5], [1007, 1], [1003, 3], [1005, 4],
      ]),
      ...table('G1', [
        ['Varenr', 'Vare', 'Pris'],
        [1001, 'Kaffe 500 g', 89.9], [1002, 'Te 20 poser', 34.9], [1003, 'Kakao', 42.5], [1004, 'Melk 1 l', 22.9],
        [1005, 'Havregryn', 31.9], [1006, 'Knekkebrød', 28.9], [1007, 'Brunost', 109],
      ]),
    },
    formats: { 'D2:E6': 'kr2', 'I2:I8': 'kr2' },
    widths: { C: 120, H: 120 },
    bold: [1],
    fixed: ['A2:A6', 'G2:G8'],
    tasks: [
      { cell: 'C2:C6', solution: '=FINN.RAD(A2;$G$2:$I$8;2;USANN)', mustUse: ['FINN.RAD'], prompt: 'Hent varenavnet fra produktlisten i C2:C6.', hint: '=FINN.RAD(A2;$G$2:$I$8;2;USANN)' },
      { cell: 'D2:D6', solution: '=FINN.RAD(A2;$G$2:$I$8;3;USANN)', mustUse: ['FINN.RAD'], prompt: 'Hent prisen i D2:D6.', hint: 'Samme formel, men kolonne 3.' },
      { cell: 'E2:E6', solution: '=B2*D2', prompt: 'Regn ut summen per linje i E2:E6.', hint: '=B2*D2' },
    ],
  },
  {
    slug: 'finn-rad-omtrentlig',
    title: 'FINN.RAD med intervaller',
    module: OPPSLAG,
    minutes: 6,
    summary: 'Rabattrinn og satser med omtrentlig treff.',
    intro: `Med \`SANN\` som siste argument finner \`FINN.RAD\` den største verdien som er **mindre enn eller lik** det du leter etter. Det passer for trinn og intervaller: rabatter, provisjonstrinn og fraktpriser.

\`=FINN.RAD(B2;$G$2:$H$5;2;SANN)\`

Kravet er at første kolonne i tabellen er sortert stigende. Et kjøp på 7 200 kr får rabatten på raden «5 000», fordi 5 000 er det største trinnet som ikke er større enn 7 200.`,
    cells: {
      ...table('A1', [
        ['Kunde', 'Beløp', 'Rabatt', 'Å betale'],
        ['Bryne Bygg', 7200], ['Kverneland Gård', 850], ['Sandnes Sport', 12400], ['Jæren Rør', 1000], ['Ålgård Auto', 4999],
      ]),
      ...table('G1', [['Fra beløp', 'Rabatt'], [0, '0%'], [1000, '5%'], [5000, '10%'], [10000, '15%']]),
    },
    formats: { 'B2:B6': 'kr', 'C2:C6': 'pct', 'D2:D6': 'kr2', 'G2:G5': 'kr', 'H2:H5': 'pct' },
    widths: { A: 140 },
    bold: [1],
    fixed: ['G2:H5'],
    tasks: [
      { cell: 'C2:C6', solution: '=FINN.RAD(B2;$G$2:$H$5;2;SANN)', mustUse: ['FINN.RAD'], prompt: 'Finn rabattsatsen for hver kunde i C2:C6 ut fra trinnene i G:H.', hint: '=FINN.RAD(B2;$G$2:$H$5;2;SANN)' },
      { cell: 'D2:D6', solution: '=B2*(1-C2)', prompt: 'Regn ut hva kunden skal betale etter rabatt i D2:D6.', hint: '=B2*(1-C2)' },
    ],
  },
  {
    slug: 'indeks-sammenligne',
    title: 'INDEKS og SAMMENLIGNE',
    module: OPPSLAG,
    minutes: 8,
    summary: 'Oppslag i alle retninger.',
    intro: `\`FINN.RAD\` kan bare lete i første kolonne og hente til høyre. \`INDEKS\` og \`SAMMENLIGNE\` sammen har ikke den begrensningen.

\`SAMMENLIGNE\` gir posisjonen til en verdi i en liste:

\`=SAMMENLIGNE("Siri Berg";B2:B10;0)\` gir 4 hvis Siri står på fjerde rad. 0 betyr eksakt treff.

\`INDEKS\` henter verdien på en gitt posisjon:

\`=INDEKS(A2:A10;4)\`

Satt sammen:

\`=INDEKS(A2:A10;SAMMENLIGNE(F2;B2:B10;0))\`

Engelske navn: INDEX og MATCH.`,
    cells: {
      ...table('A1', [
        ['Avdeling', 'Navn', 'Telefon'],
        ['Økonomi', 'Per Aas', '412 33 120'], ['Salg', 'Nina Vik', '913 22 845'], ['Lager', 'Omar Ali', '977 10 562'],
        ['Salg', 'Siri Berg', '480 55 301'], ['IT', 'Hans Moe', '936 42 017'], ['Lager', 'Tone Lund', '402 88 913'],
        ['Økonomi', 'Ali Khan', '455 61 220'], ['IT', 'Eva Bø', '993 70 448'], ['Salg', 'Rolf Sæle', '416 02 735'],
      ]),
      ...table('E1', [['Søk etter', 'Siri Berg'], ['Plass i listen'], ['Avdeling'], ['Telefon']]),
    },
    widths: { A: 100, B: 110, C: 120, E: 120, F: 120 },
    bold: [1],
    tasks: [
      { cell: 'F2', solution: '=SAMMENLIGNE(F1;B2:B10;0)', mustUse: ['SAMMENLIGNE'], prompt: 'Finn hvilken plass navnet i F1 har i navnelisten. Svar i F2.', hint: '=SAMMENLIGNE(F1;B2:B10;0)' },
      { cell: 'F3', solution: '=INDEKS(A2:A10;SAMMENLIGNE(F1;B2:B10;0))', mustUse: ['INDEKS', 'SAMMENLIGNE'], prompt: 'Hent avdelingen til personen i F1. Avdelingen står til venstre for navnet. Svar i F3.', hint: '=INDEKS(A2:A10;SAMMENLIGNE(F1;B2:B10;0))' },
      { cell: 'F4', solution: '=INDEKS(C2:C10;SAMMENLIGNE(F1;B2:B10;0))', mustUse: ['INDEKS'], prompt: 'Hent telefonnummeret i F4.', hint: 'Samme som over, men med C2:C10.' },
    ],
  },
  {
    slug: 'xoppslag',
    title: 'XOPPSLAG',
    module: OPPSLAG,
    minutes: 6,
    summary: 'Det moderne oppslaget i Microsoft 365.',
    intro: `\`XOPPSLAG\` finnes i Excel for Microsoft 365 og Excel 2021 eller nyere. Den gjør jobben til \`FINN.RAD\` og \`INDEKS/SAMMENLIGNE\` med en enklere formel:

\`=XOPPSLAG(E2;$A$2:$A$11;$B$2:$B$11;"Ukjent")\`

1. Hva du leter etter
2. Hvor du leter
3. Hva du vil hente
4. Hva som skal stå hvis verdien ikke finnes (valgfritt)

Eksakt treff er standard, så du slipper \`USANN\`. Engelsk navn: XLOOKUP.`,
    cells: {
      ...table('A1', [
        ['Postnr', 'Poststed'],
        [4001, 'Stavanger'], [4306, 'Sandnes'], [4340, 'Bryne'], [4355, 'Kverneland'], [4330, 'Ålgård'],
        [4050, 'Sola'], [4070, 'Randaberg'], [4352, 'Kleppe'], [4360, 'Varhaug'], [4365, 'Nærbø'],
      ]),
      ...table('D1', [['Kunde', 'Postnr', 'Poststed'], ['Hansen', 4355], ['Larsen', 4306], ['Nilsen', 9999], ['Berg', 4365]]),
    },
    widths: { B: 110, F: 110 },
    bold: [1],
    fixed: ['A2:A11', 'E2:E5'],
    tasks: [
      { cell: 'F2:F5', solution: '=XOPPSLAG(E2;$A$2:$A$11;$B$2:$B$11;"Ukjent")', mustUse: ['XOPPSLAG'], prompt: 'Hent poststedet for hver kunde i F2:F5. Står postnummeret ikke i listen, skal det stå «Ukjent».', hint: '=XOPPSLAG(E2;$A$2:$A$11;$B$2:$B$11;"Ukjent")' },
    ],
  },

  // ───────────────────────── Tekst ─────────────────────────
  {
    slug: 'venstre-hoyre-deltekst',
    title: 'VENSTRE, HØYRE og DELTEKST',
    module: TEKST,
    minutes: 6,
    summary: 'Plukk ut deler av en tekst.',
    intro: `Tre funksjoner henter ut deler av en tekst:

- \`VENSTRE(tekst; antall)\` tegn fra starten. Engelsk: LEFT.
- \`HØYRE(tekst; antall)\` tegn fra slutten. Engelsk: RIGHT.
- \`DELTEKST(tekst; start; antall)\` tegn fra en bestemt plass. Engelsk: MID.

\`LENGDE(tekst)\` gir antall tegn. Engelsk: LEN.

Ordrenummeret \`NO-2026-00417\`: \`VENSTRE\` med 2 gir «NO». \`DELTEKST\` fra plass 4 med 4 tegn gir «2026». \`HØYRE\` med 5 gir «00417».`,
    cells: table('A1', [
      ['Ordrenr', 'Land', 'År', 'Løpenr', 'Tegn'],
      ['NO-2026-00417'], ['SE-2025-10233'], ['DK-2026-00089'], ['NO-2024-31570'],
    ]),
    widths: { A: 140 },
    bold: [1],
    tasks: [
      { cell: 'B2:B5', solution: '=VENSTRE(A2;2)', mustUse: ['VENSTRE'], prompt: 'Hent landkoden (de to første tegnene) i B2:B5.', hint: '=VENSTRE(A2;2)' },
      { cell: 'C2:C5', solution: '=DELTEKST(A2;4;4)', mustUse: ['DELTEKST'], prompt: 'Hent årstallet i C2:C5.', hint: '=DELTEKST(A2;4;4)' },
      { cell: 'D2:D5', solution: '=HØYRE(A2;5)', mustUse: ['HØYRE'], prompt: 'Hent løpenummeret (de fem siste tegnene) i D2:D5.', hint: '=HØYRE(A2;5)' },
      { cell: 'E2:E5', solution: '=LENGDE(A2)', mustUse: ['LENGDE'], prompt: 'Tell antall tegn i ordrenummeret i E2:E5.', hint: '=LENGDE(A2)' },
    ],
  },
  {
    slug: 'sla-sammen-tekst',
    title: 'Slå sammen tekst med &',
    module: TEKST,
    minutes: 6,
    summary: 'Lag fulle navn og e-postadresser.',
    intro: `\`&\` setter sammen tekster. Mellomrom og annen fast tekst skrives i anførselstegn:

\`=A2&" "&B2\` gir «Kari Nordmann».

Funksjoner som rydder tekst:

- \`SMÅ\` små bokstaver (LOWER)
- \`STORE\` store bokstaver (UPPER)
- \`STOR.FORBOKSTAV\` stor forbokstav i hvert ord (PROPER)
- \`TRIMME\` fjerner ekstra mellomrom (TRIM)

\`KJEDE.SAMMEN(A2;" ";B2)\` gjør det samme som \`&\`.`,
    cells: table('A1', [
      ['Fornavn', 'Etternavn', 'Fullt navn', 'E-post', 'Navn ryddet'],
      ['Kari', 'Nordmann', null, null, null],
      ['Ola', 'Hansen'], ['Ingrid', 'Solberg'], ['Jonas', 'Strand'],
      [''],
      ['Rotete navn', '', 'Ryddet'],
      ['  per   OLSEN '], ['lise eriksen'], ['ANNE   berg'],
    ]),
    widths: { A: 130, C: 150, D: 230, E: 150 },
    bold: [1, 7],
    tasks: [
      { cell: 'C2:C5', solution: '=A2&" "&B2', prompt: 'Lag fullt navn med mellomrom i C2:C5.', hint: '=A2&" "&B2' },
      { cell: 'D2:D5', solution: '=SMÅ(A2)&"."&SMÅ(B2)&"@firma.no"', mustUse: ['SMÅ'], prompt: 'Lag e-postadressen fornavn.etternavn@firma.no med små bokstaver i D2:D5.', hint: '=SMÅ(A2)&"."&SMÅ(B2)&"@firma.no"' },
      { cell: 'C8:C10', solution: '=STOR.FORBOKSTAV(TRIMME(A8))', mustUse: ['TRIMME', 'STOR.FORBOKSTAV'], prompt: 'Rydd de rotete navnene i C8:C10: fjern ekstra mellomrom og gi stor forbokstav.', hint: '=STOR.FORBOKSTAV(TRIMME(A8))' },
    ],
  },
  {
    slug: 'finn-og-bytt-ut',
    title: 'FINN og BYTT.UT',
    module: TEKST,
    minutes: 7,
    summary: 'Del opp tekst og bytt ut tegn.',
    intro: `\`FINN\` gir plassen til et tegn i en tekst. I «Hansen, Kari» står kommaet på plass 7:

\`=FINN(",";A2)\`

Kombiner med \`VENSTRE\` og \`DELTEKST\` for å dele opp:

- Etternavn: \`=VENSTRE(A2;FINN(",";A2)-1)\`
- Fornavn: \`=DELTEKST(A2;FINN(",";A2)+2;100)\` (100 betyr «resten»)

\`BYTT.UT\` bytter ut tekst: \`=BYTT.UT(E2;" ";"")\` fjerner alle mellomrom.

\`SØK\` virker som \`FINN\`, men skiller ikke mellom store og små bokstaver.`,
    cells: table('A1', [
      ['Navn', 'Etternavn', 'Fornavn', '', 'Telefon', 'Uten mellomrom'],
      ['Hansen, Kari', null, null, null, '+47 412 33 120'],
      ['Johansen, Per Arne', null, null, null, '+47 913 22 845'],
      ['Ali, Omar', null, null, null, '+47 977 10 562'],
      ['Haugland, Siri', null, null, null, '+47 480 55 301'],
    ]),
    widths: { A: 160, C: 110, E: 140, F: 140 },
    bold: [1],
    tasks: [
      { cell: 'B2:B5', solution: '=VENSTRE(A2;FINN(",";A2)-1)', mustUse: ['FINN', 'VENSTRE'], prompt: 'Hent etternavnet (alt før kommaet) i B2:B5.', hint: '=VENSTRE(A2;FINN(",";A2)-1)' },
      { cell: 'C2:C5', solution: '=DELTEKST(A2;FINN(",";A2)+2;100)', mustUse: ['FINN', 'DELTEKST'], prompt: 'Hent fornavnet (alt etter komma og mellomrom) i C2:C5.', hint: '=DELTEKST(A2;FINN(",";A2)+2;100)' },
      { cell: 'F2:F5', solution: '=BYTT.UT(E2;" ";"")', mustUse: ['BYTT.UT'], prompt: 'Fjern alle mellomrom fra telefonnumrene i F2:F5.', hint: '=BYTT.UT(E2;" ";"")' },
    ],
  },

  // ───────────────────────── Datoer ─────────────────────────
  {
    slug: 'datoer',
    title: 'Datoer: ÅR, MÅNED, DAG og UKEDAG',
    module: DATO,
    minutes: 6,
    summary: 'Forfallsdato, måned og ukedag.',
    intro: `En dato i Excel er et tall: antall dager siden 1. januar 1900. 17.05.2026 er tallet 46159. Derfor kan du legge til dager med pluss:

\`=A2+B2\` gir fakturadato pluss betalingsfrist.

Hent ut deler av en dato:

- \`ÅR(A2)\` YEAR
- \`MÅNED(A2)\` MONTH
- \`DAG(A2)\` DAY
- \`UKEDAG(A2;2)\` gir 1 for mandag til 7 for søndag. Uten 2 starter uka på søndag.

\`DATO(2026;5;17)\` lager en dato av år, måned og dag. \`IDAG()\` gir dagens dato.`,
    cells: table('A1', [
      ['Fakturadato', 'Frist (dager)', 'Forfall', 'Måned', 'År', 'Ukedag forfall'],
      ['03.11.2026', 14], ['10.11.2026', 30], ['18.11.2026', 14], ['27.11.2026', 10], ['15.12.2026', 30],
    ]),
    formats: { 'A2:A6': 'dato', 'C2:C6': 'dato' },
    widths: { A: 110, B: 110, F: 120 },
    bold: [1],
    tasks: [
      { cell: 'C2:C6', solution: '=A2+B2', prompt: 'Regn ut forfallsdatoen i C2:C6.', hint: '=A2+B2' },
      { cell: 'D2:D6', solution: '=MÅNED(A2)', mustUse: ['MÅNED'], prompt: 'Hent månedsnummeret til fakturadatoen i D2:D6.', hint: '=MÅNED(A2)' },
      { cell: 'E2:E6', solution: '=ÅR(C2)', mustUse: ['ÅR'], prompt: 'Hent året for forfallsdatoen i E2:E6.', hint: '=ÅR(C2)' },
      { cell: 'F2:F6', solution: '=UKEDAG(C2;2)', mustUse: ['UKEDAG'], prompt: 'Finn ukedagen for forfallet i F2:F6, der mandag er 1.', hint: '=UKEDAG(C2;2)' },
    ],
  },
  {
    slug: 'regn-med-datoer',
    title: 'Arbeidsdager og ukenummer',
    module: DATO,
    minutes: 6,
    summary: 'NETT.ARBEIDSDAGER, ISOUKENR og dager mellom datoer.',
    intro: `Trekk to datoer fra hverandre for å få antall dager: \`=C2-B2\`.

\`NETT.ARBEIDSDAGER(start; slutt)\` teller mandag til fredag, inkludert begge datoene. Du kan legge til et område med helligdager som tredje argument. Engelsk: NETWORKDAYS.

\`ISOUKENR(dato)\` gir ukenummeret slik vi bruker det i Norge. Engelsk: ISOWEEKNUM. Den eldre \`UKENR\` gir amerikanske ukenummer hvis du ikke skriver 21 som andre argument.`,
    cells: {
      ...table('A1', [
        ['Oppgave', 'Start', 'Slutt', 'Dager', 'Arbeidsdager', 'Uke start'],
        ['Kartlegging', '02.11.2026', '13.11.2026'], ['Design', '16.11.2026', '04.12.2026'], ['Bygging', '07.12.2026', '29.01.2027'],
        ['Test', '01.02.2027', '12.02.2027'], ['Lansering', '15.02.2027', '17.02.2027'],
      ]),
      ...table('A9', [['Helligdager'], ['24.12.2026'], ['25.12.2026'], ['31.12.2026'], ['01.01.2027']]),
      H1: 'Arbeidsdager minus helligdager',
    },
    formats: { 'B2:C6': 'dato', 'A10:A13': 'dato' },
    widths: { A: 110, B: 100, C: 100, E: 110, H: 230 },
    bold: [1, 9],
    fixed: ['B2:C6', 'A10:A13'],
    tasks: [
      { cell: 'D2:D6', solution: '=C2-B2', prompt: 'Regn ut antall kalenderdager fra start til slutt i D2:D6.', hint: '=C2-B2' },
      { cell: 'E2:E6', solution: '=NETT.ARBEIDSDAGER(B2;C2)', mustUse: ['NETT.ARBEIDSDAGER'], prompt: 'Tell arbeidsdager (man–fre) for hver oppgave i E2:E6.', hint: '=NETT.ARBEIDSDAGER(B2;C2)' },
      { cell: 'F2:F6', solution: '=ISOUKENR(B2)', mustUse: ['ISOUKENR'], prompt: 'Finn ukenummeret oppgaven starter i, i F2:F6.', hint: '=ISOUKENR(B2)' },
      { cell: 'H2', solution: '=NETT.ARBEIDSDAGER(B4;C4;A10:A13)', mustUse: ['NETT.ARBEIDSDAGER'], prompt: 'Hvor mange arbeidsdager har «Bygging» når helligdagene i A10:A13 trekkes fra? Svar i H2.', hint: '=NETT.ARBEIDSDAGER(B4;C4;A10:A13)' },
    ],
  },

  // ───────────────────────── Økonomi og prosjekter ─────────────────────────
  {
    slug: 'avrund',
    title: 'AVRUND',
    module: OKONOMI,
    minutes: 5,
    summary: 'Rund av til øre, kroner og tiere.',
    intro: `Formatering bestemmer bare hvordan et tall **ser ut**. Tallet bak er det samme. \`AVRUND\` endrer selve tallet:

\`=AVRUND(B2;2)\` to desimaler (øre)

\`=AVRUND(B2;0)\` hele kroner

\`=AVRUND(B2;-1)\` nærmeste tier

\`AVRUND.OPP\` runder alltid opp, \`AVRUND.NED\` alltid ned. Engelsk: ROUND, ROUNDUP og ROUNDDOWN.`,
    cells: table('A1', [
      ['Vare', 'Utregnet pris', 'Øre', 'Nærmeste tier', 'Hele kr opp'],
      ['Kaffe', 87.4562], ['Brød', 41.3333], ['Ost', 112.0049], ['Juice', 36.875], ['Egg', 52.5],
    ]),
    formats: { 'C2:C6': 'dec2' },
    widths: { B: 110, D: 110, E: 100 },
    bold: [1],
    tasks: [
      { cell: 'C2:C6', solution: '=AVRUND(B2;2)', mustUse: ['AVRUND'], prompt: 'Rund av prisen til to desimaler i C2:C6.', hint: '=AVRUND(B2;2)' },
      { cell: 'D2:D6', solution: '=AVRUND(B2;-1)', mustUse: ['AVRUND'], prompt: 'Rund av til nærmeste tier i D2:D6.', hint: '=AVRUND(B2;-1)' },
      { cell: 'E2:E6', solution: '=AVRUND.OPP(B2;0)', mustUse: ['AVRUND.OPP'], prompt: 'Rund alltid opp til hele kroner i E2:E6.', hint: '=AVRUND.OPP(B2;0)' },
    ],
  },
  {
    slug: 'boliglan-avdrag',
    title: 'Boliglån med AVDRAG',
    module: OKONOMI,
    minutes: 7,
    summary: 'Terminbeløp, totalkostnad og renter på et annuitetslån.',
    intro: `\`AVDRAG\` regner ut det faste terminbeløpet på et annuitetslån, altså renter og avdrag til sammen. Engelsk: PMT.

\`=AVDRAG(rente_per_termin; antall_terminer; lånebeløp)\`

Med månedlige terminer deler du årsrenten på 12 og ganger antall år med 12:

\`=AVDRAG(B2/B4;B3*B4;-B1)\`

Minus foran lånebeløpet gjør svaret positivt. Excel tenker i pengestrømmer: lånet kommer inn til deg, terminbeløpet går ut.`,
    cells: table('A1', [
      ['Lånebeløp', 3000000], ['Årsrente', '5,2%'], ['Antall år', 25], ['Terminer per år', 12],
      [''], ['Terminbeløp'], ['Totalt betalt'], ['Totale renter'],
    ]),
    formats: { B1: 'kr', B2: 'pct1', 'B6:B8': 'kr' },
    widths: { A: 140, B: 130 },
    tasks: [
      { cell: 'B6', solution: '=AVDRAG(B2/B4;B3*B4;-B1)', mustUse: ['AVDRAG'], prompt: 'Regn ut månedlig terminbeløp i B6.', hint: '=AVDRAG(B2/B4;B3*B4;-B1)' },
      { cell: 'B7', solution: '=B6*B3*B4', prompt: 'Hvor mye betaler du til sammen over hele lånets løpetid? Svar i B7.', hint: '=B6*B3*B4' },
      { cell: 'B8', solution: '=B7-B1', prompt: 'Hvor mye av det er renter? Svar i B8.', hint: '=B7-B1' },
    ],
  },
  {
    slug: 'summerprodukt',
    title: 'SUMMERPRODUKT',
    module: OKONOMI,
    minutes: 6,
    summary: 'Lagerverdi i én formel.',
    intro: `\`SUMMERPRODUKT\` ganger områdene rad for rad og legger sammen resultatet:

\`=SUMMERPRODUKT(B2:B9;C2:C9)\` er det samme som B2*C2 + B3*C3 + … + B9*C9.

Du kan også ta med vilkår. En sammenligning gir SANN eller USANN, som regnes som 1 og 0:

\`=SUMMERPRODUKT((D2:D9="Verktøy")*B2:B9*C2:C9)\`

Engelsk: SUMPRODUCT.`,
    cells: {
      ...table('A1', [
        ['Vare', 'Antall', 'Enhetspris', 'Kategori'],
        ['Hammer', 24, 189, 'Verktøy'], ['Skrutrekker', 60, 79, 'Verktøy'], ['Skruer 200 stk', 140, 59, 'Forbruk'],
        ['Vinkelsliper', 8, 1290, 'Maskiner'], ['Tommestokk', 45, 69, 'Verktøy'], ['Tape', 210, 39, 'Forbruk'],
        ['Drill', 12, 1590, 'Maskiner'], ['Sag', 18, 349, 'Verktøy'],
      ]),
      ...table('F1', [['Spørsmål', 'Svar'], ['Total lagerverdi'], ['Lagerverdi verktøy']]),
    },
    formats: { 'C2:C9': 'kr', 'G2:G3': 'kr' },
    widths: { A: 130, C: 100, F: 150 },
    bold: [1],
    tasks: [
      { cell: 'G2', solution: '=SUMMERPRODUKT(B2:B9;C2:C9)', mustUse: ['SUMMERPRODUKT'], prompt: 'Regn ut total lagerverdi (antall ganger pris, summert) i G2.', hint: '=SUMMERPRODUKT(B2:B9;C2:C9)' },
      { cell: 'G3', solution: '=SUMMERPRODUKT((D2:D9="Verktøy")*B2:B9*C2:C9)', mustUse: ['SUMMERPRODUKT'], prompt: 'Regn ut lagerverdien bare for kategorien «Verktøy» i G3.', hint: '=SUMMERPRODUKT((D2:D9="Verktøy")*B2:B9*C2:C9)' },
    ],
  },
  {
    slug: 'prosjekt-budsjett',
    title: 'Prosjekt: Månedsbudsjett',
    module: OKONOMI,
    minutes: 10,
    summary: 'Inntekter, utgifter, resultat og sparerate.',
    intro: `Nå setter du sammen det du har lært til et budsjett for en husholdning.

Hver rad er enten «Inntekt» eller «Utgift». Bruk \`SUMMERHVIS\` til å summere hver type, regn ut resultatet og spareraten, og la \`HVIS\` si om måneden går i pluss eller minus.

Sparerate = resultat delt på inntekt.`,
    cells: {
      ...table('A1', [
        ['Post', 'Type', 'Beløp'],
        ['Lønn etter skatt', 'Inntekt', 41800], ['Barnetrygd', 'Inntekt', 5298], ['Husleie/lån', 'Utgift', 16900],
        ['Strøm', 'Utgift', 1450], ['Mat', 'Utgift', 9800], ['Barnehage/SFO', 'Utgift', 5520], ['Bil', 'Utgift', 4300],
        ['Forsikring', 'Utgift', 1650], ['Mobil og internett', 'Utgift', 1090], ['Fritid', 'Utgift', 2400], ['Sparing BSU', 'Utgift', 2292],
      ]),
      ...table('E1', [['Oversikt', 'Beløp'], ['Sum inntekter'], ['Sum utgifter'], ['Resultat'], ['Sparerate'], ['Status']]),
    },
    formats: { 'C2:C12': 'kr', 'F2:F4': 'kr', F5: 'pct1' },
    widths: { A: 160, E: 130 },
    bold: [1],
    tasks: [
      { cell: 'F2', solution: '=SUMMERHVIS(B2:B12;"Inntekt";C2:C12)', mustUse: ['SUMMERHVIS'], prompt: 'Summer alle inntekter i F2.', hint: '=SUMMERHVIS(B2:B12;"Inntekt";C2:C12)' },
      { cell: 'F3', solution: '=SUMMERHVIS(B2:B12;"Utgift";C2:C12)', mustUse: ['SUMMERHVIS'], prompt: 'Summer alle utgifter i F3.', hint: 'Samme som over, men «Utgift».' },
      { cell: 'F4', solution: '=F2-F3', prompt: 'Regn ut resultatet i F4.', hint: '=F2-F3' },
      { cell: 'F5', solution: '=F4/F2', prompt: 'Regn ut spareraten (resultat delt på inntekter) i F5.', hint: '=F4/F2' },
      { cell: 'F6', solution: '=HVIS(F4>=0;"Overskudd";"Underskudd")', mustUse: ['HVIS'], prompt: 'Skriv «Overskudd» hvis resultatet er 0 eller mer, ellers «Underskudd». Svar i F6.', hint: '=HVIS(F4>=0;"Overskudd";"Underskudd")' },
    ],
  },
  {
    slug: 'prosjekt-faktura',
    title: 'Prosjekt: Faktura med MVA',
    module: OKONOMI,
    minutes: 10,
    summary: 'Linjesummer, ulike MVA-satser og forfallsdato.',
    intro: `En faktura har ofte varer med ulik MVA-sats. Regn ut hver linje for seg, summer og legg til forfallsdato.

- Linjesum eks. mva = antall × pris
- MVA = linjesum × sats
- Totalt = linjesum + MVA

Forfallsdato = fakturadato + betalingsfrist i dager.`,
    cells: {
      ...table('A1', [
        ['Beskrivelse', 'Antall', 'Pris eks. mva', 'MVA-sats', 'Linjesum', 'MVA', 'Totalt'],
        ['Konsulenttimer', 12, 950, '25%'], ['Reisekostnader', 1, 1840, '25%'], ['Lunsj til workshop', 14, 165, '15%'],
        ['Kursmateriell', 14, 120, '25%'], ['Persontransport', 1, 2200, '12%'],
        ['Sum'],
      ]),
      ...table('A9', [['Fakturadato', '24.11.2026'], ['Betalingsfrist', 14], ['Forfallsdato']]),
    },
    formats: { 'C2:C6': 'kr', 'D2:D6': 'pct', 'E2:G7': 'kr2', B9: 'dato', B11: 'dato' },
    widths: { A: 160, C: 110, E: 110, G: 110 },
    bold: [1, 7],
    fixed: ['B9'],
    tasks: [
      { cell: 'E2:E6', solution: '=B2*C2', prompt: 'Regn ut linjesum eks. mva i E2:E6.', hint: '=B2*C2' },
      { cell: 'F2:F6', solution: '=E2*D2', prompt: 'Regn ut MVA per linje i F2:F6.', hint: '=E2*D2' },
      { cell: 'G2:G6', solution: '=E2+F2', prompt: 'Regn ut totalbeløpet per linje i G2:G6.', hint: '=E2+F2' },
      { cell: 'E7:G7', solution: '=SUMMER(E2:E6)', mustUse: ['SUMMER'], prompt: 'Summer kolonnene E, F og G i rad 7. Fyll formelen mot høyre.', hint: '=SUMMER(E2:E6) i E7, fyll til G7.' },
      { cell: 'B11', solution: '=B9+B10', prompt: 'Regn ut forfallsdatoen i B11.', hint: '=B9+B10' },
    ],
  },
  {
    slug: 'prosjekt-timeliste',
    title: 'Prosjekt: Timeliste med overtid',
    module: OKONOMI,
    minutes: 10,
    summary: 'Klokkeslett, timer, overtid og lønn.',
    intro: `Klokkeslett er også tall i Excel: en brøkdel av et døgn. 12:00 er 0,5. Derfor må du gange med 24 for å få timer:

\`=(C2-B2)*24\` gir antall timer mellom start og slutt.

Pausen står i minutter. Del på 60 for å gjøre den om til timer.

Normal arbeidsdag her er 7,5 timer. Alt over det er overtid. \`STØRST(0;E2-7,5)\` gir 0 i stedet for et negativt tall på korte dager.

Overtid betales med 40 % tillegg.`,
    cells: {
      ...table('A1', [
        ['Dag', 'Start', 'Slutt', 'Pause (min)', 'Timer', 'Overtid'],
        ['Mandag', '07:30', '15:30', 30], ['Tirsdag', '07:00', '17:15', 30], ['Onsdag', '08:00', '15:00', 30],
        ['Torsdag', '07:30', '18:00', 45], ['Fredag', '07:30', '14:30', 30],
        ['Sum'],
      ]),
      ...table('H1', [['Timelønn', 268], ['Overtidstillegg', '40%'], ['Lønn for uka']]),
    },
    formats: { 'B2:C6': 'tid', 'E2:F7': 'dec2', I1: 'kr', I2: 'pct', I3: 'kr2' },
    widths: { D: 100, H: 130 },
    bold: [1, 7],
    tasks: [
      { cell: 'E2:E6', solution: '=(C2-B2)*24-D2/60', prompt: 'Regn ut arbeidstimer minus pause i E2:E6.', hint: '=(C2-B2)*24-D2/60' },
      { cell: 'F2:F6', solution: '=STØRST(0;E2-7,5)', mustUse: ['STØRST'], prompt: 'Regn ut overtid (timer over 7,5) i F2:F6. Korte dager skal gi 0.', hint: '=STØRST(0;E2-7,5)' },
      { cell: 'E7:F7', solution: '=SUMMER(E2:E6)', mustUse: ['SUMMER'], prompt: 'Summer timer og overtid i E7:F7.', hint: '=SUMMER(E2:E6), fyll mot høyre.' },
      { cell: 'I3', solution: '=(E7-F7)*I1+F7*I1*(1+I2)', prompt: 'Regn ut lønna for uka i I3: vanlige timer til timelønn pluss overtid med 40 % tillegg.', hint: '=(E7-F7)*I1+F7*I1*(1+I2)' },
    ],
  },
  {
    slug: 'prosjekt-salgsrapport',
    title: 'Prosjekt: Salgsrapport',
    module: OKONOMI,
    minutes: 12,
    summary: 'Krysstabell, rangering og beste selger.',
    intro: `Avslutningsprosjektet. Du lager en salgsrapport med en krysstabell (region × kvartal), rangerer selgerne og finner den beste.

Krysstabellen bruker \`SUMMER.HVIS.SETT\` med to vilkår. Bland referansene så du kan fylle både ned og mot høyre: \`$F2\` låser kolonnen med regionen, \`G$1\` låser raden med kvartalet.

\`RANG(tall; liste)\` gir plassering, der 1 er størst.

Beste selger: \`INDEKS\` + \`SAMMENLIGNE\` + \`STØRST\`.`,
    cells: {
      ...table('A1', [
        ['Selger', 'Region', 'Kvartal', 'Beløp'],
        ['Kari', 'Vest', 'K1', 182000], ['Jonas', 'Øst', 'K1', 154000], ['Mona', 'Vest', 'K1', 97000],
        ['Kari', 'Vest', 'K2', 201000], ['Jonas', 'Øst', 'K2', 166000], ['Mona', 'Øst', 'K2', 121000],
        ['Kari', 'Øst', 'K3', 143000], ['Jonas', 'Vest', 'K3', 178000], ['Mona', 'Vest', 'K3', 134000],
        ['Kari', 'Vest', 'K4', 219000], ['Jonas', 'Øst', 'K4', 188000], ['Mona', 'Øst', 'K4', 152000],
      ]),
      ...table('F1', [['Region', 'K1', 'K2', 'K3', 'K4'], ['Vest'], ['Øst']]),
      ...table('F5', [['Selger', 'Totalt', 'Rang'], ['Kari'], ['Jonas'], ['Mona'], [''], ['Beste selger']]),
    },
    formats: { 'D2:D13': 'kr', 'G2:J3': 'kr', 'G6:G8': 'kr' },
    widths: { F: 110, G: 110, H: 110, I: 110, J: 110 },
    bold: [1, 5],
    tasks: [
      { cell: 'G2:J3', solution: '=SUMMER.HVIS.SETT($D$2:$D$13;$B$2:$B$13;$F2;$C$2:$C$13;G$1)', mustUse: ['SUMMER.HVIS.SETT'], mustContain: ['$'], prompt: 'Fyll krysstabellen G2:J3 med salg per region og kvartal. Lag formelen i G2 og fyll ned og mot høyre.', hint: '=SUMMER.HVIS.SETT($D$2:$D$13;$B$2:$B$13;$F2;$C$2:$C$13;G$1)' },
      { cell: 'G6:G8', solution: '=SUMMERHVIS($A$2:$A$13;F6;$D$2:$D$13)', mustUse: ['SUMMERHVIS'], prompt: 'Summer totalt salg per selger i G6:G8.', hint: '=SUMMERHVIS($A$2:$A$13;F6;$D$2:$D$13)' },
      { cell: 'H6:H8', solution: '=RANG(G6;$G$6:$G$8)', mustUse: ['RANG'], prompt: 'Ranger selgerne i H6:H8, der 1 er den som har solgt mest.', hint: '=RANG(G6;$G$6:$G$8)' },
      { cell: 'G10', solution: '=INDEKS(F6:F8;SAMMENLIGNE(STØRST(G6:G8);G6:G8;0))', mustUse: ['INDEKS', 'SAMMENLIGNE'], prompt: 'Hent navnet på den beste selgeren i G10.', hint: '=INDEKS(F6:F8;SAMMENLIGNE(STØRST(G6:G8);G6:G8;0))' },
    ],
  },
];

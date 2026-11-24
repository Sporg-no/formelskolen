import { table, type Lesson } from './types';

export const GRUNNLEGGENDE = 'Grunnleggende';
export const LOGIKK = 'Logikk og vilkår';
export const TELLING = 'Telling og betinget sum';

export const lessonsA: Lesson[] = [
  // ───────────────────────── Grunnleggende ─────────────────────────
  {
    slug: 'din-forste-formel',
    title: 'Din første formel',
    module: GRUNNLEGGENDE,
    free: true,
    minutes: 4,
    summary: 'Pluss, minus, gange og dele med cellereferanser.',
    intro: `Alle formler i Excel starter med \`=\`. Etter likhetstegnet skriver du hva som skal regnes ut.

Du kan regne med tall direkte, for eksempel \`=2+3\`. Det vanlige er å peke på **celler**. Da oppdateres svaret av seg selv når tallene endres. \`=B2*C2\` ganger det som står i B2 med det som står i C2.

- \`+\` pluss
- \`-\` minus
- \`*\` gange
- \`/\` dele

Klikk på en celle, skriv formelen og trykk Enter. Mens du skriver formelen kan du klikke på en annen celle for å sette inn referansen til den.`,
    cells: {
      ...table('A1', [
        ['Vare', 'Antall', 'Pris', 'Sum'],
        ['Melk', 2, 22.9],
        ['Brød', 1, 39.9],
        ['Kaffe', 1, 89],
      ]),
      F1: 'Spørsmål', G1: 'Svar',
      F2: 'Kaffe minus melk', F3: 'Kaffe per kopp (10 kopper)',
    },
    formats: { 'C2:D4': 'kr2', 'G2:G3': 'kr2' },
    widths: { A: 90, F: 200 },
    bold: [1],
    tasks: [
      { cell: 'D2', solution: '=B2*C2', prompt: 'Regn ut hva melken koster totalt i D2: antall ganger pris.', hint: 'Skriv =B2*C2 og trykk Enter.' },
      { cell: 'D3', solution: '=B3*C3', prompt: 'Gjør det samme for brødet i D3.', hint: '=B3*C3' },
      { cell: 'G2', solution: '=C4-C2', prompt: 'Hvor mye dyrere er en kaffe enn én melk? Svar i G2.', hint: 'Trekk prisen på melk (C2) fra prisen på kaffe (C4).' },
      { cell: 'G3', solution: '=C4/10', prompt: 'Kaffen gir 10 kopper. Hva koster én kopp? Svar i G3.', hint: 'Del C4 på 10.' },
    ],
  },
  {
    slug: 'kopier-og-fyll-ned',
    title: 'Kopier formler og fyll ned',
    module: GRUNNLEGGENDE,
    free: true,
    minutes: 5,
    summary: 'Relative referanser og fyllhåndtaket.',
    intro: `Når du kopierer en formel, flytter Excel referansene like mye som du flytter formelen. Kopierer du \`=B2*C2\` én rad ned, blir den \`=B3*C3\`. Dette kalles **relative referanser**.

Slik fyller du ned:
- Skriv formelen i første celle.
- Dra den lille firkanten nederst til høyre i cellen nedover (fyllhåndtaket).
- Eller kopier med Ctrl+C (Cmd+C på Mac), merk cellene under og lim inn med Ctrl+V.

Med fyllhåndtaket skriver du formelen én gang, uansett om tabellen har 5 eller 5 000 rader.`,
    cells: table('A1', [
      ['Ansatt', 'Timer', 'Timelønn', 'Lønn'],
      ['Kari', 37.5, 245],
      ['Ola', 30, 230],
      ['Ingrid', 40, 262],
      ['Ahmed', 22.5, 230],
      ['Sofie', 15, 215],
      ['Sum'],
    ]),
    formats: { 'C2:D7': 'kr' },
    bold: [1, 7],
    tasks: [
      { cell: 'D2:D6', solution: '=B2*C2', prompt: 'Regn ut lønna i D2 (timer ganger timelønn) og fyll formelen ned til D6.', hint: 'Skriv =B2*C2 i D2. Dra fyllhåndtaket ned til D6, eller kopier D2 og lim inn i D3:D6.' },
      { cell: 'D7', solution: '=D2+D3+D4+D5+D6', prompt: 'Legg sammen all lønn i D7 med pluss.', hint: '=D2+D3+D4+D5+D6. I neste leksjon lærer du en raskere måte.' },
    ],
  },
  {
    slug: 'summer',
    title: 'SUMMER',
    module: GRUNNLEGGENDE,
    free: true,
    minutes: 4,
    summary: 'Legg sammen et helt område på én gang.',
    intro: `\`SUMMER\` legger sammen alle tallene i et område. Et område skrives med kolon: \`B2:B13\` betyr alle cellene fra B2 til og med B13.

\`=SUMMER(B2:B13)\`

I norsk Excel skilles argumenter med semikolon: \`=SUMMER(B2:B4;B8)\` legger sammen B2 til B4 og B8.

Engelsk Excel kaller funksjonen \`SUM\`. Begge navnene virker her, men lær deg det norske hvis du bruker norsk Excel.`,
    cells: {
      ...table('A1', [
        ['Måned', 'kWh', 'Kostnad'],
        ['Januar', 2150, 3010], ['Februar', 1980, 2574], ['Mars', 1720, 1892], ['April', 1310, 1179],
        ['Mai', 940, 658], ['Juni', 610, 366], ['Juli', 540, 270], ['August', 590, 413],
        ['September', 880, 792], ['Oktober', 1290, 1419], ['November', 1760, 2288], ['Desember', 2240, 3360],
        ['Sum'],
      ]),
      E1: 'Første kvartal (jan–mar)',
    },
    formats: { 'C2:C14': 'kr', 'B2:B14': 'int', F1: 'kr' },
    widths: { A: 100, E: 190 },
    bold: [1, 14],
    tasks: [
      { cell: 'B14', solution: '=SUMMER(B2:B13)', mustUse: ['SUMMER'], prompt: 'Summer strømforbruket for hele året i B14 med SUMMER.', hint: '=SUMMER(B2:B13)' },
      { cell: 'C14', solution: '=SUMMER(C2:C13)', mustUse: ['SUMMER'], prompt: 'Summer kostnaden for året i C14.', hint: 'Samme som over, men for kolonne C.' },
      { cell: 'F1', solution: '=SUMMER(C2:C4)', mustUse: ['SUMMER'], prompt: 'Hva kostet strømmen i første kvartal? Svar i F1.', hint: '=SUMMER(C2:C4)' },
    ],
  },
  {
    slug: 'gjennomsnitt-min-storst',
    title: 'GJENNOMSNITT, MIN, STØRST og ANTALL',
    module: GRUNNLEGGENDE,
    minutes: 5,
    summary: 'De fire funksjonene du bruker nest oftest etter SUMMER.',
    intro: `Fire funksjoner som virker på samme måte som \`SUMMER\`:

- \`GJENNOMSNITT(område)\` gir gjennomsnittet. Engelsk: AVERAGE.
- \`MIN(område)\` gir det minste tallet.
- \`STØRST(område)\` gir det største tallet. Engelsk: MAX.
- \`ANTALL(område)\` teller hvor mange celler som inneholder **tall**. Engelsk: COUNT.

Tekst og tomme celler hoppes over. Står det «Fri» i en celle, telles den ikke med av \`ANTALL\` og påvirker ikke gjennomsnittet.`,
    cells: {
      ...table('A1', [
        ['Dag', 'Kolli levert'],
        ['Man 2.11', 412], ['Tir 3.11', 388], ['Ons 4.11', 455], ['Tor 5.11', 401], ['Fre 6.11', 520],
        ['Man 9.11', 397], ['Tir 10.11', 'Fri'], ['Ons 11.11', 468], ['Tor 12.11', 433], ['Fre 13.11', 541],
      ]),
      ...table('D1', [['Nøkkeltall', 'Verdi'], ['Snitt per dag'], ['Beste dag'], ['Svakeste dag'], ['Dager med levering']]),
    },
    formats: { E2: 'dec1' },
    widths: { A: 100, B: 110, D: 160 },
    bold: [1],
    tasks: [
      { cell: 'E2', solution: '=GJENNOMSNITT(B2:B11)', mustUse: ['GJENNOMSNITT'], prompt: 'Finn gjennomsnittlig antall kolli per dag i E2.', hint: '=GJENNOMSNITT(B2:B11)' },
      { cell: 'E3', solution: '=STØRST(B2:B11)', mustUse: ['STØRST'], prompt: 'Finn den beste dagen (flest kolli) i E3.', hint: '=STØRST(B2:B11)' },
      { cell: 'E4', solution: '=MIN(B2:B11)', mustUse: ['MIN'], prompt: 'Finn den svakeste dagen i E4.', hint: '=MIN(B2:B11)' },
      { cell: 'E5', solution: '=ANTALL(B2:B11)', mustUse: ['ANTALL'], prompt: 'Tell hvor mange dager det ble levert i E5. Fridagen skal ikke telles.', hint: '=ANTALL(B2:B11) teller bare celler med tall.' },
    ],
  },
  {
    slug: 'prosent-og-mva',
    title: 'Prosent og MVA',
    module: GRUNNLEGGENDE,
    minutes: 6,
    summary: 'Regn ut moms, priser med og uten MVA og prosentandeler.',
    intro: `25 % er det samme som 0,25. I Excel kan du skrive begge: \`=B2*25%\` og \`=B2*0,25\` gir samme svar.

Vanlig merverdiavgift i Norge er 25 %. Matvarer har 15 %.

- MVA av en pris uten MVA: \`=pris*25%\`
- Pris med MVA: \`=pris*1,25\` eller pris + MVA
- Pris uten MVA når du har prisen med MVA: \`=pris/1,25\`

En vanlig feil er å trekke fra 25 % av prisen med MVA. Det gir feil svar. Del på 1,25.`,
    cells: {
      ...table('A1', [
        ['Vare', 'Pris eks. mva', 'MVA (25 %)', 'Pris inkl. mva'],
        ['Drill', 1196], ['Bitssett', 239.2], ['Arbeidshansker', 119.2], ['Vernebriller', 79.2],
      ]),
      F1: 'Pris inkl. mva', G1: 'Pris eks. mva',
      F2: '1 250',
    },
    formats: { 'B2:D5': 'kr2', 'F2:G2': 'kr2' },
    widths: { A: 130, B: 120, C: 110, D: 120, F: 120, G: 120 },
    bold: [1],
    tasks: [
      { cell: 'C2:C5', solution: '=B2*25%', prompt: 'Regn ut MVA for hver vare i C2:C5.', hint: '=B2*25% i C2, fyll ned.' },
      { cell: 'D2:D5', solution: '=B2+C2', prompt: 'Regn ut pris inkl. mva i D2:D5.', hint: '=B2+C2, eller =B2*1,25' },
      { cell: 'G2', solution: '=F2/1,25', prompt: 'En vare koster 1 250 kr med MVA (F2). Hva er prisen uten MVA? Svar i G2.', hint: 'Del på 1,25: =F2/1,25' },
    ],
  },
  {
    slug: 'absolutte-referanser',
    title: 'Absolutte referanser med $',
    module: GRUNNLEGGENDE,
    minutes: 6,
    summary: 'Lås en celle med $ når du fyller ned.',
    intro: `Noen ganger skal alle radene bruke samme celle, for eksempel én fast provisjonssats. Da må referansen ikke flytte seg når du fyller ned.

Sett \`$\` foran kolonnen og raden: \`$F$1\`. Da står referansen fast.

\`=B2*$F$1\` fylt ned blir \`=B3*$F$1\`, \`=B4*$F$1\` og så videre.

Uten dollartegn blir det \`=B3*F2\`, \`=B4*F3\`. Det peker på tomme celler og gir feil svar.

Tips: Trykk F4 mens markøren står i en referanse i Excel, så setter Excel inn dollartegnene for deg.`,
    cells: {
      ...table('A1', [
        ['Selger', 'Salg', 'Provisjon', 'Andel av mål'],
        ['Kari', 184000], ['Jonas', 231500], ['Leila', 167250], ['Erik', 245800], ['Mona', 199900],
      ]),
      E1: 'Provisjonssats', F1: '8%',
      E2: 'Salgsmål', F2: '200 000',
    },
    formats: { 'B2:C6': 'kr', F1: 'pct', F2: 'kr', 'D2:D6': 'pct' },
    widths: { E: 130 },
    bold: [1],
    tasks: [
      { cell: 'C2:C6', solution: '=B2*$F$1', mustContain: ['$'], prompt: 'Regn ut provisjonen for hver selger i C2:C6 med satsen i F1. Fyll ned.', hint: '=B2*$F$1' },
      { cell: 'D2:D6', solution: '=B2/$F$2', mustContain: ['$'], prompt: 'Hvor mange prosent av salgsmålet (F2) nådde hver selger? Svar i D2:D6.', hint: '=B2/$F$2. Cellen er formatert som prosent.' },
    ],
  },
  {
    slug: 'parenteser-og-rekkefolge',
    title: 'Regnerekkefølge og parenteser',
    module: GRUNNLEGGENDE,
    minutes: 5,
    summary: 'Gange før pluss, og parenteser når du vil noe annet.',
    intro: `Excel følger vanlig regnerekkefølge:

- Parenteser først
- Så potens \`^\`
- Så gange og dele
- Til slutt pluss og minus

\`=B2+C2+D2/3\` deler bare D2 på 3. Vil du ha gjennomsnittet av tre celler, må du skrive \`=(B2+C2+D2)/3\`.

Fart i km/t når du har kilometer og minutter: \`=km/(minutter/60)\`.`,
    cells: {
      ...table('A1', [
        ['Elev', 'Prøve 1', 'Prøve 2', 'Prøve 3', 'Snitt'],
        ['Emma', 4, 5, 5], ['Noah', 3, 4, 2], ['Sara', 6, 5, 6], ['Lukas', 2, 3, 4],
      ]),
      ...table('A8', [['Tur', 'Km', 'Minutter', 'Km/t'], ['Sykkel til jobb', 14.5, 38]]),
    },
    formats: { 'E2:E5': 'dec1', D9: 'dec1' },
    widths: { A: 130 },
    bold: [1, 8],
    tasks: [
      { cell: 'E2:E5', solution: '=(B2+C2+D2)/3', prompt: 'Regn ut snittet av de tre prøvene i E2:E5 uten å bruke GJENNOMSNITT.', hint: 'Husk parenteser: =(B2+C2+D2)/3' },
      { cell: 'D9', solution: '=B9/(C9/60)', prompt: 'Hvor fort gikk sykkelturen i km/t? Svar i D9.', hint: 'Gjør minutter om til timer først: =B9/(C9/60)' },
    ],
  },

  // ───────────────────────── Logikk ─────────────────────────
  {
    slug: 'hvis',
    title: 'HVIS',
    module: LOGIKK,
    minutes: 6,
    summary: 'La formelen velge mellom to svar.',
    intro: `\`HVIS\` sjekker om noe er sant og gir ett av to svar:

\`=HVIS(test; svar_hvis_sant; svar_hvis_usant)\`

\`=HVIS(B2>=50;"Bestått";"Ikke bestått")\`

Sammenligninger du kan bruke: \`=\` \`<>\` (ikke lik) \`>\` \`<\` \`>=\` \`<=\`.

Tekst skrives i anførselstegn. Tall skrives uten. Engelsk navn: IF.`,
    cells: {
      ...table('A1', [
        ['Kandidat', 'Poeng', 'Resultat'],
        ['A. Berg', 72], ['B. Dahl', 48], ['C. Eide', 50], ['D. Holm', 31], ['E. Lie', 88], ['F. Moen', 49],
      ]),
      ...table('A10', [['Ordre', 'Beløp', 'Frakt'], ['10021', 1490], ['10022', 640], ['10023', 1000], ['10024', 995]]),
      E10: 'Gratis frakt fra 1 000 kr, ellers 99 kr',
    },
    formats: { 'B11:C14': 'kr' },
    widths: { C: 120 },
    bold: [1, 10],
    fixed: ['A11:A14'],
    tasks: [
      { cell: 'C2:C7', solution: '=HVIS(B2>=50;"Bestått";"Ikke bestått")', mustUse: ['HVIS'], prompt: 'Grensen for bestått er 50 poeng. Skriv «Bestått» eller «Ikke bestått» i C2:C7.', hint: '=HVIS(B2>=50;"Bestått";"Ikke bestått")' },
      { cell: 'C11:C14', solution: '=HVIS(B11>=1000;0;99)', mustUse: ['HVIS'], prompt: 'Ordrer på 1 000 kr eller mer får gratis frakt. Andre betaler 99 kr. Regn ut frakten i C11:C14.', hint: '=HVIS(B11>=1000;0;99)' },
    ],
  },
  {
    slug: 'og-eller',
    title: 'HVIS med OG og ELLER',
    module: LOGIKK,
    minutes: 6,
    summary: 'Flere krav i samme test.',
    intro: `\`OG\` er sann bare når **alle** testene er sanne. \`ELLER\` er sann når **minst én** er sann.

\`=OG(B2>=21;C2="Ja")\`

\`=ELLER(D2>=5;B2>=30)\`

Sett dem inn som test i \`HVIS\`:

\`=HVIS(OG(B2>=21;C2="Ja");"Ja";"Nei")\`

Engelske navn: AND og OR. \`IKKE\` (NOT) snur sant til usant.`,
    cells: table('A1', [
      ['Søker', 'Alder', 'Førerkort', 'Års erfaring', 'Kan kjøre', 'Intervju'],
      ['Marius', 24, 'Ja', 2], ['Hanne', 19, 'Ja', 1], ['Tobias', 33, 'Nei', 8], ['Aisha', 27, 'Ja', 6],
      ['Petter', 21, 'Ja', 0], ['Lina', 45, 'Nei', 3],
    ]),
    widths: { D: 110, E: 100 },
    bold: [1],
    tasks: [
      { cell: 'E2:E7', solution: '=HVIS(OG(B2>=21;C2="Ja");"Ja";"Nei")', mustUse: ['OG'], prompt: 'Søkeren kan kjøre hvis hen er minst 21 år og har førerkort. Skriv «Ja» eller «Nei» i E2:E7.', hint: '=HVIS(OG(B2>=21;C2="Ja");"Ja";"Nei")' },
      { cell: 'F2:F7', solution: '=HVIS(ELLER(D2>=5;B2>=30);"Ja";"Nei")', mustUse: ['ELLER'], prompt: 'Søkere med minst 5 års erfaring eller som er 30 år eller eldre kalles inn til intervju. Fyll ut F2:F7.', hint: '=HVIS(ELLER(D2>=5;B2>=30);"Ja";"Nei")' },
    ],
  },
  {
    slug: 'flere-vilkar',
    title: 'Flere vilkår: HVIS.SETT og nøstet HVIS',
    module: LOGIKK,
    minutes: 7,
    summary: 'Gi karakter 1–6 ut fra poeng.',
    intro: `Når det er mer enn to mulige svar, kan du sette en \`HVIS\` inni en annen:

\`=HVIS(C2>=5;"Svært bra";HVIS(C2>=3;"Bra";"Må øve"))\`

Det blir fort uoversiktlig. \`HVIS.SETT\` tar par av test og svar, og gir svaret til den første testen som er sann:

\`=HVIS.SETT(B2>=90;6;B2>=77;5;B2>=58;4;B2>=41;3;B2>=21;2;SANN;1)\`

\`SANN\` til slutt fungerer som «ellers». Rekkefølgen er viktig: start med den strengeste grensen. Engelsk navn: IFS.`,
    cells: {
      ...table('A1', [
        ['Elev', 'Poeng', 'Karakter', 'Kommentar'],
        ['Amalie', 93], ['Benjamin', 64], ['Celine', 77], ['David', 18], ['Ella', 41], ['Filip', 56], ['Hedda', 89], ['Isak', 22],
      ]),
      ...table('F1', [['Fra poeng', 'Karakter'], [90, 6], [77, 5], [58, 4], [41, 3], [21, 2], [0, 1]]),
    },
    widths: { D: 120, F: 90 },
    bold: [1],
    tasks: [
      { cell: 'C2:C9', solution: '=HVIS.SETT(B2>=90;6;B2>=77;5;B2>=58;4;B2>=41;3;B2>=21;2;SANN;1)', prompt: 'Sett karakter i C2:C9 etter skalaen i F:G. Bruk HVIS.SETT eller nøstede HVIS.', hint: '=HVIS.SETT(B2>=90;6;B2>=77;5;B2>=58;4;B2>=41;3;B2>=21;2;SANN;1)' },
      { cell: 'D2:D9', solution: '=HVIS(C2>=5;"Svært bra";HVIS(C2>=3;"Bra";"Må øve"))', prompt: 'Skriv «Svært bra» for karakter 5–6, «Bra» for 3–4 og «Må øve» ellers i D2:D9.', hint: '=HVIS(C2>=5;"Svært bra";HVIS(C2>=3;"Bra";"Må øve"))' },
    ],
  },
  {
    slug: 'hvisfeil',
    title: 'HVISFEIL',
    module: LOGIKK,
    minutes: 4,
    summary: 'Bytt ut #DIV/0! og andre feil med noe pent.',
    intro: `Når Excel ikke kan regne ut noe, får du en feilverdi:

- \`#DIV/0!\` deling på null
- \`#I/T\` ikke tilgjengelig, f.eks. når et oppslag ikke finner noe
- \`#VERDI!\` feil type, f.eks. tekst der det skal være tall
- \`#NAVN?\` Excel kjenner ikke funksjonsnavnet

\`HVISFEIL\` gir et annet svar hvis formelen gir feil:

\`=HVISFEIL(C2/B2-1;"Ingen budsjett")\`

Engelsk navn: IFERROR. Ikke bruk den til å skjule feil du burde rette.`,
    cells: table('A1', [
      ['Post', 'Budsjett', 'Faktisk', 'Avvik'],
      ['Reise', 20000, 23400], ['Kurs', 15000, 9800], ['Rekvisita', 0, 1250], ['Kantine', 8000, 8000],
      ['Programvare', 12000, 15600], ['Gaver', 0, 0],
    ]),
    formats: { 'B2:C7': 'kr', 'D2:D7': 'pct' },
    widths: { A: 110 },
    bold: [1],
    tasks: [
      { cell: 'D2:D7', solution: '=HVISFEIL(C2/B2-1;"Ingen budsjett")', mustUse: ['HVISFEIL'], prompt: 'Regn ut avviket i prosent (faktisk delt på budsjett, minus 1) i D2:D7. Der budsjettet er 0 skal det stå «Ingen budsjett».', hint: '=HVISFEIL(C2/B2-1;"Ingen budsjett")' },
    ],
  },

  // ───────────────────────── Telling og betinget sum ─────────────────────────
  {
    slug: 'antall-hvis',
    title: 'ANTALL.HVIS',
    module: TELLING,
    minutes: 6,
    summary: 'Tell rader som oppfyller et vilkår.',
    intro: `\`ANTALL.HVIS\` teller cellene i et område som oppfyller et vilkår:

\`=ANTALL.HVIS(B2:B13;"Telefon")\`

Vilkåret kan være tekst, et tall eller en sammenligning i anførselstegn:

- \`"Åpen"\` lik teksten (store og små bokstaver spiller ingen rolle)
- \`">15"\` større enn 15
- \`"<>Løst"\` alt unntatt «Løst»
- \`"S*"\` tekst som starter med S

Vilkåret kan også stå i en egen celle: \`=ANTALL.HVIS(B2:B13;F5)\`. Engelsk navn: COUNTIF.`,
    cells: {
      ...table('A1', [
        ['Dato', 'Kanal', 'Status', 'Minutter'],
        ['02.11.2026', 'Telefon', 'Løst', 12], ['02.11.2026', 'E-post', 'Løst', 8], ['03.11.2026', 'Chat', 'Åpen', 21],
        ['03.11.2026', 'Telefon', 'Løst', 17], ['04.11.2026', 'Telefon', 'Åpen', 34], ['04.11.2026', 'Chat', 'Løst', 6],
        ['05.11.2026', 'E-post', 'Løst', 15], ['05.11.2026', 'Telefon', 'Løst', 9], ['06.11.2026', 'Chat', 'Åpen', 26],
        ['06.11.2026', 'E-post', 'Åpen', 11], ['09.11.2026', 'Telefon', 'Løst', 19], ['09.11.2026', 'Chat', 'Løst', 4],
      ]),
      ...table('F1', [['Spørsmål', 'Svar'], ['Telefonhenvendelser'], ['Åpne saker'], ['Saker over 15 min'], ['Chat']]),
    },
    formats: { 'A2:A13': 'dato' },
    widths: { A: 100, F: 170 },
    bold: [1],
    tasks: [
      { cell: 'G2', solution: '=ANTALL.HVIS(B2:B13;"Telefon")', mustUse: ['ANTALL.HVIS'], prompt: 'Tell hvor mange henvendelser som kom på telefon. Svar i G2.', hint: '=ANTALL.HVIS(B2:B13;"Telefon")' },
      { cell: 'G3', solution: '=ANTALL.HVIS(C2:C13;"Åpen")', mustUse: ['ANTALL.HVIS'], prompt: 'Tell hvor mange saker som fortsatt er åpne. Svar i G3.', hint: '=ANTALL.HVIS(C2:C13;"Åpen")' },
      { cell: 'G4', solution: '=ANTALL.HVIS(D2:D13;">15")', mustUse: ['ANTALL.HVIS'], prompt: 'Tell hvor mange saker som tok mer enn 15 minutter. Svar i G4.', hint: '=ANTALL.HVIS(D2:D13;">15")' },
      { cell: 'G5', solution: '=ANTALL.HVIS(B2:B13;F5)', mustUse: ['ANTALL.HVIS'], prompt: 'Tell henvendelser for kanalen som står i F5. Pek på F5 i stedet for å skrive teksten.', hint: '=ANTALL.HVIS(B2:B13;F5)' },
    ],
  },
  {
    slug: 'summerhvis',
    title: 'SUMMERHVIS',
    module: TELLING,
    minutes: 6,
    summary: 'Summer bare radene som passer.',
    intro: `\`SUMMERHVIS\` legger sammen tall i én kolonne for radene som oppfyller et vilkår i en annen kolonne:

\`=SUMMERHVIS(B2:B16;"Mat";C2:C16)\`

1. Området som sjekkes (kategorien)
2. Vilkåret
3. Området som summeres (beløpet)

Lager du en oversikt med én rad per kategori, lås områdene med \`$\` så du kan fylle ned:

\`=SUMMERHVIS($B$2:$B$16;E2;$C$2:$C$16)\`

Utelater du det tredje argumentet, summeres det første området. \`=SUMMERHVIS(C2:C16;">1000")\` summerer alle beløp over 1 000. Engelsk navn: SUMIF.`,
    cells: {
      ...table('A1', [
        ['Dato', 'Kategori', 'Beløp'],
        ['01.11.2026', 'Bolig', 14500], ['02.11.2026', 'Mat', 1240], ['03.11.2026', 'Transport', 899], ['04.11.2026', 'Mat', 412],
        ['05.11.2026', 'Fritid', 650], ['07.11.2026', 'Mat', 1875], ['08.11.2026', 'Transport', 320], ['10.11.2026', 'Fritid', 1290],
        ['12.11.2026', 'Mat', 968], ['14.11.2026', 'Bolig', 1150], ['16.11.2026', 'Transport', 899], ['18.11.2026', 'Mat', 1534],
        ['20.11.2026', 'Fritid', 299], ['22.11.2026', 'Mat', 742], ['24.11.2026', 'Transport', 410],
      ]),
      ...table('E1', [['Kategori', 'Sum'], ['Bolig'], ['Mat'], ['Transport'], ['Fritid'], [''], ['Beløp over 1 000']]),
    },
    formats: { 'A2:A16': 'dato', 'C2:C16': 'kr', 'F2:F7': 'kr' },
    widths: { A: 100, B: 100, E: 140 },
    bold: [1],
    tasks: [
      { cell: 'F2:F5', solution: '=SUMMERHVIS($B$2:$B$16;E2;$C$2:$C$16)', mustUse: ['SUMMERHVIS'], prompt: 'Summer utgiftene per kategori i F2:F5. Pek på kategorien i kolonne E, og fyll ned.', hint: '=SUMMERHVIS($B$2:$B$16;E2;$C$2:$C$16)' },
      { cell: 'F7', solution: '=SUMMERHVIS(C2:C16;">1000")', mustUse: ['SUMMERHVIS'], prompt: 'Summer alle enkeltutgifter over 1 000 kr i F7.', hint: '=SUMMERHVIS(C2:C16;">1000")' },
    ],
  },
  {
    slug: 'flere-vilkar-sum-og-antall',
    title: 'SUMMER.HVIS.SETT og ANTALL.HVIS.SETT',
    module: TELLING,
    minutes: 7,
    summary: 'Sum og telling med flere vilkår samtidig.',
    intro: `Når du har flere vilkår, bruker du \`.HVIS.SETT\`-variantene.

\`=SUMMER.HVIS.SETT(D2:D15;A2:A15;"Kari";B2:B15;"Vest")\`

Legg merke til at summeringsområdet kommer **først** i \`SUMMER.HVIS.SETT\`, og så par av område og vilkår.

\`=ANTALL.HVIS.SETT(B2:B15;"Øst";D2:D15;">5000")\`

Alle vilkårene må være oppfylt for at raden skal telles. Engelske navn: SUMIFS og COUNTIFS.`,
    cells: {
      ...table('A1', [
        ['Selger', 'Region', 'Produkt', 'Beløp'],
        ['Kari', 'Vest', 'Abonnement', 4200], ['Jonas', 'Øst', 'Lisens', 7800], ['Kari', 'Øst', 'Lisens', 6100], ['Mona', 'Nord', 'Kurs', 3500],
        ['Kari', 'Vest', 'Kurs', 2900], ['Jonas', 'Vest', 'Abonnement', 5400], ['Mona', 'Øst', 'Abonnement', 4800], ['Kari', 'Vest', 'Lisens', 8800],
        ['Jonas', 'Øst', 'Kurs', 3100], ['Mona', 'Vest', 'Lisens', 9200], ['Kari', 'Nord', 'Abonnement', 4100], ['Jonas', 'Øst', 'Lisens', 5600],
        ['Mona', 'Øst', 'Kurs', 2700], ['Kari', 'Vest', 'Abonnement', 4400],
      ]),
      ...table('F1', [['Spørsmål', 'Svar'], ['Karis salg i Vest'], ['Salg i Øst over 5 000'], ['Lisenssalg i Øst (kr)']]),
    },
    formats: { 'D2:D15': 'kr', G2: 'kr', G4: 'kr' },
    widths: { C: 110, F: 180 },
    bold: [1],
    tasks: [
      { cell: 'G2', solution: '=SUMMER.HVIS.SETT(D2:D15;A2:A15;"Kari";B2:B15;"Vest")', mustUse: ['SUMMER.HVIS.SETT'], prompt: 'Hvor mye solgte Kari i region Vest? Svar i G2.', hint: '=SUMMER.HVIS.SETT(D2:D15;A2:A15;"Kari";B2:B15;"Vest")' },
      { cell: 'G3', solution: '=ANTALL.HVIS.SETT(B2:B15;"Øst";D2:D15;">5000")', mustUse: ['ANTALL.HVIS.SETT'], prompt: 'Hvor mange salg i Øst var over 5 000 kr? Svar i G3.', hint: '=ANTALL.HVIS.SETT(B2:B15;"Øst";D2:D15;">5000")' },
      { cell: 'G4', solution: '=SUMMER.HVIS.SETT(D2:D15;B2:B15;"Øst";C2:C15;"Lisens")', mustUse: ['SUMMER.HVIS.SETT'], prompt: 'Hvor mye ble det solgt lisenser for i Øst? Svar i G4.', hint: 'To vilkår: region Øst og produkt Lisens.' },
    ],
  },
  {
    slug: 'gjennomsnitthvis',
    title: 'GJENNOMSNITTHVIS',
    module: TELLING,
    minutes: 5,
    summary: 'Gjennomsnitt for en gruppe.',
    intro: `\`GJENNOMSNITTHVIS\` virker som \`SUMMERHVIS\`, men gir gjennomsnittet:

\`=GJENNOMSNITTHVIS(B2:B13;"Løp";C2:C13)\`

Med flere vilkår bruker du \`GJENNOMSNITT.HVIS.SETT\`, der gjennomsnittsområdet kommer først:

\`=GJENNOMSNITT.HVIS.SETT(C2:C13;B2:B13;"Løp";D2:D13;">150")\`

Engelske navn: AVERAGEIF og AVERAGEIFS.`,
    cells: {
      ...table('A1', [
        ['Dato', 'Økt', 'Minutter', 'Snittpuls'],
        ['02.11.2026', 'Løp', 42, 152], ['03.11.2026', 'Styrke', 55, 118], ['04.11.2026', 'Sykkel', 75, 138], ['05.11.2026', 'Løp', 35, 161],
        ['07.11.2026', 'Løp', 68, 146], ['08.11.2026', 'Sykkel', 90, 131], ['09.11.2026', 'Styrke', 50, 121], ['10.11.2026', 'Løp', 30, 166],
        ['12.11.2026', 'Sykkel', 60, 142], ['14.11.2026', 'Løp', 81, 149], ['15.11.2026', 'Styrke', 45, 115], ['16.11.2026', 'Løp', 38, 158],
      ]),
      ...table('F1', [['Spørsmål', 'Svar'], ['Snittlengde løpeøkt (min)'], ['Snittpuls sykkel'], ['Snittlengde harde løp (puls over 150)']]),
    },
    formats: { 'A2:A13': 'dato', 'G2:G4': 'dec1' },
    widths: { A: 100, F: 250 },
    bold: [1],
    tasks: [
      { cell: 'G2', solution: '=GJENNOMSNITTHVIS(B2:B13;"Løp";C2:C13)', mustUse: ['GJENNOMSNITTHVIS'], prompt: 'Hvor lang er en løpeøkt i snitt? Svar i G2.', hint: '=GJENNOMSNITTHVIS(B2:B13;"Løp";C2:C13)' },
      { cell: 'G3', solution: '=GJENNOMSNITTHVIS(B2:B13;"Sykkel";D2:D13)', mustUse: ['GJENNOMSNITTHVIS'], prompt: 'Hva er snittpulsen på sykkeløktene? Svar i G3.', hint: 'Samme oppbygning, men kolonne D og «Sykkel».' },
      { cell: 'G4', solution: '=GJENNOMSNITT.HVIS.SETT(C2:C13;B2:B13;"Løp";D2:D13;">150")', mustUse: ['GJENNOMSNITT.HVIS.SETT'], prompt: 'Hvor lange er løpeøktene med snittpuls over 150 i snitt? Svar i G4.', hint: '=GJENNOMSNITT.HVIS.SETT(C2:C13;B2:B13;"Løp";D2:D13;">150")' },
    ],
  },
];

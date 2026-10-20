# BuCoWall — Buckling of Columns and Walls

Laboratorio interattivo per lo studio dell’instabilità di colonne e pareti in muratura.

## Stato

Versione 0.1 implementata: interfaccia inglese, percorso guidato in quattro lezioni, schemi strutturali, curve interattive, parametri dimensionali e checkpoint didattici. Funziona in locale e come sito statico su GitHub Pages.

Sito web: [BuCoWall](https://gcastellazzi.github.io/BuCoWall/).

## Avvio locale

Richiede Node.js >= 22.12 (consigliato Node 24).

```sh
npm ci
npm run dev
```

Aprire l’URL stampato da Vite. Non aprire direttamente `index.html` tramite `file://`.

```sh
npm test
npm run build
npm run preview
```

La build statica si trova in `dist/`. Nessun account, backend o servizio esterno è necessario durante l’uso.

## GitHub Pages

Il workflow `.github/workflows/pages.yml` esegue installazione, test, build e deploy su ogni push al branch `main`, oppure su avvio manuale. Il repository usa **Settings → Pages → Source → GitHub Actions**. Gli asset usano URL relativi per funzionare anche sotto il percorso del repository.

## Uso del percorso guidato

Le quattro lezioni sono navigabili liberamente. Modificare i parametri, usare i preset, spostare il cursore dell’eccentricità corrente oppure cliccare sulla curva. Il pulsante “Go to peak/failure” seleziona il punto limite. Ogni lezione termina con una domanda e feedback; i checkpoint completati sono segnati nella navigazione. La progressione resta in memoria durante la sessione e si azzera ricaricando la pagina.

Nel modello a resistenza finita, β è il parametro indipendente: la resistenza σc corrispondente viene calcolata dalla geometria e mostrata nel pannello esplicativo. Il percorso oltre il collasso è segnalato come continuazione teorica.

Le verifiche numeriche coprono continuità, picchi, regimi di collasso, concordanza Sahlin–Yokel, profilo deformato e scalatura dimensionale. Non è ancora stata eseguita una verifica visiva automatizzata in browser.

## Materiale di riferimento

Capitolo 5 e lezione 5 del materiale didattico del corso MHMS (materiale conservato separatamente dal repository).

## Esperienza proposta

Un laboratorio che apre direttamente su controlli e risultati: parametri a sinistra, schema strutturale e curva carico–eccentricità al centro, risultati e spiegazioni a destra. Pannelli chiari, bordi sottili e accenti verde petrolio coerenti con le app di riferimento. Su schermi piccoli i pannelli si dispongono in verticale.

La selezione di un punto sulla curva aggiorna eccentricità corrente, carico, porzione compressa e distribuzione delle tensioni. Il ramo crescente e quello oltre il massimo devono essere distinguibili: il ramo oltre il massimo descrive equilibri instabili sotto controllo di carico.

## Modelli della prima versione

### 1. Modello a un grado di libertà

Elemento rigido di altezza `l`, strato deformabile alla base di spessore `a`, sezione rettangolare di spessore `t` e profondità `b`. Materiale elastico in compressione e non resistente a trazione; piccoli spostamenti, con equilibrio nella configurazione deformata.

Con `ε = e/t` e `δ = Δ/t`:

- `PE = E b t³ / (12 a l)`.
- Sezione interamente compressa: `P/PE = 1 − ε/δ`, per `ε ≤ δ ≤ 1/6`.
- Sezione parzialmente compressa: `P/PE = (27/2)(δ − ε)(1 − 2δ)²`, per `max(ε, 1/6) ≤ δ ≤ 1/2`.
- Picco: `δcr = (1 + 4ε)/6` e `Pcr/PE = (1 − 2ε)³`.
- Profondità compressa: `η = t` nel nucleo; `η = 3t(1/2 − δ)` fuori dal nucleo.

Il caso `e = 0` richiede una gestione esplicita della biforcazione: il percorso rettilineo non si ricava dividendo per `δ = 0`.

### 2. Resistenza a compressione finita

Estensione del modello a un grado di libertà con resistenza fragile `σc`:

- `Pc = σc b t`.
- `β = Pc/PE = 12 σc a l / (E t²)`.
- Limite di schiacciamento: `P*/PE = β/(1 + 6δ)` nel nucleo e `P*/PE = (3/4)β(1 − 2δ)` fuori dal nucleo.
- Individuare il primo limite sul percorso di carico: schiacciamento della sezione integra, schiacciamento della sezione fessurata o instabilità.

La curva limite di compressione va sovrapposta a quella di equilibrio. Il carico di collasso non è il minimo globale dei valori lungo il ramo discendente.

### 3. Colonna deformabile: Sahlin e Yokel

Colonna a sezione rettangolare con doppia cerniera, altezza totale `H = 2l` e uguali eccentricità alle estremità. `J = b t³/12`, `PE = π²EJ/H²` e `P/PE = 4(αl)²/π²`.

Implementare le funzioni `f1`, `f2`, `f3` del capitolo per distinguere sezioni integre, fessurazione progressiva ed elemento interamente fessurato. Il picco si determina numericamente.

Per `e/t ≥ 1/6`, verificare il risultato contro la funzione universale di Yokel:

- `u1 = t/2 − e`, `u0 = t/2 − Δ`, `k = u0/u1`.
- `Je = 27 b u1³/12`, `Peq = π² E Je/H²`.
- `P/Peq = (4/π²) k [√(1−k) + k ln(√((1−k)/k) + √(1/k))]²`.
- Picco circa a `k = 0.61165`, con `Pcr/Peq = 0.2837`.

La legge cubica del modello a un grado di libertà non va presentata come soluzione della colonna deformabile. Il parametro `Δ` include l’eccentricità iniziale; lo spostamento trasversale aggiuntivo è `Δ − e`.

La resistenza finita è inizialmente prevista nel modello a un grado di libertà. Una sua estensione alla colonna deformabile richiede una definizione separata del calcolo numerico.

### 4. Pareti a più paramenti

Confrontare due casi limite con stesso materiale, altezza e spessore totale: parete monolitica e paramenti indipendenti. Per `n` paramenti uguali senza connessione trasversale, la somma dei carichi euleriani è `1/n²` del carico della parete monolitica, assumendo compressione centrata e condizioni di vincolo uguali.

Non introdurre un’interpolazione arbitraria fra i due casi come modello delle connessioni reali. Un nucleo incoerente non deve essere automaticamente considerato resistente.

## Contenuti didattici

- Nucleo centrale e assenza di resistenza a trazione.
- Effetti del secondo ordine e perdita di rigidezza dovuta alla fessurazione.
- Differenza fra schiacciamento e perdita di equilibrio.
- Significato delle normalizzazioni e delle condizioni di vincolo.
- Esperimenti fotoelastici: contesto del capitolo, da integrare con le figure originali se incluso nello scope scelto.
- Connessione trasversale dei paramenti e spessore strutturalmente efficace.

## Verifiche dell’implementazione

- Continuità delle curve a `δ = 1/6` e comportamento ai limiti.
- Picco analitico del modello a un grado di libertà.
- Transizioni fra i regimi di schiacciamento e instabilità.
- Concordanza Sahlin–Yokel nel dominio interamente fessurato.
- Indipendenza dei rapporti normalizzati dalla profondità `b` e corrette unità dei risultati dimensionali.
- Fattore `1/n²` nel confronto euleriano dei paramenti uguali.

## Scelte confermate

- Interfaccia in inglese.
- Percorso didattico guidato.
- Tutti e quattro i modelli.
- Funzionamento locale e pubblicazione su GitHub; nessun deploy su Sites.

# Produktdokumentasjon: Menighetsplan & Nettside-CMS

Denne produktdokumentasjonen gir en samlet innføring i hvordan Menighetsplan (kildesystemet) og CMS-løsningen samspiller, samt hvordan AI-assistenter (Claude, GPT, Gemini) og utviklere skal programmere og vedlikeholde integrasjonen.

---

## 1. Formål og Arkitektur

Menighetsplan 2.0 leverer en komplett løsning bestående av to hovedpilarer:

1. **Intern planlegger (Menighetsplan):**
   * Brukes av stab, prester, frivillighetskoordinatorer og gruppeledere.
   * Planlegger gudstjenester, programinnslag, frivillige oppgaver, grupper og husfellesskap.
   * Inneholder sensitiv informasjon (personlister, telefonnumre, tilgjengelighet, interne beskjeder).
   * **Single Source of Truth** for alle samlingsdatoer, lokasjoner og avlysninger.

2. **Offentlig nettside (ClaudeCMS / Public Portal):**
   * Vindu utad for kirkegjengere, søkende og lokalsamfunnet.
   * Viser neste gudstjeneste, ukens program, månedlig kalender og faste sider (Om oss, Dåp, Barn og unge, Kontakt).
   * Har eget lettvekts-adminpanel for å overstyre forsiden (fremheve/skjule enkeltsamlinger) og redigere faste sider.

```
┌─────────────────────────────────┐        REST API (JSON)       ┌─────────────────────────────────┐
│      Menighetsplan 2.0          ├─────────────────────────────►│        ClaudeCMS Nettside       │
│  (Intern planlegger & database) │    GET /api/public/all       │  (Offentlig forside & faste s.) │
├─────────────────────────────────┤                              ├─────────────────────────────────┤
│ • Gudstjenester & samlinger     │                              │ • Forside: Neste gudstjeneste   │
│ • Husfellesskap & møteplaner    │                              │ • Faste aktiviteter & fellesskap│
│ • Oppgaver & frivillige (lukket)│                              │ • Faste sider: Om oss, Dåp m.m. │
│ • Sanntids synkronisering       │                              │ • Overstyringer: Fremhev/Skjul  │
└─────────────────────────────────┘                              └─────────────────────────────────┘
```

---

## 2. API-Oversikt for Utviklere og AI

Appen tilbyr ferdige, offentlige JSON-endepunkter med åpen CORS:

| Endepunkt | Beskrivelse | Format |
| :--- | :--- | :--- |
| `GET /api/public/gatherings` | Offentlige gudstjenester og arrangementer | JSON (v1.1) |
| `GET /api/public/groups` | Offentlige grupper og husfellesskap | JSON (v1.1) |
| `GET /api/public/recurring` | Gjentagende faste møter og aktiviteter | JSON (v1.1) |
| `GET /api/public/all` | Alt samlet i én forespørsel | JSON (v1.1) |

### Tilgjengelige miljø-URL-er:
* **Produksjon / Preview:** `https://ais-pre-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app`
* **Utviklingsmiljø:** `https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app`
* **Lokal kjøring:** `http://localhost:3000`

---

## 3. Klar Prompt-mal du kan gi direkte til Claude eller en annen AI

Når du jobber i et eksternt repo (som `https://github.com/magnato-tech/menighetsplan_ClaudeCMS`), kopier og lim inn denne instruksen til AI-en:

```markdown
Hei! Vi skal koble dette CMS-et til det offisielle Menighetsplan REST API-et.

Her er spesifikasjonen du skal følge:
1. Endepunkt for data:
   Bruk miljøvariabelen MENIGHETSPLAN_API_URL, med standardverdi:
   "https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/public/all"
2. Bruk Node.js innebygd `fetch()` i `lib/kilder/menighetsplan.js` uten nye npm-avhengigheter.
3. Bevar fallback til `data/menighetsplan-mock.json` ved nettverksfeil eller under automatiserte tester, slik at alle enhetstester forblir 100% grønne.
4. Mapp responsen til CMS-ets datamodell:
   - arrangementer: uid, tittel, start, slutt, sted, kategorier, erGudstjeneste, erAvlyst
   - grupper: id, navn, kategori, moteplan
   - gjentagende_eventer: id, tittel, ukedag, klokkeslett, frekvens, sted, beskrivelse
5. PO-avklaring: Fremhevede arrangementer skal overstyre ?visning=-filteret og alltid forbli synlige i den fremhevede seksjonen på forsiden.
```

---

## 4. Innebygd CMS-funksjonalitet i Menighetsplan-appen

I tillegg til API-et, har Menighetsplan nå **egen innebygd CMS-støtte** direkte i webapplikasjonen:

1. **Offentlig nettsidevisning:**
   * Tilgjengelig på ruten `/nettside` og `/nettside/:slug`.
   * Viser forside med neste gudstjeneste, ukesoversikt, faste aktiviteter, og månedlig program.
   * Har faste undersider for `om-oss`, `barn-og-unge`, og `kontakt`.

2. **CMS-Administrasjon:**
   * Tilgjengelig på ruten `/admin/cms` (eller via **CMS**-fanen i toppmenyen).
   * **Arrangementer & overstyring:** Klikk «⭐ Fremhev» for å løfte et arrangement opp på forsiden, eller «👁️ Skjul» for å fjerne det fra offentlig visning.
   * **Faste sider:** Opprett nye sider, rediger tekst, overskrifter og punkter, eller tilbakestill til standardmaler.

---

## 5. Feilsøking og Verifikasjon

### Sjekk at API-et svarer:
Kjør i terminalen:
```bash
curl -s https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/public/all | jq .
```
Forventet svar:
* HTTP 200 OK med feltene `arrangementer`, `grupper` og `gjentagende_eventer`.

### Sjekk i nettleseren:
1. Gå til `/admin/settings` i appen.
2. Under seksjonen **«Offentlig Nettside & CMS-integrasjon»**, klikk **«Test API-endepunkt nå»**.
3. Statusen skal umiddelbart bekrefte antall tilgjengelige arrangementer.

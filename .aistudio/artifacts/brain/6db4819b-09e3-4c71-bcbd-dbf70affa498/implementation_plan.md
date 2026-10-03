# Implementeringsplan: 'Database & Testdata' i Admin Studio

Bygge og ferdigstille den nye integrerte modulen **«Database & Testdata»** som en egen fane i Admin Studio. Løsningen gir full fleksibilitet med glidebrytere for datatyper og mengde, forhåndsdefinerte pakker, en standard avkrysset boks for å tømme eksisterende testdata (personer, grupper og planlegger-data, mens CMS-sider og nyheter bevares), og en direkte handling for å fylle 32 realistiske personer med mangfoldige roller og gruppetilhørigheter i Firestore.

---

### Brukervalg og kritiske beslutninger

> [!IMPORTANT]
> **Bekreftede valg fra brukeren:**
> 1. **Plassering i menyen:** Egen fane i Admin Studio kalt **«Database og Testdata»** (`database-admin`), samstemt med det mørke studio-temaet.
> 2. **Styring av testdata:** Både **ferdige pakker** (*Kompakt 8*, *Mellomstor 16*, *Fullskala 32*) og **egne glidebrytere** for nøyaktig valg av antall personer, grupper, samlinger og oppgaver.
> 3. **Tømmingsomfang før populering:** Tømmer utelukkende testpersoner, grupper og planlegger-data (`persons`, `groups`, `gatherings`, `tasks`, `assignments`, `groupMessages`, `gatheringAttendances`). CMS-nettsider, nyheter, prekener og CMS-innstillinger **bevares intakt**.
> 4. **Styring med avkrysningsboks:** Avkrysningsboks merket *«Tøm eksisterende testpersoner og planleggerdata før fylling»*, som er **krysset av som standard**.
> 5. **32-personers fullskala-injeksjon:** En dedikert knapp for øyeblikkelig å tømme og injisere alle 32 testpersoner med roller (hovedpastor, ungdomspastor, familiepastor, menighetsråd, diakoni, lovsang, teknikk, vertskap og husfellesskap).

---

### 1. Oversikt og kjernefunksjonalitet

- **Hva modulen leverer:**
  - En komplett erstatter for den gamle, separate mobil-innstillingssiden, direkte integrert som en førsteklasses fane i Admin Studio.
  - **Sanntidsoversikt:** Live dokumenttellere som viser nøyaktig antall personer, grupper, samlinger, oppgaver, tildelinger og CMS-dokumenter i Firestore.
  - **Datatype- og mengdevelger:**
    - Glidebrytere for personer (4–32), grupper (2–10), samlinger (2–19) og oppgaver (2–21).
    - Direkte hurtigpakker som automatisk setter synkroniserte verdier.
  - **Trygg tømming & injeksjon:**
    - Standard avkryssing for selektiv tømming: Fjerner gamle testmedlemmer før nye skrives, slik at listen aldri blir uryddig eller fylt med duplikater.
    - Beskytter CMS-innhold (statisk opprettede menighetssider, nyhetsartikler og talearkiv forblir uberørt).
  - **Fullskala 32-personers hurtigpopulering:**
    - Ett klikk for å tømme og injisere alle 32 personer med korrekte roller, stillinger, telefonnumre, e-poster, avatars og tilhørighet i menighetsråd, stab og husfellesskap.
  - **Tilleggsstyring:**
    - Aktivering/deaktivering av valgfrie moduler (Kalender og Interne meldinger).
    - Testknapp for det offentlige JSON API-endepunktet (`GET /api/public/gatherings`).
    - Nødsletting (Farefelt) for total nullstilling med 2-trinns bekreftelsesmodal.

---

### 2. Brukeropplevelse og visuelt design

- **Plassering og navigasjon:**
  - Vises i `StudioSidebar` under overskriften **System & Database** som **«Database og Testdata»** med et database-ikon og statusindikator.
  - URL: `/admin?tab=database-admin`.
  - Eldre lenker til `/admin/settings` videresender automatisk til `/admin?tab=database-admin`.

- **Visuell stil og designprinsipper:**
  - Utformet etter mørk studio-stil (`bg-slate-900`, `border-slate-800`, `text-slate-100`).
  - **Fargeaksenter:**
    - Indigo (`bg-indigo-600`, `text-indigo-400`) for generering og populering.
    - Emerald (`text-emerald-400`, `bg-emerald-950/60`) for tilkoblingsstatus og suksessmeldinger.
    - Amber (`text-amber-400`, `bg-amber-950/40`) for selektiv tømming og forhåndsvisningsvarsler.
    - Rose/Rød (`bg-red-600`, `border-red-850`) for ugjenkallelige farefelthandlinger.
  - **Typografi:** Tabulære monospace-tall (`font-mono tabular-nums`) for tellere og glidebryter-verdier for å unngå layout-skjelving under justering.
  - **Tilstander og mikrobevegelser:**
    - Animerte pulserende statussirkler ved aktiv Firestore-tilkobling.
    - Roterende lastespinner (`Loader2`) på knappene mens `writeBatch` kjøres i bakgrunnen.
    - Tydelige tilbakemeldingsbannere via `showFeedback(message, type)`.

- **Arbeidsflyt i modulen:**
  1. Brukeren ser gjeldende dokumentstatus øverst (f.eks. `4 personer, 2 grupper`).
  2. Brukeren velger enten en ferdig pakke (f.eks. *Fullskala 32 personer*) eller drar i glidebryterne.
  3. Brukeren verifiserer at avkrysningsboksen *«Tøm eksisterende testpersoner og planleggerdata før fylling»* er huket av (standard).
  4. Brukeren trykker **«Populer databasen (32 personer, 10 grupper)»**.
  5. Systemet sletter selektivt gamle testpersoner og grupper, og skriver de 32 personene i batch til Firestore.
  6. Sanntidstellerne hopper umiddelbart til `32 personer, 10 grupper`, og sidene `/admin?tab=planlegger-personer` og `/admin?tab=cms-stab` viser de nye personene i full bredde.

---

### 3. Tekniske arkitektur- og produktbeslutninger

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Studio (/admin)                          │
├─────────────────────┬──────────────────────────────────────────────────┤
│ StudioSidebar       │ DatabaseTab                                      │
│                     │ ┌──────────────────────────────────────────────┐ │
│ ├── Sider & Innhold │ │ Live Firestore-tellere: Personer, Grupper... │ │
│ ├── Nyheter & Taler │ └──────────────────────────────────────────────┘ │
│ ├── Lederskap & Stab│ ┌──────────────────────────────────────────────┐ │
│ ├── Planlegger      │ │ Pakkevelger: [Kompakt 8] [Medium 16] [Full]  │ │
│ └── Database & Data │ ├──────────────────────────────────────────────┤ │
│     (Aktiv fane)    │ │ Glidebrytere: Personer | Grupper | Oppgaver  │ │
│                     │ ├──────────────────────────────────────────────┤ │
│                     │ │ [x] Tøm eksisterende testdata før fylling    │ │
│                     │ │     (bevarer CMS-sider og nyheter)           │ │
│                     │ ├──────────────────────────────────────────────┤ │
│                     │ │ [ Populer databasen med valgt oppsett ]      │ │
│                     │ └──────────────────────────────────────────────┘ │
└─────────────────────┴──────────────────────────────────────────────────┘
                                │
                                ▼
         ┌─────────────────────────────────────────────┐
         │ databaseAdmin.ts                            │
         │ - clearPlannerTestData() (kun testdata)     │
         │ - populateCustomMockData({ clearFirst: ...})│
         │ - deleteAllData() (komplett tilbakestilling)│
         └─────────────────────────────────────────────┘
                                │ (Firestore WriteBatch)
                                ▼
         ┌─────────────────────────────────────────────┐
         │ Firebase Firestore DB                       │
         │ (ai-studio-menighetsplan20-ea550243-...)    │
         └─────────────────────────────────────────────┘
```

- **Hovedbeslutning 1: Selektiv tømming (`clearPlannerTestData`) vs full sletting (`deleteAllData`)**
  - Vi innfører `clearPlannerTestData()` i `src/services/databaseAdmin.ts`.
  - Denne funksjonen tømmer kun:
    - `persons`
    - `groups`
    - `gatherings`
    - `tasks`
    - `assignments`
    - `groupMessages`
    - `gatheringAttendances`
  - Samlingene `pages`, `news`, `sermons`, `staff` og `cms-settings` **røres ikke**, i tråd med brukerens eksplisitte ønske.

- **Hovedbeslutning 2: Integrert avkrysningsboks i `DatabaseTab.tsx`**
  - En state `clearBeforePopulate` settes til `true` som standard.
  - Når `handlePopulate` kjøres:
    - Hvis `clearBeforePopulate === true`: kjører først `clearPlannerTestData()`.
    - Deretter kjøres `populateCustomMockData({ personCount, groupCount, gatheringCount, taskCount })`.
    - Hvis ikke avkrysset: oppdaterer og overskriver eksisterende ID-er uten å slette andre oppføringer.

- **Hovedbeslutning 3: Navnejustering og menysynkronisering**
  - Menyelementet i `StudioSidebar.tsx` og tittelen i `DatabaseTab.tsx` navngis **«Database og Testdata»** nøyaktig slik brukeren spesifiserte.
  - Gamle ruter `/admin/settings` i `App.tsx` navigerer automatisk til `AdminStudio` med aktiv fane `database-admin`.

---

### 4. Verifisering og teststrategi

1. **Automatisert testing med Vitest:**
   - Kjøre `tests/database-admin.test.ts` for å verifisere at `clearPlannerTestData` og `populateCustomMockData` overholder relasjonell integritet.
   - Kjøre `tests/public-profile.test.ts` og `src/tests/staff-leadership-firebase.test.tsx` for å sikre at GDPR-filtrering og stabsattributter forblir 100 % grønne.
2. **Typekontroll og linter:**
   - Kjøre `lint_applet` for å garantere null ubrukte variabler eller typefeil.
3. **Produksjonsbygging:**
   - Kjøre `compile_applet` for å validere at hele Vite-applikasjonen bygges rent uten advarsler.

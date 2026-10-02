# Arkitektur – Menighetsplan med innebygd CMS (Lillesand Misjonskirke)
*Sist oppdatert: 2026-10-02 – beskriver koden slik den faktisk er i dette repoet.*

## Kort fortalt
Menighetsplan er én webapp som samler den offentlige nettsiden, frivilligportalen og administrasjonen. Alt leser og skriver til samme Firestore-database. En liten Express-server leverer appen og et offentlig JSON-API for eksterne nettsider.

```
 Besøkende ───────▶ Offentlig nettside ─┐
 Frivillige/ledere ▶ Min side ──────────┼─▶ Firestore (europe-west3)
 Admin ───────────▶ Admin Studio ───────┘        ▲
                                                 │ leses av
 Eksterne nettsider ◀── JSON ── Express-server (`server.ts`)
```

## Teknologi
| Område | Valg |
|---|---|
| Klient | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 |
| Data | Cloud Firestore via Firebase klient-SDK, sanntidslyttere |
| Server | Express (`server.ts`), kjøres med `tsx` |
| Hosting | Google AI Studio / Cloud Run, port 3000 |
| PWA | `public/sw.js` og `public/manifest.webmanifest` |

## De tre flatene
`src/App.tsx` velger layout ut fra adressen:

| Flate | Ruter | Hovedfiler |
|---|---|---|
| Offentlig nettside | `/`, `/hva-skjer`, `/taler`, `/fellesskap`, `/lederskap`, `/om-oss`, `/kontakt`, `/side/:slug`, `/artikkel/:id` | `src/pages/public/` |
| Min side | `/minside`, `/leder`, `/oppgave/:id`, `/gruppe/:id`, `/samling/:id`, `/husfellesskap`, og detaljsidene under `/admin/…` | `src/pages/` |
| Admin Studio | `/admin` (faner via `?tab=`) | `src/pages/admin/` |

Hvilke adresser som er interne, står i `MIN_SIDE_SECTIONS` i `src/App.tsx`. Sammenligningen gjelder hele ledd i adressen, slik at `/leder` ikke fanger den offentlige siden `/lederskap`.

Admin Studio er delt slik: `AdminStudio.tsx` er et skall som eier fanevalg og tilbakemeldinger, `StudioSidebar.tsx` er menyen, og hver fane ligger i `tabs/` med sin egen tilstand og sine egne dialoger. En fane monteres første gang den åpnes og skjules deretter bare, slik at et utkast overlever et fanebytte.

De andre store sidene følger samme mønster. Siden kaller sin hook én gang, eier hva som vises, og sender resultatet ned til deler som har sin egen tilstand:

| Side | Deler |
|---|---|
| `MyPage.tsx` | `src/pages/myPage/`: `useMyPage.ts` og én fil per seksjon |
| `LeaderGroupDetailPage.tsx` | `src/pages/leaderGroup/`: rediger-skjema, møteplan, aktiviteter, medlemmer |
| `GatheringDetailView.tsx` | `src/components/gathering/`: de fem dialogene |
| `HusfellesskapView.tsx` | `src/components/husfellesskap/`: to faner og to dialoger |

## Datalag
- **`src/services/firestore.ts`** inneholder alle lese- og skrivekall mot Firestore, uten React: én lytter per samling (`subscribeCollection`), tre generelle skrivinger (`createDocument`, `updateDocument`, `deleteDocument`) og de få som gjelder flere felt eller dokumenter.
- **`FirebaseDataProvider`** (`src/context/FirebaseDataContext.tsx`) holder det lytterne leverer, og tilbyr oppslag og handlinger. Komponenter henter den med `useFirebase()`.
  - Alltid: `persons`, `groups`, `gatherings`.
  - Bare på interne ruter: `tasks`, `assignments`, `groupMessages`, `gatheringAttendances`. En besøkende på den offentlige nettsiden får aldri disse.
- **`CmsProvider`** (`src/context/CmsContext.tsx`) lytter på `cms_pages`, `cms_news`, `cms_sermons`, `cms_staff` og `cms_settings`. Det siste som ble mottatt mellomlagres i `localStorage`, slik at nettsiden har innhold å vise før Firestore har svart, og beholder det når den åpnes uten nett. En lagring i CMS-et venter på svar fra serveren (i motsetning til planleggingsdataene), slik at redigeringsskjemaet kan bli stående åpent med teksten hvis lagringen feiler.
- **Hooks per rolle** (`src/hooks/`: `memberHooks`, `leaderHooks`, `adminHooks`, `useHusfellesskap`) setter sammen rådataene til det hver side trenger.
- **Rene funksjoner** (`src/utils/`) holder reglene, og testene i `tests/` (Vitest) kjører mot dem: `staffing`, `visibility`, `publicProfile`, `firestoreData` og `menu`. `dates` har ingen tester ennå.
- **Sidetreet** (`src/utils/menu.ts`) er felles for den offentlige menyen og sidelisten i admin. Når en hovedfane slettes, flyttes underfanene opp til toppnivå i samme skriving.

### Skriving
1. Et nytt dokument bygges én gang i `src/data/newDocuments.ts`, med ID fra `newId()`.
2. Handlingen sender skrivingen til Firestore og er ferdig. Firestore-klienten legger endringen inn lokalt med én gang, og lytterne viser den uten å vente på serveren. Ingen handling endrer listene i minnet selv, så det som vises er alltid det klienten faktisk har.
3. En oppdatering går gjennom `forUpdate`: et felt som er satt til `undefined` slettes i databasen, slik at et tømt skjemafelt faktisk blir tomt.
4. Lister og kart inne i et dokument (medlemmer, innmeldingsdato, varslingsvalg) endres uten å lese dokumentet først, med `arrayUnion`, `arrayRemove` og feltsti. To endringer som gjøres samtidig kan dermed ikke overskrive hverandre.
5. Det som hører sammen skrives i én batch: en tildeling og oppgavens status, et forfall og oppgavens status, en slettet side og undersidene dens.
6. Feiler skrivingen, meldes det via `src/services/writeErrors.ts` og vises i `WriteErrorBanner`. Lytterne setter da tilbake det som faktisk er lagret.

### Testing av datalaget
`tests/data-provider.test.tsx` og `tests/cms-provider.test.tsx` kjører `FirebaseDataProvider` og `CmsProvider` mot den ekte Firestore-klienten, koblet fra nettet (`tests/support/offlineFirestore.ts`). Testene ser dermed det samme som appen: en skriving når listene gjennom lytterne. Ingenting sendes til en server.

## Offentlig API
`server.ts` leser `gatherings` og `groups` og sender dem gjennom rene funksjoner i `server/publicApi.ts`. Bare hvitelistede felt slipper ut. Medlemslister og kontaktinformasjon eksponeres ikke.

| Endepunkt | Innhold |
|---|---|
| `GET /api/offentlig/arrangementer` | Kontrakt v1, tider med norsk offset (`+01:00` / `+02:00`) |
| `GET /api/public/gatherings`, `/groups`, `/recurring`, `/all` | Utvidet v1.1-format |

Kontrakten for eksterne lesere står i **[INTEGRASJON-MENIGHETSPLAN.md](INTEGRASJON-MENIGHETSPLAN.md)**.

## Hva som er offentlig
To regler avgjør hva en besøkende ser, og hver av dem ligger ett sted:

- **Samlinger:** feltet `visibility` (`intern`, `offentlig`, `fremhevet`) er eneste bryter. Både de offentlige sidene og API-et leser det gjennom `isPubliclyVisible` i `src/utils/visibility.ts`, og alt som skriver bruker `visibilityFields`. `isPublic` lagres bare som et speil for eldre dokumenter.
- **Personer:** en person vises bare når `isPublicProfile` er satt og et samtykke er registrert (`consentToPublishGivenAt`, `consentGivenBy`). `src/utils/publicProfile.ts` gir da navn, tittel utad og kontaktinfo utad. Privat telefon og e-post er aldri med. Samtykket registreres på personkortet i admin, og fjernes når krysset tas bort.

## Kjente avvik fra målbildet
`PRODUKTDOKUMENTASJON.md` beskriver hvor løsningen skal. Koden er ikke der ennå på disse punktene:

| Område | Mål | I dag |
|---|---|---|
| Innlogging | Brukere logger inn; roller styrer tilgang | Ingen innlogging. Aktiv bruker velges i en testbryter, og `/admin` er åpen |
| Sikkerhetsregler | Bare admin endrer offentlige profilfelt; medlemmer endrer bare sitt eget | Reglene tillater lesing av alt og skriving uten innlogging |
| Personvern på nettsiden | Besøkende får bare offentlige data | Sidene viser bare personer med samtykke, og laster ikke oppgaver, tildelinger, meldinger eller oppmøte. Hele personregisteret lastes likevel til nettleseren; det kan først stenges med innlogging og strammere regler |
| Fremhevet samling | Løftes frem som neste samling på forsiden | `fremhevet` lagres, men forsiden velger neste samling bare etter dato |
| Grupper | Bare offentlige grupper vises utad | `isPublic` på grupper kan ikke settes noe sted, og verken `/fellesskap` eller API-et filtrerer på det |
| Min side | Viser det som er kommende | «Trenger din oppmerksomhet» regner fra en fast dato i demodataene (2. september 2026) i stedet for dagens dato |
| Filstørrelse | Én komponent per fane/modal | Gjort for alle sidene over 1 000 linjer. Størst nå: `GatheringDetailView.tsx` (ca. 1 000 linjer, selve kjøreplanen) |
| Gruppemeldinger | Testverktøyet på husfellesskapssiden sier at et nytt medlem ikke skal se eldre meldinger | Innmeldingsdato lagres (`memberJoinedAt`), men brukes ikke: et medlem ser alle meldingene i gruppen |
| Modulbrytere | Kalender og meldinger slås av og på for hele menigheten | Valget lagres bare i nettleseren til den som endrer det |

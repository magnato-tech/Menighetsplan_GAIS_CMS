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
| Min side | `/minside`, `/leder`, `/oppgave/:id`, `/samling/:id`, `/husfellesskap`, og detaljsidene under `/admin/…` | `src/pages/` |
| Admin Studio | `/admin` (faner via `?tab=`) | `src/pages/admin/AdminStudio.tsx` |

## Datalag
- **`FirebaseDataProvider`** (`src/firebase-service.ts`) lytter på `persons`, `groups`, `gatherings`, `tasks`, `assignments`, `groupMessages` og `gatheringAttendances`, og tilbyr handlingene som endrer dem. Komponenter henter den med `useFirebase()`.
- **`CmsProvider`** (`src/context/CmsContext.tsx`) lytter på `cms_pages`, `cms_news`, `cms_sermons`, `cms_staff`, `cms_settings` og `cms_overrides`. Siste øyeblikksbilde mellomlagres i `localStorage`, slik at nettsiden aldri starter blank.
- **Hooks per side** (`src/hooks/useAppHooks.ts`) setter sammen rådataene til det hver side trenger, blant annet bemanningsstatus.

### Skriving
1. Et nytt dokument bygges én gang i `src/data/newDocuments.ts`, med ID fra `newId()`.
2. Det samme objektet legges i lokal tilstand og sendes til Firestore.
3. Feiler skrivingen, meldes det via `src/services/writeErrors.ts` og vises i `WriteErrorBanner`. Sanntidslytteren henter deretter tilbake det som faktisk er lagret.

## Offentlig API
`server.ts` leser `gatherings` og `groups` og sender dem gjennom rene funksjoner i `server/publicApi.ts`. Bare hvitelistede felt slipper ut. Medlemslister og kontaktinformasjon eksponeres ikke.

| Endepunkt | Innhold |
|---|---|
| `GET /api/offentlig/arrangementer` | Kontrakt v1, tider med norsk offset (`+01:00` / `+02:00`) |
| `GET /api/public/gatherings`, `/groups`, `/recurring`, `/all` | Utvidet v1.1-format |

Kontrakten for eksterne lesere står i **[INTEGRASJON-MENIGHETSPLAN.md](INTEGRASJON-MENIGHETSPLAN.md)**.

## Synlighet
Feltet `visibility` på en samling (`intern`, `offentlig`, `fremhevet`) er fasit. `isPublic` skrives som et speil av dette for eldre lesere.

## Kjente avvik fra målbildet
`PRODUKTDOKUMENTASJON.md` beskriver hvor løsningen skal. Koden er ikke der ennå på disse punktene:

| Område | Mål | I dag |
|---|---|---|
| Innlogging | Brukere logger inn; roller styrer tilgang | Ingen innlogging. Aktiv bruker velges i en testbryter, og `/admin` er åpen |
| Sikkerhetsregler | Bare admin endrer offentlige profilfelt; medlemmer endrer bare sitt eget | Reglene tillater lesing av alt og skriving uten innlogging |
| Personvern på nettsiden | Besøkende får bare offentlige data | Hele appen ligger inne i `FirebaseDataProvider`, så også de offentlige sidene abonnerer på persondata og meldinger |
| Synlighet | Én bryter (`visibility`) | `cms_overrides` (fremhevet/skjult) finnes fortsatt ved siden av, og de offentlige sidene filtrerer på `isPublic` og `overrides` |
| Filstørrelse | Én komponent per fane/modal | `AdminStudio.tsx` (ca. 3 200 linjer), `useAppHooks.ts` (ca. 2 000), `GatheringDetailView.tsx` (ca. 1 650) |

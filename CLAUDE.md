# Prosjektdokument: Menighetsplan med innebygd CMS (Lillesand Misjonskirke)
*Sist oppdatert: 2026-10-02*

> **Ny økt? Start her.** Produktkravene står i `PRODUKTDOKUMENTASJON.md`, og oppbygningen i `ARKITEKTUR.md`.

---

## 1. Hva dette repoet er
Én React-app med tre flater som deler samme Firestore-database:

1. **Offentlig nettside** for Lillesand Misjonskirke (`/`, `/hva-skjer`, `/taler`, `/fellesskap`, `/om-oss` …).
2. **Min side** for frivillige og gruppeledere (`/minside`, `/leder`, `/husfellesskap`, `/oppgave/:id` …).
3. **Admin Studio** for planlegging og CMS-innhold (`/admin`).

I tillegg serverer `server.ts` et offentlig JSON-API (`/api/offentlig/arrangementer` og `/api/public/*`) som eksterne nettsider kan lese. Kontrakten står i `INTEGRASJON-MENIGHETSPLAN.md`.

Appen utvikles og kjøres i Google AI Studio (Cloud Run). Det finnes også et eget, eksternt CMS-repo (`magnato-tech/menighetsplan_ClaudeCMS`) som leser API-et. Koden der hører ikke hjemme her.

---

## 2. Kommandoer
| Kommando | Gjør |
|---|---|
| `npm run dev` | Starter Express + Vite på port 3000 |
| `npm run build` | Bygger klienten til `dist/` |
| `npm run lint` | Typesjekk (`tsc --noEmit`) |
| `npm test` | Kjører testskriptene i `tests/` |

Kjør `npm run lint` og `npm test` før en endring regnes som ferdig.

---

## 3. Hvor ting ligger
| Sti | Innhold |
|---|---|
| `server.ts`, `server/publicApi.ts` | Express-server og de rene funksjonene bak det offentlige API-et |
| `src/App.tsx` | Ruter og de tre layoutene |
| `src/firebase.ts` | Oppstart av Firebase |
| `src/services/firestore.ts` | Lesing og skriving mot Firestore, uten React |
| `src/context/FirebaseDataContext.tsx` | `FirebaseDataProvider` / `useFirebase`: planleggingsdata og handlingene som endrer dem |
| `src/context/CmsContext.tsx` | CMS-innhold: sider, nyheter, taler, stab, innstillinger |
| `src/data/collections.ts` | Navn på alle Firestore-samlinger |
| `src/data/newDocuments.ts` | Bygger nye personer, grupper, samlinger, oppgaver, tildelinger og meldinger |
| `src/hooks/` | Hooks per rolle: `memberHooks`, `leaderHooks`, `adminHooks`, `useHusfellesskap`. `useAppHooks.ts` eksporterer alle |
| `src/utils/` | Rene funksjoner med tester: `dates`, `staffing` (bemanning), `visibility` (hva som er offentlig), `publicProfile` (samtykke), `firestoreData` (klargjøring før skriving) |
| `src/services/writeErrors.ts` | Melder mislykkede skrivinger til `WriteErrorBanner` |
| `src/services/databaseAdmin.ts` | Fyll databasen med demodata / slett alt |
| `src/pages/admin/` | Admin Studio: `AdminStudio.tsx` er skallet, `StudioSidebar.tsx` menyen, og `tabs/` har én fil per fane |
| `src/pages/myPage/` | Min side: `useMyPage.ts` regner ut alt som vises, resten er én fil per seksjon |
| `src/pages/leaderGroup/` | Delene av gruppesiden (`LeaderGroupDetailPage.tsx`) |
| `src/components/gathering/` | Dialogene i samlingsvisningen (`GatheringDetailView.tsx`) |
| `src/components/husfellesskap/` | Fanene og dialogene i husfellesskapsvisningen (`HusfellesskapView.tsx`) |
| `src/pages/`, `src/components/` | Øvrige sider og komponenter |
| `tests/` | Testskript som kjøres med `tsx` |
| `firestore.rules` | Sikkerhetsregler |

---

## 4. Regler for kodeendringer
- **Nye dokumenter bygges ett sted.** Bruk funksjonene i `src/data/newDocuments.ts`. ID-er lages med `newId()` fra `src/utils/id.ts`, aldri med `Date.now()` alene.
- **Ingen stille feil.** En skriving som feiler skal meldes med `reportWriteError` (eller `persist` i `FirebaseDataContext.tsx`, `attempt` i `CmsContext.tsx`). Skriv aldri en tom `catch`.
- **`undefined` før skriving.** Firestore avviser `undefined`. Et nytt dokument går gjennom `sanitizeForFirestore`, som fjerner slike felt. En oppdatering går gjennom `forUpdate`, som sletter feltet i databasen. Bruker du `sanitizeForFirestore` på en oppdatering, blir et tømt felt stående med gammel verdi.
- **Nye samlinger** legges inn i `src/data/collections.ts` og får en regel i `firestore.rules`. En test feiler hvis regelen mangler.
- **`visibility` er eneste bryter** for om en samling er offentlig. Les med `isPubliclyVisible` og skriv med `visibilityFields` fra `src/utils/visibility.ts`. `isPublic` lagres bare som et speil.
- **Ingen person vises offentlig uten registrert samtykke.** Offentlige sider henter personer gjennom `toPublicProfile` / `publicProfilesOf` i `src/utils/publicProfile.ts`, som bare gir navn og kontaktinfo utad. Bruk aldri `person.phone` eller `person.email` på en offentlig side.
- **Persondata skal ikke ut i det offentlige API-et.** Nye felt i `server/publicApi.ts` må hvitelistes bevisst.
- **Én fane eller dialog per fil.** En ny fane eller dialog får sin egen fil med egen tilstand. Siden over eier bare hva som vises, og kaller sidens hook én gang og sender resultatet ned.
- **Interne ruter** må stå i `MIN_SIDE_SECTIONS` i `src/App.tsx`. Det styrer både layouten og om planleggingsdata lastes. Lenker til Min side skal gå til `/minside`; `/` er den offentlige forsiden.

---

## 5. Kjente mangler
Disse er ikke løst ennå. Se `ARKITEKTUR.md` for detaljer.

- Det finnes ingen innlogging. Aktiv bruker velges i en testbryter.
- `firestore.rules` slipper gjennom lesing og skriving uten innlogging.
- De offentlige sidene laster hele personregisteret til nettleseren, selv om de bare viser personer med samtykke.
- `fremhevet` lagres, men forsiden bruker det ikke: neste samling velges bare etter dato.
- Min side avgjør hva som er «kommende» mot en fast dato fra demodataene (2. september 2026), ikke dagens dato.
- Grupper har feltet `isPublic`, men det kan ikke settes noe sted, og verken gruppesiden eller API-et filtrerer på det.

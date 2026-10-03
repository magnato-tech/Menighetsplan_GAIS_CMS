# Prosjektdokument: Menighetsplan med innebygd CMS (Lillesand Misjonskirke)
*Sist oppdatert: 2026-10-03*

> **Ny økt? Start her.** Produktet, hva som er levert og planen videre står i `PRODUKTDOKUMENTASJON.md`. Oppbygningen står i `ARKITEKTUR.md`.

---

## 1. Hva dette repoet er
Ett adminpanel som styrer en webapp og en nettside i samme format. Det er én React-app med tre flater som deler samme Firestore-database:

1. **Adminpanelet (Admin Studio)** på `/admin`: planlegging (samlinger, oppgaver, grupper, personer) og CMS (sider, nyheter, taler, stab, design, innstillinger).
2. **Webappen (Min side)** for frivillige og gruppeledere (`/minside`, `/leder`, `/husfellesskap`, `/oppgave/:id` …).
3. **Nettsiden** for Lillesand Misjonskirke (`/`, `/hva-skjer`, `/taler`, `/fellesskap`, `/om-oss` …).

I tillegg serverer `server.ts` et offentlig JSON-API (`/api/offentlig/arrangementer` og `/api/public/*`) som eksterne nettsider kan lese. Kontrakten står i `INTEGRASJON-MENIGHETSPLAN.md`.

Appen utvikles og kjøres i Google AI Studio (Cloud Run). Det finnes også et eget, eksternt CMS-repo (`magnato-tech/menighetsplan_ClaudeCMS`) som leser API-et. Koden der hører ikke hjemme her.

---

## 2. Kommandoer
| Kommando | Gjør |
|---|---|
| `npm run dev` | Starter Express + Vite på port 3000 |
| `npm run build` | Bygger klienten til `dist/` |
| `npm run lint` | Typesjekk (`tsc --noEmit`) |
| `npm test` | Kjører testene i `tests/` med Vitest (`npx vitest` følger med mens du jobber) |

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
| `src/utils/` | Rene funksjoner: `staffing` (bemanning), `visibility` (hva som er offentlig), `publicProfile` (samtykke), `firestoreData` (klargjøring før skriving), `menu` (sidetreet og menyen), `gatherings` (kommende samlinger og forsidens utvalg), `groups` (hvem som er med i en gruppe), `runSheet` (kjøreplanen), `dates`. For CMS-et: `themeUtils` (design), `seoUtils` (søk og deling), `imageUpload` (bilder) |
| `src/components/cms/CmsContentRenderer.tsx` | Tolker innholdsblokkene på en CMS-side og tegner dem |
| `src/services/writeErrors.ts` | Melder mislykkede skrivinger til `WriteErrorBanner` |
| `src/services/databaseAdmin.ts` | Fyll databasen med demodata / slett alt |
| `src/pages/admin/` | Admin Studio: `AdminStudio.tsx` er skallet, `StudioSidebar.tsx` menyen, og `tabs/` har én fil per fane |
| `src/pages/myPage/` | Min side: `useMyPage.ts` regner ut alt som vises, resten er én fil per seksjon |
| `src/pages/leaderGroup/` | Delene av gruppesiden (`LeaderGroupDetailPage.tsx`) |
| `src/components/gathering/` | Dialogene i samlingsvisningen (`GatheringDetailView.tsx`) |
| `src/components/husfellesskap/` | Fanene og dialogene i husfellesskapsvisningen (`HusfellesskapView.tsx`) |
| `src/pages/`, `src/components/` | Øvrige sider og komponenter |
| `tests/` | Tester (Vitest). `assert(betingelse, navn)` fra `tests/assert.ts` registrerer én navngitt sjekk. `tests/support/offlineFirestore.ts` gir en ekte Firestore-klient uten nett til tester av datalaget |
| `firestore.rules` | Sikkerhetsregler |

---

## 4. Regler for kodeendringer
- **Nye dokumenter bygges ett sted.** Bruk funksjonene i `src/data/newDocuments.ts`. ID-er lages med `newId()` fra `src/utils/id.ts`, aldri med `Date.now()` alene.
- **Ingen stille feil.** En skriving som feiler skal meldes med `reportWriteError` (eller `save` i `FirebaseDataContext.tsx`, `attempt` i `CmsContext.tsx`). Skriv aldri en tom `catch`.
- **Listene endres bare av lytterne.** En handling i `FirebaseDataContext.tsx` sender skrivingen og lar lytteren vise resultatet. Legg aldri til en `setX((prev) => …)` ved siden av skrivingen; da kan skjermen vise noe som ikke er lagret.
- **Ikke les før du skriver.** Lister og kart i et dokument endres med `arrayUnion`, `arrayRemove` eller feltsti, og det som hører sammen skrives i én `writeBatch`. Se `src/services/firestore.ts`.
- **`undefined` før skriving.** Firestore avviser `undefined`. Et nytt dokument går gjennom `sanitizeForFirestore`, som fjerner slike felt. En oppdatering går gjennom `forUpdate`, som sletter feltet i databasen. Bruker du `sanitizeForFirestore` på en oppdatering, blir et tømt felt stående med gammel verdi.
- **Nye samlinger** legges inn i `src/data/collections.ts` og får en regel i `firestore.rules`. En test feiler hvis regelen mangler.
- **`visibility` er eneste bryter** for om en samling er offentlig. Les med `isPubliclyVisible` og skriv med `visibilityFields` fra `src/utils/visibility.ts`. `isPublic` lagres bare som et speil. Hva som er kommende, hva som er en gudstjeneste og hva forsiden løfter fram, hentes fra `src/utils/gatherings.ts`.
- **En gruppe vises utad bare når `isGroupPublic` sier det.** Det gjelder nettsiden og `server/publicApi.ts`.
- **Ikke dikt opp innhold.** Mangler noe i databasen, vises det som manglende: ingen standardprogram, ingen navn, ingen gruppe-ID-er eller datoer fra demodataene i koden. Kjøreplanen bygges av `buildRunSheet` i `src/utils/runSheet.ts`, og en samling uten sted vises med `locationOf` fra `src/utils/gatherings.ts`.
- **Ikke lag skjema som ikke lagrer.** Et felt en besøkende fyller ut skal enten lagres og kunne leses av noen, eller ikke finnes. Det samme gjelder et valg i admin: det skal virke der det sier at det virker.
- **Ingen utviklerord i skjermbildene.** Feltnavn (`isPublic`, `Group.leaderIds`), ID-er, «mock» og «prototype» hører hjemme i koden. Brukeren ser norske ord for det samme.
- **Meldinger som forsvinner av seg selv** bruker `useTimedMessage` fra `src/hooks/`. Skriv ikke `setTimeout(() => setX(null), …)` ved siden av en `useState`.
- **Ingen person vises offentlig uten registrert samtykke.** Offentlige sider henter personer gjennom `toPublicProfile` / `publicProfilesOf` i `src/utils/publicProfile.ts`, som bare gir navn og kontaktinfo utad. Bruk aldri `person.phone` eller `person.email` på en offentlig side.
- **Persondata skal ikke ut i det offentlige API-et.** Nye felt i `server/publicApi.ts` må hvitelistes bevisst.
- **Én fane eller dialog per fil.** En ny fane eller dialog får sin egen fil med egen tilstand. Siden over eier bare hva som vises, og kaller sidens hook én gang og sender resultatet ned.
- **Oppgavens status følger av tildelingene.** Sett aldri `task.status` for hånd. Alt som endrer hvem som står på en oppgave, eller hvor mange den trenger, går gjennom handlingene i `FirebaseDataContext.tsx`. De lagrer statusen fra `taskStatusFor` i samme skriving. Ledige plasser leses med `countSlots`, ikke fra statusen. Begge ligger i `src/utils/staffing.ts`.
- **Tidspunkt lagres som eksakte øyeblikk.** Bruk `combineDateAndTimeToIso` fra `src/utils/dates.ts` når et skjema har dato og klokkeslett. En streng uten tidssone (`2026-10-18T11:00:00`) leses ulikt i nettleseren og på serveren.
- **Test den ekte koden.** Regler og utregninger legges i `src/utils/` som rene funksjoner og testes derfra. En test skal aldri ha sin egen kopi av logikken.
- **Interne ruter** må stå i `MIN_SIDE_SECTIONS` i `src/App.tsx`. Det styrer både layouten og om planleggingsdata lastes. Lenker til Min side skal gå til `/minside`; `/` er den offentlige forsiden.

---

## 5. Kjente mangler
Disse er ikke løst ennå. Rekkefølgen de skal løses i står i kapittel 14 i `PRODUKTDOKUMENTASJON.md`, og detaljene i `ARKITEKTUR.md`.

- Designvalget i admin styrer ikke nettsiden: CSS-variablene settes, men ingen stil leser dem.
- Opplastede bilder lagres som tekst inne i sidedokumentene.
- Søk- og delefeltene settes inn i nettleseren, så delingskort i sosiale medier ser dem ikke.
- Forsidens faste tekster og menighetens navn står flere steder i koden.
- Stab vises fra to kilder: personregisteret med samtykke, og `cms_staff` uten.
- Det finnes ingen innlogging. Aktiv bruker velges i en testbryter.
- `firestore.rules` slipper gjennom lesing og skriving uten innlogging.
- De offentlige sidene laster hele personregisteret til nettleseren, selv om de bare viser personer med samtykke.
- En besøkende kan ikke melde interesse for en gruppe i appen; `/fellesskap` viser hvem man kan kontakte.
- Innmeldingsdato i en gruppe lagres, men eldre meldinger skjules ikke for nye medlemmer.
- Modulbryterne (kalender, meldinger) lagres bare i nettleseren til den som endrer dem.

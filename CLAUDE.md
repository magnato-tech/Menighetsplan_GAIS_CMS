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
| `src/firebase-service.ts` | Lesing og skriving mot Firestore, og `FirebaseDataProvider` / `useFirebase` |
| `src/context/CmsContext.tsx` | CMS-innhold: sider, nyheter, taler, stab, innstillinger |
| `src/data/collections.ts` | Navn på alle Firestore-samlinger |
| `src/data/newDocuments.ts` | Bygger nye personer, grupper, samlinger, oppgaver, tildelinger og meldinger |
| `src/hooks/useAppHooks.ts` | Hooks per side, datoformatering og bemanningsberegning |
| `src/services/writeErrors.ts` | Melder mislykkede skrivinger til `WriteErrorBanner` |
| `src/services/databaseAdmin.ts` | Fyll databasen med demodata / slett alt |
| `src/pages/`, `src/components/` | Sider og komponenter |
| `tests/` | Testskript som kjøres med `tsx` |
| `firestore.rules` | Sikkerhetsregler |

---

## 4. Regler for kodeendringer
- **Nye dokumenter bygges ett sted.** Bruk funksjonene i `src/data/newDocuments.ts`. ID-er lages med `newId()` fra `src/utils/id.ts`, aldri med `Date.now()` alene.
- **Ingen stille feil.** En skriving som feiler skal meldes med `reportWriteError` (eller `persist` i `firebase-service.ts`, `attempt` i `CmsContext.tsx`). Skriv aldri en tom `catch`.
- **Fjern `undefined` før skriving.** Firestore avviser `undefined`; bruk `sanitizeForFirestore`.
- **Nye samlinger** legges inn i `src/data/collections.ts` og får en regel i `firestore.rules`. En test feiler hvis regelen mangler.
- **`visibility` er fasit** for om en samling er offentlig. `isPublic` er bare et speil for eldre lesere.
- **Persondata skal ikke ut i det offentlige API-et.** Nye felt i `server/publicApi.ts` må hvitelistes bevisst.

---

## 5. Kjente mangler
Disse er ikke løst ennå. Se `ARKITEKTUR.md` for detaljer.

- Det finnes ingen innlogging. Aktiv bruker velges i en testbryter.
- `firestore.rules` slipper gjennom lesing og skriving uten innlogging.
- De offentlige sidene abonnerer på alle samlinger, også persondata.
- Flere filer er svært store (`AdminStudio.tsx`, `useAppHooks.ts`, `GatheringDetailView.tsx`).

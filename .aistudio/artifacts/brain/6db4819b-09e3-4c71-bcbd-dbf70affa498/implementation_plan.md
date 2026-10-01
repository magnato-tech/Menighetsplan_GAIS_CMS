# Arbeidsflytplan: To Separate Repositories (App & CMS-Nettside)

Denne planen beskriver den operative arbeidsflyten mellom menighetsappen (**Menighetsplan 2.0**) og den offentlige nettsiden (**menighetsplan_ClaudeCMS**), med tydelig ansvarsdeling mellom Google AI Studio, Claude og Product Owner.

---

## 1. System- og Repo-Oversikt

| Egenskap | Repo 1: Menighetsplan 2.0 (Appen) | Repo 2: menighetsplan_ClaudeCMS (Nettsiden) |
| :--- | :--- | :--- |
| **GitHub Repo** | `magnato-tech/Menighetsplan2.0_mobil` | `magnato-tech/menighetsplan_ClaudeCMS` |
| **Hovedfunksjon** | Intern planlegger, gudstjenesteoppsett, frivillige, husfellesskap, grupper | Offentlig nettside for menigheten, kalendervisning, faste sider («Om oss», «Kontakt») |
| **Plattform / Drift** | Google AI Studio / Cloud Run + Firestore | Node.js (Vercel, Render eller Cloud Run) |
| **Fremtidig domene** | `app.lillesandmisjonskirke.no` (eller intern URL) | `lillesandmisjonskirke.no` (erstatter eRedaktør) |
| **Hovedansvarlig AI** | **Google AI Studio (GAIS)** | **Claude (i GitHub/VS Code/Terminal)** |
| **Kildedata (Fasit)** | **Single Source of Truth** for alle datoer, samlinger og grupper | Forbruker (leser kun offentlige felt, skriver aldri) |

---

## 2. Ansvarsfordeling mellom AI-assistentene

### Google AI Studio (denne appen):
1. **Vedlikeholder appen og databasen:** Videreutvikler arrangementsplanlegging, sanger, liturgiavgjørelser, grupper og frivilligkoordinering.
2. **Eier og drifter API-et:**
   * Serverer `GET /api/offentlig/arrangementer?fra=...&til=...` i tråd med `INTEGRASJON-MENIGHETSPLAN.md`.
   * Serverer `GET /api/public/all` (med grupper og faste møteplaner).
   * Sikrer at personopplysninger (telefon, e-post, interne oppgaver) aldri lekker ut.
3. **Oppdaterer kontraktdokumentene:** Produserer oppdaterte versjoner av `INTEGRASJON-MENIGHETSPLAN.md` når nye offentlige felter gjøres tilgjengelige.

### Claude (i `menighetsplan_ClaudeCMS`):
1. **Utvikler nettsidens design og maler:** Bygger responsive sider for forsiden («Neste gudstjeneste», «Denne uken», «Månedsoversikt») og faste undersider («Om oss», «Barn & unge», «Kontakt/Vipps»).
2. **Programmerer adapteren (`lib/kilder/menighetsplan.js`):**
   * Kaller API-et på `https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer`.
   * Beholder lokal mock (`data/menighetsplan-mock.json`) slik at alle 88 automatiske tester kjører grønt offline.
3. **Håndterer lokale overstyringer:** Lar menighetsredaktøren fremheve eller skjule arrangementer på nettsidens forside via `innhold/arrangement-overstyringer.json`.

### Product Owner (Magnar):
1. **Styrer prioriteringer:** Bestiller nye funksjoner enten på app-siden eller nettside-siden.
2. **Kopierer oppdaterte filer ved behov:** Overfører `INTEGRASJON-MENIGHETSPLAN.md` og endringer mellom repoene.
3. **Godkjenner pull requests:** Merger endringer i GitHub.

---

## 3. Trinnvis Arbeidsprosess ved Endringer

Når det skal gjøres endringer som berører begge systemer (f.eks. nytt felt for prest, nytt arrangementstype, eller grupper):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. KONTRAKT FIRST:                                         │
│    Oppdater spesifikasjonen i INTEGRASJON-MENIGHETSPLAN.md  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APP-ENDRING (Google AI Studio):                          │
│    Eksponer det nye feltet i server.ts under /api/offentlig │
│    Verifiser med: curl -s .../api/offentlig/arrangementer   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. NETTSIDE-ENDRING (Claude i CMS-repoet):                  │
│    Gi Claude lenken/kontrakten -> Claude oppdaterer adapter │
│    og presentasjon i nettsidemalen.                         │
│    Verifiser med: npm test (88 tester grønne).              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PRODUKSJON OG VERIFIKASJON:                             │
│    CMS-et viser de nye dataene automatisk på forhåndsvisning│
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Konkrete Kjørekommandoer og Tester

### I Menighetsplan (denne appen):
Test at API-et svarer riktig:
```bash
curl -s "http://localhost:3000/api/offentlig/arrangementer?fra=2026-09-01&til=2027-01-01" | head -n 30
```
Sjekk at ingen private data lekkes:
* Verifiser at `persons`, `tasks`, `gatheringAttendances` og `groupMessages` ikke finnes i JSON-svaret.

### I ClaudeCMS (`menighetsplan_ClaudeCMS`):
1. Sett miljøvariabel:
   ```bash
   export MENIGHETSPLAN_API_URL="https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer"
   ```
2. Kjør testsuiten:
   ```bash
   npm test
   ```
3. Start nettsiden lokalt:
   ```bash
   npm start
   ```
   Åpne `http://localhost:4000` i nettleseren og sjekk at neste gudstjeneste for Lillesand Misjonskirke dukker opp med riktig tid og sted.

---

## 5. Veikart mot Lansering på `lillesandmisjonskirke.no`

1. **Sprint 1 (Pågående):**
   * Verifiser at Claude i CMS-repoet har koblet til det nye server-endepunktet.
   * Fyll inn menighetens faste tekster («Om oss», «Kontakt», «Vipps #12345»).
2. **Sprint 2:**
   * Etabler separat hosting for CMS-et (f.eks. Vercel eller Google Cloud Run).
   * Verifiser caching (15 minutters intervall med lokal fil-fallback).
3. **Sprint 3 (Go-Live):**
   * Pek DNS for `lillesandmisjonskirke.no` til det nye CMS-et.
   * Sett opp 301-videresendinger fra gamle eRedaktør-adresser.
   * Koble ut eRedaktør.

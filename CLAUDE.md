# Prosjektdokument: Menighets-CMS (Lillesand Misjonskirke)
*Sist oppdatert: 2026-09-28 – Ekte datatilkobling er levert av GAIS via server-endepunkt.*

> **Ny økt? Start her:** Les dette dokumentet, så punkt 9–14.

---

## 1. Formål
Et enkelt, vedlikeholdsfritt CMS (offentlig nettside) for **Lillesand Misjonskirke**, der **mesteparten av innholdet genereres automatisk** fra menighetsappen **Menighetsplan 2.0** ([Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil)). CMS-et skal erstatte eRedaktør og ta over `lillesandmisjonskirke.no`.

---

## 2. Kjerneprinsipp
- CMS-et er en **egen modul** (egen kode, hosting og domene) som **kun integrerer med Menighetsplan 2.0**. Ingen iCal eller andre kilder. Kontrakt: `INTEGRASJON-MENIGHETSPLAN.md`.
- **Ekte datatilkobling (LØST 2026-09-28):**
  Integrasjonen skjer via et sikkert server-endepunkt i Menighetsplan 2.0:
  `GET https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer`
  Dette sikrer at:
  1. CMS-et kjører helt uten Firebase-avhengigheter (ren Node.js).
  2. Persondata og interne oppgaver forblir beskyttet i appen.
  3. Datoer leveres ferdig konvertert med norsk tidssone-offset (`+01:00`/`+02:00`).
- **Menighetsplan er fasit** for gudstjenester og arrangementer.
- All kunnskap om appen ligger i én adapterfil: `lib/kilder/menighetsplan.js`.
- CMS-et har sitt eget repo: `magnato-tech/menighetsplan_ClaudeCMS`.

---

## 3. Avklaringer med Product Owner
| Spørsmål | Svar |
|---|---|
| Navn | **Lillesand Misjonskirke** |
| Domene | `lillesandmisjonskirke.no` |
| Fremhevede arrangementer | **Ja, overstyrer filteret.** Fremhevede arrangementer forblir synlige i sin toppseksjon uavhengig av `?visning=`-filteret. |
| Datakilde | Offentlig REST API på serveren i Menighetsplan 2.0 |

---

## 4. Oppgave for neste Sprint i CMS-et
1. I `lib/kilder/menighetsplan.js`: Koble opp mot API-et ved hjelp av `process.env.MENIGHETSPLAN_API_URL || 'https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer'`.
2. Verifiser at alle 88 automatiske tester kjører grønt med lokal fallback.
3. Vis ekte arrangementer på forsiden (`Neste gudstjeneste`, `Denne uken`, og kalenderoversikten).

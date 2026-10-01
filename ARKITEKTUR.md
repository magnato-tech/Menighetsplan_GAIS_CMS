# Arkitektur – Menighets-CMS (Lillesand Misjonskirke)
*Sist oppdatert: 2026-09-28 – Etter at server-endepunktet ble implementert og levert i Menighetsplan 2.0.*

## Kort fortalt
CMS-et er en **egen modul** og blir den nye offentlige nettsiden til **Lillesand Misjonskirke**. På sikt **erstatter** det eRedaktør og tar over `lillesandmisjonskirke.no`. 

Den **eneste integrasjonen** er det offentlige API-et i appen **Menighetsplan 2.0** ([Menighetsplan2.0_mobil](https://github.com/magnato-tech/Menighetsplan2.0_mobil)). Derfra hentes gudstjenester og arrangementer hvert kvarter.

Detaljert kontrakt: **[INTEGRASJON-MENIGHETSPLAN.md](INTEGRASJON-MENIGHETSPLAN.md)**.

```
 Frivillige/admin ──▶ Menighetsplan 2.0 ──(offentlig API, kun lesing)──▶ CMS ──▶ Besøkende
                      (fasit, Firestore)                                 lillesandmisjonskirke.no
```

## Løs kobling
- CMS-et kjenner bare **kontrakten** (JSON v1), ikke Firestore eller appens interne typer.
- All kunnskap om appen ligger i én fil: `lib/kilder/menighetsplan.js`. Endrer appen seg, er det bare den filen som endres.
- CMS-et kaller server-endepunktet:
  `GET https://ais-dev-bpwtuilescw22tmh5zztaw-138177352715.europe-west3.run.app/api/offentlig/arrangementer`
- Ved feil eller under frakoblede tester bruker CMS-et en **lokal mock** (`data/menighetsplan-mock.json`) som følger nøyaktig samme kontrakt.

## Valg
| Område | Valg | Hvorfor |
|---|---|---|
| Plattform | **Node.js**, ingen eksterne pakker | Lite vedlikehold, lynrask oppstart |
| Arrangementsdata | Hentes fra Menighetsplan via server-API | Én fasit, ingen dobbel registrering, ingen datalekasjer |
| Siste kopi | Lagres som fil/minne og brukes hvis API-et er nede | Aldri blank side for kirkebesøkende |
| Innhold som ikke er arrangementer | «Om oss», «Kontakt», «Bli med», «Barn og unge» eies av CMS-et | Hører hjemme på den offentlige nettsiden |
| Hosting | Google Cloud Run / Vercel (appen ligger på AI Studio Cloud Run) | Må kunne ta over `lillesandmisjonskirke.no` |
| Språk | JavaScript / TypeScript | Samme økosystem |

## Datamodell i CMS-et
* `id` / `uid`: Stabil identifikator fra Menighetsplan.
* `type`: `"gudstjeneste"` eller `"arrangement"`.
* `tittel`: Tittel på samlingen.
* `start` / `slutt`: ISO 8601 med norsk tidssone-offset (`Europe/Oslo`, f.eks. `+02:00`).
* `heldag`: boolean (heldagsarrangement).
* `sted`: Lokasjon (standard: "Lillesand Misjonskirke").
* `status`: `"planlagt"` eller `"avlyst"`.
* `tagger`: Kategori-merkelapper.

## Sikkerhet & GDPR
* CMS-et leser **aldri** direkte fra Firestore.
* Server-endepunktet kjøres i appen (Cloud Run) og fungerer som en sikker brannmur:
  * `persons`, `tasks`, `assignments`, `groupMessages` og interne notater forlater aldri appen.
  * Gruppesamlinger for husfellesskap filtreres automatisk bort med mindre de er merket offentlige.

## Status og Avklaringer
| Punkt | Status | Løsning |
|---|---|---|
| **Endepunkt i appen** | **LØST** | `GET /api/offentlig/arrangementer` er ferdig implementert og testet |
| **Sikkerhet & personvern** | **LØST** | Kun offentlige samlinger og felt eksponeres via serverproxy |
| **Tidssone & sommertid** | **LØST** | Serveren leverer ferdig konvertert tid med norsk offset (`+01:00`/`+02:00`) |
| **Fremhevede arrangementer** | **LØST** | Avklart med PO: Fremhevede arrangementer overstyrer `?visning=` og beholdes i toppseksjonen |

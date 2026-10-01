# Produktdokumentasjon: Menighetsplan (Single Source of Truth)

> **Dokumentversjon:** 3.0 (Offisiell produksjonsspesifikasjon)  
> **Status:** **Single Source of Truth (SSOT)** for hele systemet.  
> **Gyldighet:** Dette Markdown-dokumentet lever i kildekoden, oppdateres i takt med funksjonaliteten og overstyrer alle eldre forprosjektdokumenter (inkl. tidligere `.odt`-filer).  
> **Målarkitektur:** Google Cloud Firestore & Firebase (`europe-west3` Frankfurt), React 19, TypeScript, Tailwind CSS, PWA

---

## 1. Systemarkitektur & Kjernefilosofi

Menighetsplan er en enhetlig digital plattform som forener to tidligere adskilte verdener i én felles arkitektur:
1. **Offentlig nettside & profilering:** En varm, moderne og universelt utformet portal for menighetens medlemmer, søkende og lokalmiljøet.
2. **Operativ bemannings- og fellesskapsmotor:** Et presist sanntidsverktøy for planlegging av arrangementer, oppgavefordeling, vikarhåndtering og internkommunikasjon.

### Kjernebeslutninger for dataflyt:
* **Én kilde for sannhet:** Ingen parallelle lister eller duplikate databaser.
* **Strenge TypeScript-grensesnitt:** Data fra databasen skal aldri skjules bak `||`-hacks. Hvis datastrukturen mangler påkrevde felter, kaster systemet en synlig feil i stedet for å vise tomme felter.
* **Integrert bemanning:** Bemanning hører hjemme inne i det enkelte arrangementet, supplert med en tverrgående **«Trenger oppfølging»**-oversikt over akutte forfall og ubesatte oppgaver.

---

## 2. Innholdstyper & Feltspesifikasjoner

Tabellen nedenfor definerer de formelle datamodellene med påkrevde og valgfrie felter.

### 2.1 Arrangement (`Gathering`)
Et arrangement er det felles begrepet for enhver samling (gudstjenester, ungdomsmøter, bønnemøter, dugnader og stabsamlinger).

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator (Firestore-dokument-ID). |
| `title` | `string` | Ja | Arrangementets tittel (f.eks. "Høsttakkefest & Gudstjeneste"). |
| `startsAt` | `ISO 8601 string` | Ja | Starttidspunkt med dato og klokkeslett. |
| `endsAt` | `ISO 8601 string` | Nei | Beregnet eller fastsatt sluttidspunkt. |
| `location` | `string` | Nei | Fysisk eller digital lokasjon (standard: "Misjonskirken"). |
| `groupId` | `string` | Ja | Primær ansvarlig gruppe. |
| `type` | `"arrangement" \| "gruppesamling"` | Ja | Overordnet kategori. |
| `theme` | `string` | Nei | Dagens tema eller prekentittel. |
| `bibleText` | `string` | Nei | Relevante bibelsteder (f.eks. "Rom 8,28-39"). |
| `hostPersonId` | `string` | Nei | Vertsfamilie eller ansvarlig vert for samlingen. |
| `visibility` | `"intern" \| "offentlig" \| "fremhevet"` | Ja | **Ett felles synlighetsfelt** for hele systemet (se kap. 5). |
| `cancelled` | `boolean` | Nei | Flagg for avlysning med visuelt avlyst-varsel. |
| `programSchedule`| `ProgramItem[]` | Nei | Kjøreplan med klokkeslett, innslag og ansvarlige. |
| `updatedBy` | `string` | Nei | UID til brukeren som sist endret arrangementet. |
| `updatedAt` | `ISO 8601 string` | Nei | Tidsstempel for siste oppdatering. |

### 2.2 Oppgave (`Task`)
En konkret oppgave knyttet til et arrangement.

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator. |
| `gatheringId` | `string` | Ja | Referanse til arrangementet oppgaven tilhører. |
| `groupId` | `string` | Ja | Tjenestegruppen oppgaven sorterer under (f.eks. Lyd/bilde). |
| `title` | `string` | Ja | Oppgavens navn (f.eks. "Lydtekniker", "Møteleder", "Kirkekaffe"). |
| `neededCount` | `number` | Ja | **Antall personer som trengs** for å dekke oppgaven (standard: 1). |
| `description` | `string` | Nei | Praktisk instruks eller sjekkliste for den frivillige. |
| `status` | `"open" \| "assigned" \| "confirmed" \| "vacant" \| "cancelled"` | Ja | Oppgavens overordnede tilstand. |
| `lastReminded` | `ISO 8601 string` | Nei | Tidsstempel for når purring/påminnelse sist ble utført. |
| `updatedBy` | `string` | Nei | UID for siste endring. |

### 2.3 Tildeling (`Assignment`)
Relasjonen mellom en person og en oppgave.

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator. |
| `taskId` | `string` | Ja | Referanse til oppgaven. |
| `personId` | `string` | Ja | Referanse til personen. |
| `response` | `"pending" \| "confirmed" \| "declined" \| "withdrawn"` | Ja | *Venter på svar*, *Bekreftet*, *Avslått* eller *Forfall*. |
| `assignedAt` | `ISO 8601 string` | Ja | Når personen ble tildelt eller forespurt. |
| `respondedAt` | `ISO 8601 string` | Nei | Når personen svarte eller meldte forfall. |
| `withdrawalReason` | `string` | Nei | Valgfri privat melding ved forfall (kun synlig for leder). |

### 2.4 Person (`Person`)
Sentralt kontaktregister for alle bidragsytere og medlemmer.

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator / Firebase Auth UID. |
| `name` | `string` | Ja | Fullt navn. |
| `email` | `string` | Nei | E-postadresse (brukes til innlogging og varsler). |
| `phone` | `string` | Nei | Mobiltelefonnummer. |
| `globalRole` | `"member" \| "admin"` | Ja | Global systemrolle. |
| `policeCertificateValidUntil` | `string (YYYY-MM-DD)` | Nei | Utløpsdato for godkjent politiattest. |
| `unavailablePeriods` | `UnavailablePeriod[]` | Nei | Perioder der personen er bortreist / utilgjengelig. |
| `isPublicProfile` | `boolean` | Nei | Flagg: Skal personen vises på offentlig stabs- og kontaktside? |
| `publicTitle` | `string` | Nei | Offisiell tittel utad (f.eks. "Hovedpastor", "Eldsterådsleder"). |
| `publicPhone` | `string` | Nei | Offisielt kontaktnummer utad (kan avvike fra privat). |
| `publicEmail` | `string` | Nei | Rolleadresse utad (f.eks. `pastor@lillesandmisjonskirke.no`). |
| `avatarUrl` | `string` | Nei | URL til profilbilde i WebP/JPEG. |
| `consentToPublishGivenAt` | `ISO 8601 string` | Nei | **GDPR-samtykkelogg:** Tidsstempel for når samtykke ble registrert. |
| `consentGivenBy` | `string` | Nei | **GDPR-samtykkelogg:** UID til administratoren som innhentet samtykket. |

### 2.5 Tale & Preken (`CmsSermon`)
Mediearkiv for prekener og forkynnelse.

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator. |
| `title` | `string` | Ja | Prekentittel. |
| `date` | `string (YYYY-MM-DD)` | Ja | Dato talen ble holdt. |
| `speakerPersonId` | `string` | Nei | Referanse til registrert person (hvis intern taler). |
| `guestSpeakerName` | `string` | Nei | Navn på ekstern gjestetaler. |
| `series` | `string` | Nei | Strukturert serienavn (f.eks. "Romerbrevet: Nåde og Liv"). |
| `bibleText` | `string` | Nei | Bibeltekst for talen. |
| `summary` | `string` | Nei | Kort sammendrag av budskapet. |
| `audioUrl` | `string` | Nei | Ekstern strømmelenke til lydopptak / Spotify / Podcast RSS. |
| `videoUrl` | `string` | Nei | **Tvinges gjennom YouTube-nocookie parser** for personvern. |
| `gatheringId` | `string` | Nei | Valgfri kobling til arrangementet talen ble holdt under. |

### 2.6 Side (`CmsPage`)
Faste sider på nettstedet (Om oss, Kontakt, Barn og unge, Gi).

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator. |
| `title` | `string` | Ja | Sidens overskrift. |
| `slug` | `string` | Ja | URL-sti (f.eks. `/om-oss`, `/gi`). Unik. |
| `content` | `string` | Ja | Tekstinnhold / Markdown. |
| `status` | `"draft" \| "published"` | Ja | **Kladdestatus:** Kladder vises kun for innlogget admin. |
| `navOrder` | `number` | Ja | Sorteringsrekkefølge i hovedmenyen. |
| `inNavMenu` | `boolean` | Ja | Om siden skal vises i toppmenyen. |
| `updatedAt` | `ISO 8601 string` | Ja | Tidsstempel for siste redigering. |
| `updatedBy` | `string` | Ja | Bruker-ID som sist redigerte siden. |

### 2.7 Nyhetsartikkel (`CmsNewsArticle`)
Frittstående artikler i den hybride Aktuelt-strømmen.

| Feltnavn | Type | Påkrevd? | Beskrivelse & Validering |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Ja | Unik identifikator. |
| `title` | `string` | Ja | Artikkelens overskrift. |
| `slug` | `string` | Ja | URL-vennlig tittel. |
| `category` | `string` | Ja | Kategori (f.eks. "Rapport", "Familie", "Ungdom"). |
| `summary` | `string` | Ja | Ingress på forsiden. |
| `content` | `string` | Ja | Fulltekst. |
| `date` | `string (YYYY-MM-DD)` | Ja | Publiseringsdato. |
| `expiresAt` | `string (YYYY-MM-DD)` | Nei | Valgfri utløpsdato (arkiveres automatisk fra forsiden). |
| `authorId` | `string` | Nei | Referanse til forfatter i personregisteret. |
| `gatheringRefId`| `string` | Nei | Valgfri relasjon til et tilknyttet arrangement. |
| `imageUrl` | `string` | Nei | Banner- eller illustrasjonsbilde. |

---

## 3. Bemanningsmotoren: Den Matematiske Ligningen

For å sikre fullstendig konsistens i bemanningen gjelder den ufravikelige ligningen:

$$\text{Ledige plasser} = \text{Behov (neededCount)} - \text{Bekreftet (confirmed)} - \text{Venter (pending)}$$

### 3.1 Handlingsskille: Tildel vs. Forespør
* **Knapp 1: «Tildel» (Direkte bekreftelse):**  
  Benyttes når lederen allerede har avtalt vakten muntlig eller på forhånd. Setter umiddelbart `response = "confirmed"`.
* **Knapp 2: «Forespør» (Invitasjon):**  
  Sender en forespørsel til personen via varsling og setter `response = "pending"`.
* **Akutt forfall:**  
  Dersom en bekreftet person melder forfall **under 48 timer** før arrangementets oppmøtetid, flagges oppgaven som `vacant` (akutt forfall), og oppfølgingslisten aktiverer et fremhevet varsel.

### 3.2 Universell Utforming (WCAG AA) i Bemanningsstatus
Statuser formidles alltid med **SVG-ikon + tekst**, aldri med farge alene:
* 🟢 **Dekket:** `[CheckCircle2] Dekket (2/2)`
* 🟡 **Venter:** `[Clock] Venter på svar (1/2 bekreftet, 1 venter)`
* 🔴 **Mangler:** `[AlertTriangle] Mangler 1 (1/2 bekreftet)`

---

## 4. Sikkerhetsregler i Firestore (`firestore.rules`)

1. **Beskyttelse av personvern & GDPR:**
   * Offentlig profilflagg (`isPublicProfile`), offentlig telefon/e-post og samtykkelogg kan kun redigeres av brukere med `globalRole == 'admin'`.
   * Vanlige medlemmer har kun tilgang til å oppdatere sine egne personlige varslingspreferanser og svare på egne tildelinger.
2. **Audit-validering (`updatedBy`):**
   * Når et dokument oppdateres med feltet `updatedBy`, håndhever sikkerhetsreglene at verdien er lik `request.auth.uid`.

---

## 5. Synlighetsmodellen: Én Bryter

Arrangementets synlighet styres av det enhetlige feltet `visibility`:
* **`intern`:** Kun synlig for innloggede medlemmer, gruppeledere og stab. Skjules helt fra offentlig kalender og API.
* **`offentlig`:** Vises i den offentlige kalenderen på nettsiden og i ukeprogrammet.
* **`fremhevet`:** Offentlig, og låst med høy prioritet som "Neste gudstjeneste / arrangement" på forsiden med fremhevet infoboks.

Forside- og kalendermodulene gjør utelukkende en direkte filtrering på dette ene feltet. Det finnes ingen overlappende parallelle brytere.

---

## 6. Hybrid «Aktuelt»: Arrangementer & Artikler

For å unngå utdaterte nyheter er **Aktuelt** en samlet tidslinje:
1. **Kommende arrangementer:** Hentes automatisk fra kalenderen der `visibility` er `offentlig` eller `fremhevet`. Når datoen er passert, arkiveres de automatisk fra forsiden.
2. **Frittstående artikler:** Rapporter fra leir, pastorbrev eller julehilsener skrives som artikler. Disse kan ha en valgfri kobling (`gatheringRefId`) til et konkret arrangement.

---

## 7. Planleggingsrutiner & Operative Handlinger

### 7.1 «Lag neste arrangement» (Erstatning for kloning)
Knappen **«Lag neste arrangement»** åpner en datovelger. Den oppretter en ny hendelse på den valgte datoen og kopierer over alle oppgaver og deres definerte bemanningsbehov (`neededCount`), men etterlater personlisten tom slik at nye personer kan tildeles eller forespørres.

### 7.2 Purring uten e-post (Manuell SMS/Messenger-modal)
Frem til automatisert e-post eller SMS-gateway er koblet til ekstern leverandør:
* Klikk på **«Purr»** oppdaterer tidsstempelet `lastReminded` på oppgaven.
* Samtidig åpnes en ferdigformatert dialogboks med ferdigskrevet tekst og oppmøtedetaljer som lederen med ett klikk kopierer til utklippstavlen for sending via SMS eller Messenger.

### 7.3 YouTube-nocookie parser
Alle YouTube-lenker som legges inn på taler eller undersider konverteres automatisk til `https://www.youtube-nocookie.com/embed/{id}` for å oppfylle personvernkrav og unngå tredjeparts sporingskapsler.

---

## 8. Skjermkrav & Akseptansekriterier

### 8.1 Skjermkrav for Admin Studio

| Skjerm / Fane | Minimumskrav til hver rad | Mulige handlinger |
| :--- | :--- | :--- |
| **Sider & Innhold** | Forside øverst. Tittel, URL-slug, statusmerke (`Draft` / `Published`), menyrekkefølge, sist endret dato og bruker. | Rediger side, forhåndsvis, slett (krever bekreftelse i modal). |
| **Arrangementer & Bemanning** | Tittel, starttidspunkt, lokasjon, type, synlighet (`intern`/`offentlig`/`fremhevet`), bemanningsbadge (ikon + tekst). | Rediger, opprett oppgaver, åpne kjøreplan, «Lag neste arrangement». |
| **Trenger oppfølging** | Oppgavetittel, tilhørende arrangement og dato, antall plasser (`1/2`), status (`Mangler 1` / `Akutt forfall`). | Hurtigtildel person, send forespørsel, åpne purretekst. |
| **Taler & Prekener** | Tittel, dato, taler/gjestetaler, serie, medietype-indikator (🎧 Lyd / 🎬 Video). | Rediger metadata, legg til opptaksstrøm, koble til arrangement. |
| **Personregister & Stab** | Navn, telefon, e-post, grupperoller, politiattest-indikator, «Vis offentlig»-merke med samtykkestatus. | Rediger person, registrer samtykke til publisering, slett person. |

### 8.2 Konkrete Testscenarioer (Akseptansekriterier)

* **Scenario A: Tildeling av frivillig:**  
  1. Gitt en oppgave "Lydtekniker" med `neededCount = 1`.
  2. Når admin klikker «Tildel» og velger "Kari Nordmann",
  3. Så opprettes en tildeling med `response: "confirmed"`, og oppgaven viser umiddelbart `[CheckCircle2] Dekket (1/1)`.

* **Scenario B: Forespørsel og forfall:**  
  1. Gitt en oppgave "Kirkekaffe" med `neededCount = 2`.
  2. Når admin klikker «Forespør» for person A,
  3. Så viser oppgaven `[Clock] Venter på svar (0/2 bekreftet, 1 venter) · Mangler 1`.
  4. Dersom person A svarer «Kan ikke» under 48 timer før samlingen, vises varselet `[AlertTriangle] Akutt forfall`.

* **Scenario C: Publisering med GDPR-sporbarhet:**  
  1. Når en administrator aktiverer «Vis offentlig på nettsiden» for en medarbeider,
  2. Så loggføres `consentToPublishGivenAt` med gjeldende tidsstempel og `consentGivenBy` med administratorens UID.

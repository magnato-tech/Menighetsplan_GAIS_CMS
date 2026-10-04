# Målarkitektur: Visuell blokkbygger i CMS med fast Hero-ramme og modulkort

Denne planen presiserer og hever CMS-brukeropplevelsen fra rå tekst-/kodesyntaks til en **ren, visuell blokk- og kortbasert editor**, med fast låst Hero-ramme øverst og et strengt skille mellom blokkstyring og innholdsredigering.

---

### Brukeravklaring & Kritiske beslutninger

> [!IMPORTANT]
> **Kjernepremisser for den visuelle redaktøropplevelsen:**
> 1. **Hero som egen, låst toppramme:**  
>    * Plassert fast øverst på siden.  
>    * Kan **ikke flyttes** og **ikke slettes**.  
>    * Visuelt merket med `📌 Fast Toppramme (Hero)`.  
>    * Feltene (overskrift, ingress/undertittel, bakgrunnsbilde, knapper) redigeres direkte i denne rammen.
> 2. **Ingen rå kodesyntaks (`:::module...`) for redaktøren:**  
>    * Alle innholdsblokker og moduler representeres som **visuelle kort** i redigeringskolonnen.  
>    * Rå kode er skjult; redaktøren forholder seg kun til intuitive kort med ikoner, navn og handlinger.
> 3. **Skille mellom «Endre blokk» og «Rediger innhold»:**  
>    * **Endre blokk:** Flytte opp (↑), flytte ned (↓), slette/skjule (🗑️), og velge godkjent layoutvariant (`[Fremhevet visning ▾]`).  
>    * **Rediger innhold:** For statiske blokker åpnes en ren innholdseditor (tittel, tekst, bilde). For dynamiske moduler er underliggende datainnhenting 100 % låst i koden.

---

## 1. Oversikt & Kjernekonsept

* **Hva redaktøren ser i CMS (`PageEditModal`):**
  Redaktøren møter ikke lenger et stort, uoversiktlig tekstområde med blandet Markdown og modultagger. I stedet er redigeringsflaten delt inn i to soner:
  1. **Øverst (Fast):** En dedikert, lekker **Hero-redigeringsboks** (låst til toppen).
  2. **Under (Fleksibel blokkliste):** En visuell **kortstokk** av innholdsblokker og moduler som kan sorteres, legges til eller fjernes.
* **Tydelig tagging:**
  * `⚡ DYNAMISK MODUL` (Indigo badge): Henter automatisk data fra menighetens systemer (Gudstjenester, Kalender, Nyheter, Taler, Vipps).
  * `📝 STATISK INNHOLD` (Grågrønn badge): Egendefinerte tekster, bilder, sitater, informasjonsbokser.

---

## 2. Brukeropplevelse & Visuell komposisjon

### A. Fast Hero-ramme (Øverst)
```
┌────────────────────────────────────────────────────────────────────────┐
│ 📌 HERO / TOPPBANNER  [Låst øverst · Kan ikke flyttes/slettes]         │
├────────────────────────────────────────────────────────────────────────┤
│ Tittel:   [ Velkommen til Lillesand Misjonskirke                     ] │
│ Ingress:  [ Et åpent hjem for alle generasjoner. Vi samles til...    ] │
│ Bakgrunn: [🖼️ Hovedbilde valgt: sommer-kirke.jpg ] [Endre / Slett]     │
│ Knapper:  Primary: "Se hva som skjer" → /hva-skjer                     │
│           Secondary: "Bli kjent med oss" → /om-oss                     │
└────────────────────────────────────────────────────────────────────────┘
```

### B. Visuelle modulkort i blokklisten
Hver blokk i listen under Hero representeres som et eget interaktivt kort:

#### Eksempel 1: Dynamisk modul (Neste gudstjeneste)
```
┌────────────────────────────────────────────────────────────────────────┐
│ ⠿  ⚡ NESTE GUDSTJENESTE                      [⚡ Dynamisk modul]     │
│    Datakilde: Henter automatisk fra Gudstjenesteplanleggeren           │
│                                                                        │
│    Layout: [ Fremhevet visning (kort) ▾ ]       [ ↑ ] [ ↓ ] [ 🗑️ ]    │
└────────────────────────────────────────────────────────────────────────┘
```
* **Koden bestemmer:** Henter automatisk neste gudstjeneste fra Firebase, dato, klokkeslett, tema og ledere.
* **Redaktøren styrer:** Posisjon på siden (↑/↓), layoutvariant dropdown, eller skjul (🗑️).

#### Eksempel 2: Dynamisk modul (Kalender)
```
┌────────────────────────────────────────────────────────────────────────┐
│ ⠿  ⚡ KALENDER: HVA SKJER                     [⚡ Dynamisk modul]     │
│    Datakilde: Henter de 4 neste samlingene fra arrangementsdatabasen   │
│                                                                        │
│    Layout: [ 4 kort i grid ▾ ]                  [ ↑ ] [ ↓ ] [ 🗑️ ]    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Eksempel 3: Statisk innholdsblokk (Tekst / Pastorhilsen)
```
┌────────────────────────────────────────────────────────────────────────┐
│ ⠿  📝 TEKST & AVSNITT                         [📝 Statisk innhold]    │
│    «Varm velkomst til nye studenter og familier denne høsten...»       │
│                                                                        │
│    [ ✏️ Rediger tekst ]                         [ ↑ ] [ ↓ ] [ 🗑️ ]    │
└────────────────────────────────────────────────────────────────────────┘
```

### C. Knapp for å sette inn ny blokk
Nederst i listen ligger en tydelig knapp:
`[ + Legg til blokk eller modul ]`
Når denne klikkes, åpnes det felles blokkbiblioteket der redaktøren kan velge mellom ferdige statiske formater og dynamiske moduler.

---

## 3. Nøkkelbeslutninger & Avveininger

* **Beslutning 1: Visuell kortstokk i stedet for rå modulkode**
  * *Valgt løsning:* Konvertere mellom den visuelle kortlisten og den underliggende lagringsstrukturen automatisk bak kulissene.
  * *Hvorfor:* Redaktører skal aldri behøve å lære eller huske syntaks som `:::module-worship[highlight]`. De skal se og håndtere bokser med klare etiketter, piler og valg.
* **Beslutning 2: Fastlåst Hero-ramme**
  * *Valgt løsning:* Hero løftes ut av den generelle blokklisten og forankres som en permanent toppseksjon i editoren.
  * *Hvorfor:* Sikrer en stabil visuell identitet for nettsiden. Siden har alltid et definert topp-anker uavhengig av hvordan modulene under omorganiseres.
* **Beslutning 3: Robust og tapsfri datamodell**
  * *Valgt løsning:* Blokklisten lagres og serialiseres automatisk til/fra `page.content`.
  * *Hvorfor:* Krever ingen endring i databasestrukturen, bevarer full bakoverkompatibilitet med eksisterende sider og tester, og gjør det enkelt å utvide med nye moduler senere.

---

## 4. Teknisk arkitektur & Datastrategi

### Arkitektur- og komponentdiagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     AdminStudio / PageEditModal                        │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ [1] Fast Hero-ramme (Tittel, ingress, bilde, knapper)          │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │ [2] Visuell Blokkbygger (BlockListManager):                    │   │
│   │     • Kort 1: ⚡ Neste gudstjeneste  [Fremhevet ▾]  [↑][↓][🗑️]  │   │
│   │     • Kort 2: 📝 Pastorhilsen (tekst) [✏️ Rediger]  [↑][↓][🗑️]  │   │
│   │     • Kort 3: ⚡ Kalender: Hva skjer [Grid ▾]       [↑][↓][🗑️]  │   │
│   │     • Kort 4: ⚡ Nyheter & Artikler  [3 kort ▾]     [↑][↓][🗑️]  │   │
│   │     • Kort 5: ⚡ Siste tale          [Spiller ▾]    [↑][↓][🗑️]  │   │
│   │     • Kort 6: ⚡ Husfellesskap       [Banner ▾]     [↑][↓][🗑️]  │   │
│   │     • Kort 7: ⚡ Givertjeneste/Vipps [Kort ▾]       [↑][↓][🗑️]  │   │
│   │     [ + Legg til blokk eller modul ]                           │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ Auto-synk til draftPage
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   1:1 Live Preview & Offentlig visning                 │
│                                                                        │
│  [Hero]           ──► Fast Hero-banner med live bilde og tekst        │
│  [WorshipModule]  ──► Henter sanntidsdata fra Firebase gatherings      │
│  [Pastor-tekst]   ──► Rendres i standard designtypografi               │
│  [CalendarModule] ──► Henter 4 neste samlinger fra gatherings          │
│  [NewsModule]     ──► Henter 3 siste saker fra CMS-nyheter             │
│  [SermonModule]   ──► Viser prekespiller med Spotify og lyd            │
│  [GroupsModule]   ──► Viser fellesskapsbanner                          │
│  [GivingModule]   ──► Viser Vipps og konto                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementeringsplan ved godkjenning

1. **Visuell blokkmodell & serialisering (`src/utils/blockParser.ts`):**
   * Funksjoner for å parse `page.content` til en ren liste av visuelle blokk-objekter (`ContentBlockItem`), og serialisere listen tilbake til Markdown/modultagger ved lagring.
2. **Visuell blokkliste-komponent (`VisualBlockManager.tsx`):**
   * Komponent som viser listen med modulkort i `PageEditModal`.
   * Støtter direkte flytting opp/ned, sletting, valg av layoutvariant fra dropdown, og åpning av tekst-editor for statiske blokker.
3. **Hero-ramme i `PageEditModal.tsx`:**
   * Tydelig merket toppramme med `📌 Hero / Toppbanner (Fast øverst)`.
   * Inneholder tittel, ingress og bildeopplaster for Hero.
4. **Dedikerte dynamiske moduler (`src/components/cms/modules/`):**
   * `WorshipModule.tsx` (highlight / compact)
   * `CalendarModule.tsx` (grid / list)
   * `NewsModule.tsx` (grid / compact)
   * `SermonModule.tsx` (player / minimal)
   * `GroupsModule.tsx` (banner / cards)
   * `GivingModule.tsx` (card / vipps)
5. **Oppdatere `ContentBlockPickerModal.tsx`:**
   * Felles bibliotek der redaktøren kan velge både nye statiske blokker og dynamiske moduler med ett klikk.
6. **Integrasjon i `PublicHomePage.tsx` og `PublicStaticPage.tsx`:**
   * Knytte sammen Hero og den moduldrevne innholdsrendereren.
7. **Verifisering og testkjøring:**
   * Kjøre hele testsuiten (`npx vitest run`) og verifisere at alle 514 tester består.
   * Kjøre `compile_applet` for å bekrefte feilfritt produksjonsbygg.

# Visuell Innholdsblokk-velger for CMS-sider

En visuell meny og blokkbygger i `AdminCmsPanel` som lar administratorer velge blant ferdige innholdsblokker (to-kolonne-grid, bilde med tekst, sitatblokker og infobokser) med sanntids miniatyrforhåndsvisning, og sette dem inn som Tailwind-formaterte maler i innholdsfeltet.

## Brukeravklaringer og Bekreftede Beslutninger

> [!IMPORTANT]
> Følgende valg er bekreftet i avklaringsrunden:

- **Bekreftet visning**: En egen visuell modalmeny («Legg til innhold») med forhåndsvisning og miniatyrer av hver blokktype for enkel gjenkjennelse.
- **Bekreftet arbeidsflyt**: Ved valg av blokk settes en ferdig formatert mal rett inn i tekstfeltet, slik at redaktøren umiddelbart kan erstatte eksempelinnholdet og tilpasse teksten.
- **Bekreftet blokkutvalg**:
  1. **Bilde med tekst** (både venstre- og høyrejustert bilde med responsiv brytning på mobil).
  2. **To-kolonne innholdsgrid** (side-ved-side kort med tittel og avrundede rammer).
  3. **Sitatblokk** (typografisk fremhevet sitat med vertikal designstrek og forfatterangivelse).
  4. Kompatibilitet med eksisterende infobokser og handlingsknapper (CTA).

---

## 1. Oversikt og Kjernekonsept

### Hva funksjonen leverer
1. **«+ Legg til innhold»-knapp**: Plassert tydelig ved tekstfeltet i `PageEditModal`.
2. **`ContentBlockPickerModal`**: En visuell dialogboks som presenterer innholdsblokkene som tydelige valgkort. Hvert kort inneholder:
   - Blokknavn og formål
   - Skjematisk layout-forhåndsvisning (viser proporsjoner for bilde, tekst og kolonner)
   - Forhåndsvisning av hvordan sluttresultatet vil se ut med menighetens fargeprofil
   - «Sett inn blokk»-handling
3. **Utvidet `CmsContentRenderer`**: Støtte for `:::media-left[url]` og `:::media-right[url]` som automatisk formaterer bildeseksjoner med Tailwind CSS (responsiv flex/grid, avrunding via `--cms-radius`, og ryddig tekstflyt).

### Målgruppe og Nytteverdi
- **Menighetsredaktører**: Slipper å huske syntaks eller tenke på CSS-klasser. De kan klikke på «Legg til innhold», velge en blokktype, og umiddelbart se hvordan layouten blir.
- **Konsistent visuelt uttrykk**: Alle sider følger menighetens faste designlinje uten avvikende formateringer.

---

## 2. Brukeropplevelse og Visuelt Design

### Arbeidsflyt for administrator
```
┌────────────────────────────────────────────────────────┐
│  PageEditModal (Sideredigering)                        │
│                                                        │
│  [+ Legg til innhold]  [📌 Infoboks]  [🗂️ Grid] ...    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Innholdstekstfelt...                             │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ Klikk på "+ Legg til innhold"
                            ▼
┌────────────────────────────────────────────────────────┐
│  ContentBlockPickerModal (Visuell blokkvelger)         │
│                                                        │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │ 🖼️ Bilde med tekst     │  │ 🗂️ 2-kolonne grid    │  │
│  │ [ Miniatyrbilde ]      │  │ [ Kort 1 ] [ Kort 2] │  │
│  │ [ Sett inn ]           │  │ [ Sett inn ]         │  │
│  └────────────────────────┘  └──────────────────────┘  │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │ 💬 Sitatblokk          │  │ 📌 Fremhevet varsel  │  │
│  │ «Sitat med kilde...»   │  │ Viktig melding...    │  │
│  │ [ Sett inn ]           │  │ [ Sett inn ]         │  │
│  └────────────────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### De 5 forhåndsdesignede blokkene

1. **Bilde med tekst (Venstre)**:
   - *Syntaks*:
     ```markdown
     :::media-left[https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80]
     ### Fellesskap for alle generasjoner
     Vi tror på verdien av nære relasjoner der alle blir sett, inkludert og verdsatt.
     :::
     ```
   - *Visning*: Bilde til venstre (40 % bredde på desktop, 100 % på mobil) med tittel og tekst til høyre.

2. **Bilde med tekst (Høyre)**:
   - *Syntaks*:
     ```markdown
     :::media-right[https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80]
     ### Samlinger og aktiviteter
     Gjennom uken møtes vi til ulike fellesskap, fra barnekirke til bibelgrupper.
     :::
     ```

3. **To-kolonne innholdsgrid**:
   - *Syntaks*:
     ```markdown
     :::grid
     :::card Smågrupper & Husfellesskap
     Nære grupper som møtes i hjemmene annenhver uke for samtale og bønn.
     :::
     :::card Barne- & Ungdomsarbeid
     Sprell Levende på søndager og fredagsklubb for ungdommer.
     :::
     :::
     ```

4. **Sitatblokk med kilde**:
   - *Syntaks*:
     ```markdown
     :::quote[Kari Nordmann, Hovedpastor]
     Vårt ønske er at menigheten skal være et åpent hjem for alle som søker tro og fellesskap.
     :::
     ```

5. **Handlingsseksjon (CTA)**:
   - *Syntaks*:
     ```markdown
     [Knapp: Bli med som frivillig](/kontakt)
     ```

---

## 3. Viktige Produktbeslutninger og Avveininger

### Beslutning 1: Visuell blokkvelger-modal fremfor ren rullegardin
- **Valgt løsning**: En modal med forhåndsvisningskort som viser både ikon, tittel, beskrivelse og miniatyr-layout.
- **Begrunnelse**: Gir redaktøren umiddelbar visuell trygghet på hvordan blokken er bygget opp før den settes inn.

### Beslutning 2: Tekstbasert innsetting med hjelpetekst
- **Valgt løsning**: Setter inn ferdig Markdown-blokk med veiledende eksempler og bilde-URL som redaktøren raskt kan erstatte.
- **Begrunnelse**: Bevarer full frihet i teksteditoren, krever ingen komplisert JSON-blokkbase, og fungerer 100 % sømløst med eksisterende Firestore-skjema (`page.content`).

---

## 4. Teknisk Arkitektur og Gjennomføring

### Komponenter og filendringer

```
src/
├── pages/admin/tabs/pages/
│   ├── ContentBlockPickerModal.tsx  (NY: Visuell blokkvelger med miniatyrer)
│   ├── PageEditModal.tsx            (OPPDATERT: Åpne ContentBlockPickerModal)
│   └── PagePreviewModal.tsx         (Viser blokkene i forhåndsvisning)
├── components/cms/
│   └── CmsContentRenderer.tsx       (OPPDATERT: Parsere media-left og media-right)
└── tests/
    └── admin-studio.test.ts         (OPPDATERT: Tester for blokkvelger og parser)
```

### Arbeidstrinn ved Gjennomføring
1. **Opprette `ContentBlockPickerModal.tsx`**:
   - Definere blokkmaler for To-kolonne grid, Bilde med tekst (venstre/høyre), Sitatblokk og CTA.
   - Bygge responsive forhåndsvisningsminiatyrer med Tailwind.
2. **Koble sammen i `PageEditModal.tsx`**:
   - Legge til `isBlockPickerOpen`-tilstand og en fremhevet `+ Legg til innhold`-knapp.
   - Sette inn valgt blokk på markøren eller i slutten av teksten med ren linjeavstand.
3. **Oppdatere `CmsContentRenderer.tsx`**:
   - Implementere parsing og Tailwind-rendering for `:::media-left` og `:::media-right`.
4. **Verifisere med tester og bygg**:
   - Kjøre TypeScript-sjekk og Vitest-tester.

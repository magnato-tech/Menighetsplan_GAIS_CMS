# Strategisk Plan: Menighetsplan som Alt-i-ett Plattform & CMS (v2)

**Referanser:** Benchmark mot [Flekkerøy Misjonskirke (fløymk.no)](https://www.fløymk.no) og [Lillesand Misjonskirke (lillesandmisjonskirke.no)](https://www.lillesandmisjonskirke.no).

---

## 1. Benchmark-analyse mot reelle menighetsnettsider

En gjennomgang av de to referansesidene bekrefter at vår arkitektur treffer blink på kjerneprinsippene, og avdekker 3 konkrete funksjoner vi må ha i CMS-et for å matche og overgå disse:

| Funksjonsområde | Funnet på `fløymk.no` & `lillesandmisjonskirke.no` | Løsning i Menighetsplan |
|---|---|---|
| **1. "Min Side" i hovedmenyen** | `fløymk.no` har «Min side» direkte i toppmenyen for medlemmer og frivillige. | **100 % samsvar.** Vi har lagt Min Side i toppmenyen som tar frivillige og ledere inn i vaktplaner, sanger og grupper. |
| **2. Taler & Prekener (Lyd/Video/YouTube)** | Begge menighetene har en dedikert fane/podkast for opptak av søndagens taler. | **Nytt CMS-verktøy:** Legge til `cms_sermons` i Firestore, med tittel, taler, bibeltekst, serie og YouTube/Spotify-lenke, samt offentlig `/taler`-side. |
| **3. Livet i kirka & Grupper** | Seksjoner for barnekirke, ungdomsarbeid, husfellesskap og bønn. | Dekket via `/fellesskap`, `/hva-skjer` og temasider. |
| **4. Lederskap & Stab** | Bilder, titler og kontaktinformasjon for pastor og ansatte. | **Nytt CMS-verktøy:** Visning av stab og lederskap med bilder og kontaktinfo under «Om oss». |
| **5. Bli med & Tjeneste** | Oppfordring til å bli med i frivillig tjeneste eller dåp/medlemskap. | Kobling mot Min Side og interesse-skjema for oppgaver. |
| **6. Givertjeneste & Vipps** | Svært fremtredende Vipps-nummer og kontonummer for kollekt. | Dekket via `cms_settings` og forside-/footer-blokker. |

---

## 2. Utvidet CMS-arkitektur for Neste Trinn

For å gi menigheten et fullverdig publiseringsverktøy i Admin Studio utvider vi med:

1. **Taler / Prekener-verktøy (`cms_sermons`):**
   * Firestore-samling med tittel, taler, dato, serie, bibeltekst og opptaks-URL (YouTube/Podcast/Vimeo/Lydfil).
   * CMS-fane i Admin Studio for enkel registrering etter søndagens gudstjeneste.
   * Offentlig side `/taler` med avspiller og arkiv.

2. **Lederskap & Stab (`cms_staff`):**
   * Firestore-samling eller innstillinger for pastor, menighetsarbeider, styreleder osv.
   * Elegant kortvisning på «Om oss» og «Kontakt».

3. **Interaktiv «Bli med i tjeneste / Bli med i gruppe»-knapp:**
   * Besøkende kan melde sin interesse for å bidra som frivillig (f.eks. lyd, kirkekaffe, søndagsskole) eller bli med i et husfellesskap.
   * Sendes direkte inn i planleggeren for godkjenning av leder.

4. **Visuell oppgradering av Hero & Toppmeny:**
   * Dropdown/seksjoner som matcher `lillesandmisjonskirke.no` (Hjem, Hva skjer, Taler, Grupper, Om oss, Kontakt & Gi, Min Side).

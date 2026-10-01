# Implementasjonsplan: Hierarkisk Menystruktur & Dynamiske CMS-Sider

## 1. Brukerens Behov & Kontekst
Brukeren påpeker at «Sider & Innhold» i CMS-et ikke samsvarer med navigasjonsmenyen på nettsiden. I dag er menylenker hardkodet i `PublicNavbar.tsx`, mens CMS-sidene ligger som en flat liste i adminpanelet.
Brukeren har lastet opp en skisse av ønsket trestruktur (`Hovedmeny` med hovedfaner og underfaner som *Grupper/Aktiviteter*, *Utleie*, *Om* og *Kontakt*), og har presisert:
1. Menyen på nettsiden skal støtte hovedfaner og underfaner (dropdowns).
2. Opprettelse av ny side skal la administratoren velge overordnet fane (`parentId`), publiseringsstatus og sorteringsrekkefølge.
3. CMS-oversikten skal visualisere menystrukturen som et oversiktlig hierarkisk tre (som i det opplastede bildet).

---

## 2. Arkitektur- og Datamodellendringer

### 2.1 Utvidelse av `CmsPage` i `src/data/cmsData.ts` & `src/types.ts`
Vi oppdaterer `CmsPage` med støtte for trehierarki:
* `parentId?: string | null;` — Referanse til overordnet side (null = hovedfane på toppnivå).
* `navOrder: number;` — Sorteringsrekkefølge blant søskenelementer.
* `inNavMenu: boolean;` — Om siden skal vises i den offentlige menyen eller kun være tilgjengelig via direkte URL.
* `isPublished: boolean;` — Publiseringsstatus (publisert vs. kladd).
* `linkUrl?: string;` — Valgfri snarvei til eksisterende moduler (f.eks. `/hva-skjer` for kalender eller `/taler` for prekenarkiv).

### 2.2 Synkronisering i `CmsContext.tsx` & Firestore
* Sikre at `savePage` og `deletePage` ivaretar `parentId`, `navOrder` og kaskade/omplassering dersom en foreldreside slettes eller flyttes.
* Legge til standard menystruktur basert på skissen:
  - **Forside** (`/`)
  - **Kalender / Hva skjer** (`/hva-skjer`)
  - **Grupper & Fellesskap** (`/fellesskap`) med underfaner: *Gospelkor*, *Husfellesskap*, *Konfirmanter*, *Tweens & Barn*
  - **Utleie** (`/utleie`) med underfaner: *Utleie for selskaper*, *Kurs og konferanse*, *Lokaler & Bilder*
  - **Om menigheten** (`/om-oss`) med underfaner: *Aktuelt*, *Stab & Lederskap*, *Hva vi tror på*
  - **Kontakt & Gi** (`/kontakt`)

---

## 3. Brukergrensesnitt & Visuell Struktur

### 3.1 Ny Trestruktur-visning i Admin Studio (`AdminStudio.tsx`)
Vi bygger en visuell, hierarkisk trekomponent i fanen **Sider & Innhold**:
* **Rotnode:** «📁 Hovedmeny (Offentlig nettsted)» med hurtigknapp `[+ Ny hovedfane]`.
* **Hovedfaner (Nivå 1):** Vises med sideikon, tittel, URL-slug, status (Publisert/Kladd, Vises i meny), sorteringsnummer og handlinger (`Rediger`, `+ Legg til underfane`, `Forhåndsvis`, `Slett`).
* **Underfaner (Nivå 2):** Innrykket med visuelle forgreningslinjer (`├─` og `└─` i Tailwind-styling), sideikon, statusindikatorer og handlinger.
* **Side-editor modal:**
  - Valg av nivå: «Hovedfane på toppmenyen» eller «Underfane under [Nedtrekksmeny med eksisterende hovedfaner]».
  - Nummer for visningsrekkefølge (`navOrder`).
  - Bryter for «Vis i offentlig meny».
  - Bryter for «Publiser (synlig for alle)».
  - Markdown-innhold med forhåndsvisning.

### 3.2 Dynamisk Public Navbar med Dropdowns (`PublicNavbar.tsx`)
* Fjerne hardkodede lenker.
* Hente publiserte sider fra `CmsContext` der `inNavMenu !== false`:
  - Enkle sider uten underfaner rendres som tradisjonelle rene navigasjonslenker.
  - Sider med underfaner rendres som tilgjengelige nedtrekksmenyer (hover og tastaturfokus) med pil-indikator (`ChevronDown`) og ryddig panel for underfanene.
* Mobilmeny med trekkspillfunksjon (accordion) slik at underfaner kan foldes ut på mobil.

---

## 4. Verifisering og Testplan
1. **Automatisert validering (`npm test`):**
   - Kjøre eksisterende tester og legge til tester for trebygger-logikk (sortering etter `navOrder`, filtrering på `isPublished` og `inNavMenu`).
2. **Type- og syntakskontroll (`npm run lint`):**
   - Bekrefte at `tsc --noEmit` passerer feilfritt med alle nye felter og props.
3. **Kompilering (`compile_applet`):**
   - Sikre at Vite-bygget kompilerer 100 % uten feil.
4. **Funksjonell sjekk:**
   - Opprette en ny underside under "Utleie" i Admin Studio og verifisere at den umiddelbart dukker opp i dropdown-menyen på forsiden.

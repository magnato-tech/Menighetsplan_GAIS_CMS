export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface CmsEventOverride {
  gatheringId: string;
  featured: boolean;
  hidden: boolean;
  customTag?: string;
  updatedAt: string;
}

export const initialCmsPages: CmsPage[] = [
  {
    id: "page-om-oss",
    slug: "om-oss",
    title: "Om menigheten",
    summary: "Bli kjent med hvem vi er, hva vi tror på og vårt hjerte for byen og nærmiljøet.",
    content: `## Velkommen til fellesskapet
Vi er en levende, flergenerasjons menighet som ønsker å være et åpent hjem for alle mennesker. Uansett hvor du er på din trosreise, er du hjertelig velkommen hos oss.

## Hva vi står for
- **Varmt fellesskap:** Vi tror på nære relasjoner, omsorg for hverandre og at ingen skal måtte gå alene.
- **Tydelig tro:** Gudstjenestene våre preges av bibelnær forkynnelse, variert sang og lovsang, og rom for bønn.
- **Engasjement i nærmiljøet:** Vi ønsker å utgjøre en positiv forskjell for barn, unge, familier og eldre i lokalsamfunnet.

## Gudstjenesteliv
Hver søndag kl. 11:00 samles vi til gudstjeneste med søndagsskole for barna, etterfulgt av en god og sosial kirkekaffe i kafeen vår.`,
    isPublished: true,
    updatedAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "page-barn-og-unge",
    slug: "barn-og-unge",
    title: "Barn og unge",
    summary: "Et trygt, morsomt og engasjerende miljø for barn, tweens og ungdommer.",
    content: `## For de minste og skolebarna
Hver søndag under gudstjenesten har vi **Sprell Levende Søndagsskole**. Her er det lek, bibelhistorier formidlet i barnehøyde, sang og masse moro!

- **Gullgruppa (0–4 år):** Tilrettelagt lekerom med lydoverføring for foreldre og småbarn.
- **Bibeldetektivene (5–9 år):** Sang, tegning og spennende historier.
- **Tweensklubben (10–13 år):** Kule aktiviteter, brettspill og samtaler om livets store spørsmål.

## Ungdomsarbeidet (Fredager kl. 19:00)
Ungdomsmiljøet samles annenhver fredag til lovsang, sosialt samvær, kiosk, bordtennis og aktuelle temakvelder. Følg oss gjerne på sosiale medier for oppdaterte helgeplaner!`,
    isPublished: true,
    updatedAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "page-kontakt",
    slug: "kontakt",
    title: "Kontakt oss",
    summary: "Vi hører gjerne fra deg! Ta kontakt for samtaler, dåp, vielse eller praktiske spørsmål.",
    content: `## Besøksadresse og kontor
Lillesand Misjonskirke, 4790 Lillesand  
Nettside: lillesandmisjonskirke.no  
Kontortid: Tirsdag – Torsdag kl. 10:00 – 14:00

## Nøkkelpersoner
- **Pastor:** Kari Nordmann (tlf: 912 34 567, e-post: pastor@lillesandmisjonskirke.no)
- **Daglig leder / Koordinator:** Ola Hansen (tlf: 923 45 678, e-post: post@lillesandmisjonskirke.no)
- **Barne- og ungdomsarbeider:** Ingrid Berg (tlf: 934 56 789, e-post: ung@lillesandmisjonskirke.no)

## Gaver og kollekt
Tusen takk for enhver gave til menighetens arbeid og misjonsprosjekter!  
**Vipps-nummer:** #12345 (Lillesand Misjonskirke)  
**Bankkonto:** 1503.45.67890`,
    isPublished: true,
    updatedAt: "2026-09-28T10:00:00.000Z",
  },
];

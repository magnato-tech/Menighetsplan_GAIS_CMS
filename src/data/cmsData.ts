export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
  heroImage?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
}

export interface CmsNewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: "aktuelt" | "gudstjeneste" | "ungdom" | "misjon" | "familie";
  author: string;
  publishedAt: string;
  isPublished: boolean;
  imageUrl?: string;
}

export interface CmsSermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  bibleText?: string;
  series?: string;
  audioUrl?: string;
  spotifyUrl?: string; // e.g. https://open.spotify.com/episode/...
  videoUrl?: string; // e.g. YouTube or Vimeo link
  summary?: string;
}

export interface CmsStaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  category: "pastor" | "stab" | "lederskap" | "barneleder";
  imageUrl?: string;
  bio?: string;
}

export interface CmsSettings {
  churchName: string;
  appName: string;
  tagline: string;
  welcomeHeadline: string;
  welcomeSubtext: string;
  heroImageUrl?: string;
  address: string;
  phone: string;
  email: string;
  officeHours: string;
  vippsNumber: string;
  vippsDescription: string;
  bankAccount: string;
  orgNumber: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  podcastUrl?: string;
}

export interface CmsEventOverride {
  gatheringId: string;
  featured: boolean;
  hidden: boolean;
  customTag?: string;
  updatedAt: string;
}

export const initialCmsSettings: CmsSettings = {
  churchName: "Lillesand Misjonskirke",
  appName: "Menighetsplan",
  tagline: "Varmt fellesskap. Tydelig tro. Enkel tjeneste.",
  welcomeHeadline: "Velkommen til Lillesand Misjonskirke",
  welcomeSubtext: "Et åpent hjem for alle generasjoner. Vi samles til gudstjeneste hver søndag kl. 11:00 med Sprell Levende barnekirke og kirkekaffe.",
  heroImageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1600&q=80",
  address: "Sentrumsgata 12, 4790 Lillesand",
  phone: "912 34 567",
  email: "post@lillesandmisjonskirke.no",
  officeHours: "Tirsdag – Torsdag kl. 10:00 – 14:00",
  vippsNumber: "#12345",
  vippsDescription: "Lillesand Misjonskirke",
  bankAccount: "1503.45.67890",
  orgNumber: "987 654 321",
  facebookUrl: "https://facebook.com/lillesandmisjonskirke",
  instagramUrl: "https://instagram.com/lillesandmisjonskirke",
  youtubeUrl: "https://youtube.com/@lillesandmisjonskirke",
  podcastUrl: "https://spotify.com",
};

export const initialCmsStaff: CmsStaffMember[] = [
  {
    id: "staff-1",
    name: "Kari Nordmann",
    role: "Hovedpastor",
    email: "pastor@lillesandmisjonskirke.no",
    phone: "912 34 567",
    category: "pastor",
    bio: "Kari har vært pastor i Lillesand Misjonskirke siden 2021 og brenner for bibelformidling og nære fellesskap.",
  },
  {
    id: "staff-2",
    name: "Ola Hansen",
    role: "Daglig leder & Koordinator",
    email: "post@lillesandmisjonskirke.no",
    phone: "923 45 678",
    category: "stab",
    bio: "Ola holder i den daglige driften, husfellesskap og frivilligkoordinering.",
  },
  {
    id: "staff-3",
    name: "Ingrid Berg",
    role: "Barne- og Ungdomsarbeider",
    email: "ung@lillesandmisjonskirke.no",
    phone: "934 56 789",
    category: "barneleder",
    bio: "Ingrid leder Sprell Levende søndagsskole og fredagsklubben for ungdom.",
  },
  {
    id: "staff-4",
    name: "Magnus Foss",
    role: "Menighetsrådsleder",
    email: "styre@lillesandmisjonskirke.no",
    phone: "945 67 890",
    category: "lederskap",
    bio: "Magnus leder menighetens styre og strategiarbeid.",
  },
];

export const initialCmsSermons: CmsSermon[] = [
  {
    id: "sermon-1",
    title: "Guds rike er nær",
    speaker: "Pastor Kari Nordmann",
    date: "2026-09-20T11:00:00.000Z",
    bibleText: "Markus 1,14–15",
    series: "Vandring gjennom Markus",
    summary: "Hva betyr det når Jesus forkynner at tiden er inne og Guds rike er kommet nær? En tale om tro og omvendelse i hverdagen.",
    audioUrl: "https://traffic.libsyn.com/preview/forcedn/voiceofhope/sample.mp3",
    spotifyUrl: "https://open.spotify.com/episode/7makk4oTQel546v09Zzwh2",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "sermon-2",
    title: "Kalt til å følge",
    speaker: "Gjesteleder Thomas Vik",
    date: "2026-09-13T11:00:00.000Z",
    bibleText: "Matteus 4,18–22",
    series: "Disippelliv i dag",
    summary: "Da Jesus kalte disiplene ved Galileasjøen forlot de garnene straks. Hva kaller Han oss til å legge bak oss for å følge Ham?",
    audioUrl: "https://traffic.libsyn.com/preview/forcedn/voiceofhope/sample.mp3",
    spotifyUrl: "https://open.spotify.com/episode/7makk4oTQel546v09Zzwh2",
  },
  {
    id: "sermon-3",
    title: "Kraften i et åpent hjerte",
    speaker: "Pastor Kari Nordmann",
    date: "2026-09-06T11:00:00.000Z",
    bibleText: "Efeserne 3,14–21",
    series: "Rikdommen i Kristus",
    summary: "En bønn om å bli fylt av all Guds fylde, og hvordan Guds kjærlighet overgår all vår forstand og beregning.",
    audioUrl: "https://traffic.libsyn.com/preview/forcedn/voiceofhope/sample.mp3",
    spotifyUrl: "https://open.spotify.com/episode/7makk4oTQel546v09Zzwh2",
  },
];

export const initialCmsNews: CmsNewsArticle[] = [
  {
    id: "news-1",
    title: "Velkommen til høstens gudstjenester og fellesskap",
    slug: "velkommen-til-hostens-gudstjenester",
    summary: "Høsten er i gang for fullt med søndagsskole for barna, nye husfellesskap og spennende temaserier.",
    content: `Vi gleder oss over å være i gang med et nytt semester i Lillesand Misjonskirke! Hver søndag kl. 11:00 samles vi til gudstjeneste med rom for lovsang, bønn og forkynnelse.

Under gudstjenesten har barna sin egen Sprell Levende søndagsskole i tre aldersgrupper:
- Gullgruppa (0–4 år)
- Bibeldetektivene (5–9 år)
- Tweensklubben (10–13 år)

Etter gudstjenesten er alle hjertelig velkommen til gratis kirkekaffe og en god prat i kafeen vår. Enten du har gått i kirken hele livet eller aldri har vært her før, er døren vidåpen for deg!`,
    category: "gudstjeneste",
    author: "Pastor Kari Nordmann",
    publishedAt: "2026-09-20T10:00:00.000Z",
    isPublished: true,
  },
  {
    id: "news-2",
    title: "Bli med i et husfellesskap – nære relasjoner i hverdagen",
    slug: "bli-med-i-et-husfellesskap",
    summary: "Ønsker du et mindre fellesskap å dele tro, liv og hverdag med? Nå starter nye grupper opp.",
    content: `Et husfellesskap er en gruppe på 6–12 personer som samles annenhver uke i hjemmene. Her deler vi et enkelt måltid, leser fra Bibelen, ber for hverandre og har et trygt rom for gode samtaler.

Vi har grupper for unge voksne, barnefamilier, og blandede generasjoner over hele kommunen.

Ønsker du å vite mer eller finne en gruppe som passer for deg? Ta kontakt med husgruppe-koordinatoren vår via kontaktskjemaet på nettsiden eller snakk med oss på søndag!`,
    category: "aktuelt",
    author: "Ola Hansen (Gruppeleder)",
    publishedAt: "2026-09-15T14:30:00.000Z",
    isPublished: true,
  },
  {
    id: "news-3",
    title: "Ungdomsmiljøet samles annenhver fredag",
    slug: "ungdomsmiljoet-samles-annenhver-fredag",
    summary: "Kiosk, bordtennis, lovsang og gode samtaler for alle fra 8. klasse og oppover.",
    content: `Annenhver fredag kl. 19:00 fylles ungdomssalen med ungdommer fra hele distriktet. Vi har åpen kiosk med toast og brus, turneringer i bordtennis og biljard, et kort program med appell og lovsang, og god tid til å henge sammen.

Følg gjerne ungdomsarbeidet på Instagram for ferske oppdateringer og helgens program!`,
    category: "ungdom",
    author: "Ingrid Berg (Ungdomsarbeider)",
    publishedAt: "2026-09-10T18:00:00.000Z",
    isPublished: true,
  },
];

export const initialCmsPages: CmsPage[] = [
  {
    id: "page-om-oss",
    slug: "om-oss",
    title: "Om menigheten",
    summary: "Bli kjent med hvem vi er, hva vi tror på og vårt hjerte for byen og nærmiljøet.",
    content: `## Velkommen til fellesskapet
Vi er en levende, flergenerasjons menighet tilknyttet Misjonskirken Norge. Vi ønsker å være et åpent hjem for alle mennesker. Uansett hvor du er på din trosreise, er du hjertelig velkommen hos oss.

## Vår visjon
«Guds ære – menneskers frelse». Vi drømmer om en menighet der mennesker opplever Jesu kjærlighet, finner tilhørighet og blir utrustet til å tjene sine medmennesker.

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
    title: "Kontakt oss & Gi",
    summary: "Vi hører gjerne fra deg! Ta kontakt for samtaler, dåp, vielse, givertjeneste eller praktiske spørsmål.",
    content: `## Besøksadresse og kontor
Lillesand Misjonskirke  
Sentrumsgata 12, 4790 Lillesand  
Kontortid: Tirsdag – Torsdag kl. 10:00 – 14:00

## Nøkkelpersoner
- **Pastor:** Kari Nordmann (tlf: 912 34 567, e-post: pastor@lillesandmisjonskirke.no)
- **Daglig leder / Koordinator:** Ola Hansen (tlf: 923 45 678, e-post: post@lillesandmisjonskirke.no)
- **Barne- og ungdomsarbeider:** Ingrid Berg (tlf: 934 56 789, e-post: ung@lillesandmisjonskirke.no)

## Gaver og kollekt
Tusen takk for enhver gave til menighetens arbeid og misjonsprosjekter!  
- **Vipps-nummer:** #12345 (Lillesand Misjonskirke)  
- **Bankkonto:** 1503.45.67890  
- **Skattefradrag:** Gaver over 500 kr i året gir rett til skattefradrag. Registrer personnummer hos kasserer.`,
    isPublished: true,
    updatedAt: "2026-09-28T10:00:00.000Z",
  },
];

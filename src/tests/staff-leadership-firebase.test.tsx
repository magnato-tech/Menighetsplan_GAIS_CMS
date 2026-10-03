// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Person, Group } from "../types";
import { CmsContentRenderer } from "../components/cms/CmsContentRenderer";
import { parseCmsContent } from "../utils/cmsContent";

// State variable to simulate dynamic Firebase Firestore responses
let currentFirebasePersons: Person[] = [];
let currentFirebaseGroups: Group[] = [];

vi.mock("../context/FirebaseDataContext", () => ({
  useFirebase: () => ({
    allPersons: currentFirebasePersons,
    groups: currentFirebaseGroups,
    currentUser: currentFirebasePersons[0] || null,
    updatePerson: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  currentFirebasePersons = [];
  currentFirebaseGroups = [];
});

// Helper fixture data representing Firestore collections
const mockFirebasePersons: Person[] = [
  {
    id: "fb-pastor-1",
    name: "Johannes Prest",
    phone: "111 22 333", // Private phone
    email: "privat.johannes@eksempel.no", // Private email
    globalRole: "admin",
    isStaff: true,
    staffRole: "Hovedpastor & Daglig leder",
    staffCategory: "pastor",
    staffBio: "Brenner for levende menighetsfellesskap og forkynnelse.",
    isPublicProfile: true,
    publicPhone: "38 00 11 22", // Public work phone
    publicEmail: "pastor@filadelfia.no", // Public work email
    avatarUrl: "https://images.unsplash.com/photo-pastor",
    consentToPublishGivenAt: "2026-01-15T10:00:00Z",
    consentGivenBy: "admin-system",
  },
  {
    id: "fb-stab-adm",
    name: "Astrid Administrasjon",
    phone: "222 33 444",
    email: "privat.astrid@eksempel.no",
    globalRole: "member",
    isStaff: true,
    staffRole: "Administrasjonsleder & Økonomi",
    staffCategory: "stab",
    staffBio: "Holder orden på drift, økonomi og frivillige team.",
    isPublicProfile: true,
    publicPhone: "38 00 11 23",
    publicEmail: "post@filadelfia.no",
    avatarUrl: "https://images.unsplash.com/photo-astrid",
    consentToPublishGivenAt: "2026-01-16T11:00:00Z",
    consentGivenBy: "admin-system",
  },
  {
    id: "fb-barneleder-consented",
    name: "Berit Barnekirke",
    phone: "333 44 555",
    email: "privat.berit@eksempel.no",
    globalRole: "member",
    isStaff: true,
    staffRole: "Leder for Barnekirken",
    staffCategory: "barneleder",
    staffBio: "Skaper trygge og morsomme samlinger for barna på søndager.",
    isPublicProfile: true,
    publicEmail: "barn@filadelfia.no",
    avatarUrl: "https://images.unsplash.com/photo-berit",
    consentToPublishGivenAt: "2026-02-01T09:00:00Z",
    consentGivenBy: "admin-system",
  },
  {
    id: "fb-diakoni-consented",
    name: "Daniel Diakon",
    phone: "444 55 666",
    email: "privat.daniel@eksempel.no",
    globalRole: "member",
    isStaff: true,
    staffRole: "Diakon & Omsorgsarbeider",
    staffCategory: "diakoni",
    staffBio: "Besøkstjeneste og sjelesorg.",
    isPublicProfile: true,
    publicEmail: "diakoni@filadelfia.no",
    consentToPublishGivenAt: "2026-02-10T14:00:00Z",
    consentGivenBy: "admin-system",
  },
  {
    id: "fb-stab-noconsent",
    name: "Uregistrert Medarbeider",
    phone: "555 66 777",
    email: "hemmelig@eksempel.no",
    globalRole: "member",
    isStaff: true,
    staffRole: "Ungdomsarbeider",
    staffCategory: "barneleder",
    // Mangler isPublicProfile og consentToPublishGivenAt (GDPR-vern)
    isPublicProfile: false,
  },
  {
    id: "fb-lederskap-leder",
    name: "Sigurd Styreleder",
    phone: "666 77 888",
    email: "sigurd.privat@eksempel.no",
    globalRole: "member",
    isStaff: false, // Ikke ansatt, men valgt leder i menighetsrådet
    isPublicProfile: true,
    publicTitle: "Menighetsrådsleder",
    publicEmail: "styreleder@filadelfia.no",
    consentToPublishGivenAt: "2026-01-20T12:00:00Z",
    consentGivenBy: "admin-system",
  },
  {
    id: "fb-lederskap-medlem-noconsent",
    name: "Lars Lovsangsleder UtenSamtykke",
    phone: "777 88 999",
    email: "lars.privat@eksempel.no",
    globalRole: "member",
    isStaff: false,
    // Ikke samtykke
    isPublicProfile: false,
  },
];

const mockFirebaseGroups: Group[] = [
  {
    id: "grp-lederskap-1",
    name: "Menighetsråd & Lederskap",
    category: "ledergruppe",
    isPublic: true,
    leaderIds: ["fb-lederskap-leder"],
    deputyLeaderIds: ["fb-pastor-1"],
    memberIds: ["fb-lederskap-leder", "fb-pastor-1", "fb-lederskap-medlem-noconsent"],
  },
];

describe("Firebase Integrasjon: Henting og kategoribasert filtrering av Stab og Lederskap", () => {
  test("Markdown-parsing gjenkjenner kategori-filtere i personblokker", () => {
    const stabBlock = parseCmsContent(":::personer[stab]");
    expect(stabBlock[0]).toEqual({ type: "person-grid", filter: "stab" });

    const pastorBlock = parseCmsContent(":::personer[pastor]");
    expect(pastorBlock[0]).toEqual({ type: "person-grid", filter: "pastor" });

    const kategoriBlock = parseCmsContent(":::personer[kategori=diakoni]");
    expect(kategoriBlock[0]).toEqual({ type: "person-grid", filter: "kategori=diakoni" });

    const lederskapBlock = parseCmsContent(":::personer[lederskap]");
    expect(lederskapBlock[0]).toEqual({ type: "person-grid", filter: "lederskap" });
  });

  test("Filtrering på kategori 'stab': henter kun ansatte fra Firebase med gyldig samtykke", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[stab]" />
      </MemoryRouter>
    );

    // Skal vise godkjente ansatte
    expect(screen.getByText("Johannes Prest")).toBeDefined();
    expect(screen.getByText("Astrid Administrasjon")).toBeDefined();
    expect(screen.getByText("Berit Barnekirke")).toBeDefined();
    expect(screen.getByText("Daniel Diakon")).toBeDefined();

    // Stillinger / roller fra Firebase
    expect(screen.getByText("Hovedpastor & Daglig leder")).toBeDefined();
    expect(screen.getByText("Administrasjonsleder & Økonomi")).toBeDefined();
    expect(screen.getByText("Leder for Barnekirken")).toBeDefined();
    expect(screen.getByText("Diakon & Omsorgsarbeider")).toBeDefined();

    // Skal IKKE vise ansatt uten registrert samtykke (GDPR-vern)
    expect(screen.queryByText("Uregistrert Medarbeider")).toBeNull();

    // Skal IKKE vise ikke-ansatte i vanlig stabsvisning (Sigurd er kun menighetsråd, ikke stab)
    expect(screen.queryByText("Sigurd Styreleder")).toBeNull();
  });

  test("Filtrering på kategori 'pastor': henter kun pastorer fra Firebase og ekskluderer annen stab", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[pastor]" />
      </MemoryRouter>
    );

    // Johannes Prest er pastor i Firebase
    expect(screen.getByText("Johannes Prest")).toBeDefined();
    expect(screen.getByText("Hovedpastor & Daglig leder")).toBeDefined();

    // Andre stabsmedlemmer skal IKKE være med i ren pastor-visning
    expect(screen.queryByText("Astrid Administrasjon")).toBeNull();
    expect(screen.queryByText("Berit Barnekirke")).toBeNull();
    expect(screen.queryByText("Daniel Diakon")).toBeNull();
    expect(screen.queryByText("Sigurd Styreleder")).toBeNull();
  });

  test("Filtrering på eksplisitt kategori 'kategori=diakoni' henter kun diakonalt ansatte", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[kategori=diakoni]" />
      </MemoryRouter>
    );

    expect(screen.getByText("Daniel Diakon")).toBeDefined();
    expect(screen.getByText("Diakon & Omsorgsarbeider")).toBeDefined();

    expect(screen.queryByText("Johannes Prest")).toBeNull();
    expect(screen.queryByText("Astrid Administrasjon")).toBeNull();
  });

  test("Filtrering på eksplisitt kategori 'kategori=barneleder' henter kun barne- og ungdomsansatte med samtykke", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[kategori=barneleder]" />
      </MemoryRouter>
    );

    // Berit har samtykke og kategori 'barneleder'
    expect(screen.getByText("Berit Barnekirke")).toBeDefined();
    expect(screen.getByText("Leder for Barnekirken")).toBeDefined();

    // Uregistrert Medarbeider har kategori 'barneleder', men mangler samtykke
    expect(screen.queryByText("Uregistrert Medarbeider")).toBeNull();
    expect(screen.queryByText("Johannes Prest")).toBeNull();
  });

  test("Filtrering på kategori 'lederskap': slår opp i Firebase ledergruppe og tildeler korrekte roller", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[lederskap]" />
      </MemoryRouter>
    );

    // Sigurd er registrert som leaderId i mockFirebaseGroups
    expect(screen.getByText("Sigurd Styreleder")).toBeDefined();
    expect(screen.getByText(/Leder i menighetsrådet|Menighetsrådsleder/)).toBeDefined();

    // Johannes er deputyLeaderId
    expect(screen.getByText("Johannes Prest")).toBeDefined();

    // Lars er medlem i gruppen, men mangler samtykke -> skal filtreres ut
    expect(screen.queryByText("Lars Lovsangsleder UtenSamtykke")).toBeNull();

    // Astrid og Berit er ikke med i lederskapsgruppen
    expect(screen.queryByText("Astrid Administrasjon")).toBeNull();
    expect(screen.queryByText("Berit Barnekirke")).toBeNull();
  });

  test("Beskytter private kontaktdata fra Firebase og eksponerer kun offentlig definert kontaktinfo", () => {
    currentFirebasePersons = [...mockFirebasePersons];
    currentFirebaseGroups = [...mockFirebaseGroups];

    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[stab]" />
      </MemoryRouter>
    );

    // Offentlig kontaktinfo skal vises
    expect(screen.getByText("pastor@filadelfia.no")).toBeDefined();
    expect(screen.getByText("38 00 11 22")).toBeDefined();

    // Private opplysninger fra Firebase må ALDRI lekke ut i offentlig innholdsblokk
    expect(screen.queryByText("privat.johannes@eksempel.no")).toBeNull();
    expect(screen.queryByText("111 22 333")).toBeNull();
  });

  test("Håndterer tomme data og manglende treff fra Firebase på en elegant måte", () => {
    // Tomme lister i Firebase
    currentFirebasePersons = [];
    currentFirebaseGroups = [];

    const { unmount } = render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[stab]" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ingen stabsmedlemmer med registrert samtykke funnet/i)).toBeDefined();
    unmount();

    // Lederskap uten ledergruppe i Firebase
    render(
      <MemoryRouter>
        <CmsContentRenderer content=":::personer[lederskap]" />
      </MemoryRouter>
    );
    expect(screen.getByText(/Ingen lederskapsgruppe funnet/i)).toBeDefined();
  });
});

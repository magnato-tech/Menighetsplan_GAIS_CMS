import { readFile } from 'node:fs/promises';
import path from 'node:path';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import {
  type GatheringDoc,
  type GroupDoc,
  toPublicGatherings,
  toContractV1,
  toV11,
  toPublicGroups,
  toRecurringEvents,
} from './server/publicApi';
import { markAsPrivate, renderSeoIntoHtml } from './server/pageMeta';
import { CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from './src/data/collections';
import { type CmsNewsArticle, type CmsPage, type CmsSettings, initialCmsSettings } from './src/data/cmsData';
import { isPublicPath } from './src/utils/routes';
import { type SiteContent, resolvePageSeo, seoForPath } from './src/utils/siteSeo';

const app = express();
const port = 3000;

// Initialize Firebase for server-side API proxy
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// CORS for ClaudeCMS and external clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

async function loadGatheringDocs(): Promise<GatheringDoc[]> {
  const snap = await getDocs(collection(db, 'gatherings'));
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return { ...data, id: data.id || docSnap.id };
  });
}

async function loadGroupDocs(): Promise<GroupDoc[]> {
  const snap = await getDocs(collection(db, 'groups'));
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return { ...data, id: data.id || docSnap.id };
  });
}

function parseDateQuery(value: unknown): number | null {
  if (typeof value !== 'string' || !value) return null;
  const time = new Date(value).getTime();
  return isNaN(time) ? null : time;
}

/**
 * Official endpoint matching ClaudeCMS INTEGRASJON-MENIGHETSPLAN.md Contract v1:
 * GET /api/offentlig/arrangementer?fra=...&til=...
 */
app.get('/api/offentlig/arrangementer', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const items = toPublicGatherings(await loadGatheringDocs(), {
      excludeGroupGatherings: true, // gruppesamling er aldri offentlig iflg. kontrakt
      from: parseDateQuery(req.query.fra),
      to: parseDateQuery(req.query.til),
    }).map((item) => toContractV1(item, now));

    res.header('Cache-Control', 'public, max-age=300');
    res.json({
      versjon: 1,
      kilde: 'menighetsplan',
      generert: now.toISOString(),
      tidssone: 'Europe/Oslo',
      arrangementer: items,
    });
  } catch (err: any) {
    console.error('Error fetching /api/offentlig/arrangementer:', err);
    res.status(500).json({ error: 'Kunne ikke hente arrangementer', message: err.message });
  }
});

/**
 * Public JSON API: Gatherings (with embedded recurring and groups for simplicity)
 */
app.get('/api/public/gatherings', async (_req: Request, res: Response) => {
  try {
    const [gatheringDocs, groupDocs] = await Promise.all([loadGatheringDocs(), loadGroupDocs()]);
    const items = toPublicGatherings(gatheringDocs).map(toV11);
    const groups = toPublicGroups(groupDocs);
    const recurringEvents = toRecurringEvents(groupDocs);

    res.json({
      versjon: '1.1',
      status: 'ok',
      kilde: 'Menighetsplan Firestore API',
      generert: new Date().toISOString(),
      antall: items.length,
      arrangementer: items,
      gatherings: items,
      grupper: groups,
      groups: groups,
      gjentagende_eventer: recurringEvents,
      recurringEvents: recurringEvents,
    });
  } catch (err: any) {
    console.error('Error fetching public gatherings for CMS:', err);
    res.status(500).json({
      error: 'Kunne ikke hente arrangementer fra Menighetsplan',
      message: err.message || 'Ukjent feil',
    });
  }
});

/**
 * Dedicated Public JSON API: Groups (Husfellesskap, Tjenestegrupper osv.)
 */
app.get('/api/public/groups', async (_req: Request, res: Response) => {
  try {
    const groups = toPublicGroups(await loadGroupDocs());
    res.json({
      versjon: '1.1',
      status: 'ok',
      generert: new Date().toISOString(),
      antall: groups.length,
      grupper: groups,
      groups: groups,
    });
  } catch (err: any) {
    console.error('Error fetching public groups for CMS:', err);
    res.status(500).json({ error: 'Kunne ikke hente grupper', message: err.message });
  }
});

/**
 * Dedicated Public JSON API: Recurring Events (faste møtetider, gudstjenester, husfellesskap)
 */
app.get('/api/public/recurring', async (_req: Request, res: Response) => {
  try {
    const recurringEvents = toRecurringEvents(await loadGroupDocs());
    res.json({
      versjon: '1.1',
      status: 'ok',
      generert: new Date().toISOString(),
      antall: recurringEvents.length,
      gjentagende_eventer: recurringEvents,
      recurringEvents: recurringEvents,
    });
  } catch (err: any) {
    console.error('Error fetching recurring events for CMS:', err);
    res.status(500).json({ error: 'Kunne ikke hente gjentagende eventer', message: err.message });
  }
});

/**
 * All-in-one endpoint
 */
app.get('/api/public/all', async (_req: Request, res: Response) => {
  try {
    const [gatheringDocs, groupDocs] = await Promise.all([loadGatheringDocs(), loadGroupDocs()]);
    res.json({
      versjon: '1.1',
      status: 'ok',
      generert: new Date().toISOString(),
      arrangementer: toPublicGatherings(gatheringDocs).map(toV11),
      grupper: toPublicGroups(groupDocs),
      gjentagende_eventer: toRecurringEvents(groupDocs),
    });
  } catch (err: any) {
    console.error('Error fetching all public data for CMS:', err);
    res.status(500).json({ error: 'Kunne ikke hente data', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Page titles and share cards
// ---------------------------------------------------------------------------
// A service that previews a shared link reads the HTML as it is sent and never runs the
// app. The server therefore writes each page's title, description and image into
// index.html. What they are is decided in src/utils/siteSeo.ts, which the browser uses too.

const SITE_CONTENT_MAX_AGE_MS = 60_000;
const FIRST_READ_WAIT_MS = 1_500;

let siteContent: SiteContent | null = null;
let siteContentReadAt = 0;
let siteContentRead: Promise<void> | null = null;

async function readSiteContent(): Promise<SiteContent> {
  const [pages, news, settings] = await Promise.all([
    getDocs(collection(db, CMS_COLLECTIONS.PAGES)),
    getDocs(collection(db, CMS_COLLECTIONS.NEWS)),
    // The settings may be missing or unreadable; the app then shows its defaults, and so do we
    getDoc(doc(db, CMS_COLLECTIONS.SETTINGS, CMS_SETTINGS_DOC_ID)).catch(() => null),
  ]);
  return {
    pages: pages.docs.map((d) => d.data() as CmsPage),
    news: news.docs.map((d) => d.data() as CmsNewsArticle),
    settings: settings?.exists() ? (settings.data() as CmsSettings) : initialCmsSettings,
  };
}

function refreshSiteContent(): Promise<void> {
  siteContentRead ??= readSiteContent()
    .then((content) => {
      siteContent = content;
    })
    .catch((err) => {
      // What was read last, if anything, keeps being used
      console.error('Could not read the site content for page titles:', err);
    })
    .finally(() => {
      siteContentReadAt = Date.now();
      siteContentRead = null;
    });
  return siteContentRead;
}

/**
 * The pages, articles and settings as last read, refreshed in the background once a minute.
 * A page is never held back by the database: only the very first read is waited for, briefly.
 */
async function currentSiteContent(): Promise<SiteContent | null> {
  if (Date.now() - siteContentReadAt > SITE_CONTENT_MAX_AGE_MS) {
    const reading = refreshSiteContent();
    if (!siteContent) {
      await Promise.race([reading, new Promise((resolve) => setTimeout(resolve, FIRST_READ_WAIT_MS))]);
    }
  }
  return siteContent;
}

/** The address the site is reached at, for canonical links and share images. */
function originOf(req: Request): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const protocol = String(req.headers['x-forwarded-proto'] ?? req.protocol).split(',')[0].trim();
  return `${protocol}://${req.get('host') ?? `localhost:${port}`}`;
}

async function sendApp(req: Request, res: Response) {
  // A file that does not exist is a missing file, not the app
  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }

  const html = await readFile(path.join('dist', 'index.html'), 'utf8');
  // The page itself is small and names the current script files, so it is always fetched anew
  res.set('Cache-Control', 'no-cache');

  if (!isPublicPath(req.path)) {
    res.type('html').send(markAsPrivate(html));
    return;
  }

  const site = await currentSiteContent();
  const config = site ? seoForPath(req.path, site) : null;
  if (!config) {
    res.type('html').send(html);
    return;
  }

  const seo = resolvePageSeo(config, originOf(req), req.path);
  res
    .status(seo.notFound ? 404 : 200)
    .type('html')
    .send(renderSeoIntoHtml(html, seo));
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // index.html goes through sendApp, also for the front page
    app.use(express.static('dist', { index: false }));
    app.get('*', (req: Request, res: Response) => {
      sendApp(req, res).catch((err) => {
        console.error('Could not send the app:', err);
        res.status(500).send('Noe gikk galt. Prøv igjen om litt.');
      });
    });
    void refreshSiteContent();
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Menighetsplan server running on port ${port}`);
  });
}

startServer();

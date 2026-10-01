import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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
app.get('/api/public/gatherings', async (req: Request, res: Response) => {
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
app.get('/api/public/groups', async (req: Request, res: Response) => {
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
app.get('/api/public/recurring', async (req: Request, res: Response) => {
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
app.get('/api/public/all', async (req: Request, res: Response) => {
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

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
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

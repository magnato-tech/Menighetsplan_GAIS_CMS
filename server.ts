import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

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

/**
 * Helper to fetch and normalize gatherings
 */
async function fetchPublicGatherings() {
  const snap = await getDocs(collection(db, 'gatherings'));
  const items: any[] = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.isPublic === false) return;

    const title = data.title || 'Samling';
    const isWorship = Boolean(
      data.type === 'worship_service' ||
      title.toLowerCase().includes('gudstjeneste')
    );

    const categories: string[] = [];
    if (isWorship) categories.push('gudstjeneste');
    if (data.type && data.type !== 'worship_service') categories.push(data.type);
    if (title.toLowerCase().includes('ungdom')) categories.push('ungdom');
    if (title.toLowerCase().includes('barn') || title.toLowerCase().includes('familie')) categories.push('barn og unge');
    if (title.toLowerCase().includes('husfellesskap') || title.toLowerCase().includes('gruppe')) categories.push('smågrupper');
    if (title.toLowerCase().includes('kaffe') || title.toLowerCase().includes('lunsj') || title.toLowerCase().includes('måltid')) categories.push('fellesskap');

    items.push({
      uid: data.id || docSnap.id,
      id: data.id || docSnap.id,
      groupId: data.groupId || '',
      tittel: title,
      title: title,
      start: data.startsAt || data.date || '',
      slutt: data.endsAt || '',
      sted: data.location || 'Kirkesalen',
      location: data.location || 'Kirkesalen',
      beskrivelse: data.description || '',
      tema: data.theme || '',
      kategorier: categories.length > 0 ? categories : ['samling'],
      erGudstjeneste: isWorship,
      erAvlyst: Boolean(data.cancelled),
      cancelled: Boolean(data.cancelled),
    });
  });

  items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return items;
}

/**
 * Helper to fetch public groups and recurring schedules
 */
async function fetchPublicGroupsAndRecurring() {
  const snap = await getDocs(collection(db, 'groups'));
  const groups: any[] = [];
  const recurringEvents: any[] = [];

  // Default recurring events for church life if not in DB
  recurringEvents.push({
    id: 'recurring-gudstjeneste',
    tittel: 'Søndagsgudstjeneste & kirkekaffe',
    ukedag: 'Søndag',
    klokkeslett: '11:00',
    frekvens: 'hver uke',
    sted: 'Hovedsalen og kafeen',
    kategori: 'gudstjeneste',
    beskrivelse: 'Felles gudstjeneste for hele familien med barnekirke/søndagsskole og påfølgende kirkekaffe.',
  });

  recurringEvents.push({
    id: 'recurring-ungdom',
    tittel: 'Ungdomskveld & lovsang',
    ukedag: 'Fredag',
    klokkeslett: '19:00',
    frekvens: 'annenhver uke',
    sted: 'Ungdomssalen',
    kategori: 'ungdom',
    beskrivelse: 'Sosialt samvær, kiosk, lovsang og fellesskap for ungdom fra 8. klasse og oppover.',
  });

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    // Do not expose internal member lists or phone numbers
    const category = data.category || 'gruppe';
    const groupName = data.name || 'Gruppe';

    const groupObj = {
      id: data.id || docSnap.id,
      navn: groupName,
      name: groupName,
      kategori: category,
      category: category,
      moteplan: data.meetingSchedule || null,
      meetingSchedule: data.meetingSchedule || null,
      antallMedlemmer: Array.isArray(data.memberIds) ? data.memberIds.length : undefined,
    };
    groups.push(groupObj);

    // If group has meeting schedule, register it as a recurring event
    if (data.meetingSchedule && data.meetingSchedule.weekday) {
      recurringEvents.push({
        id: `recurring-group-${data.id || docSnap.id}`,
        groupId: data.id || docSnap.id,
        tittel: groupName,
        ukedag: data.meetingSchedule.weekday,
        klokkeslett: data.meetingSchedule.time || '19:00',
        frekvens: data.meetingSchedule.frequency || 'annenhver uke',
        sted: category === 'husgruppe' ? 'Hjemmene' : 'Kirken',
        kategori: category,
        beskrivelse: `Faste samlinger for ${groupName} (${data.meetingSchedule.frequency}).`,
      });
    }
  });

  return { groups, recurringEvents };
}

/**
 * Official endpoint matching ClaudeCMS INTEGRASJON-MENIGHETSPLAN.md Contract v1:
 * GET /api/offentlig/arrangementer?fra=...&til=...
 */
app.get('/api/offentlig/arrangementer', async (req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(db, 'gatherings'));
    const items: any[] = [];
    const fraQuery = req.query.fra ? new Date(req.query.fra as string).getTime() : null;
    const tilQuery = req.query.til ? new Date(req.query.til as string).getTime() : null;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.isPublic === false) return;
      if (data.type === 'gruppesamling') return; // gruppesamling er aldri offentlig iflg. kontrakt

      const title = data.title || 'Gudstjeneste';
      const isWorship = Boolean(
        data.kind === 'gudstjeneste' ||
        data.type === 'worship_service' ||
        title.toLowerCase().includes('gudstjeneste')
      );

      const startDate = data.startsAt ? new Date(data.startsAt) : new Date();
      const startTime = startDate.getTime();

      if (fraQuery && startTime < fraQuery) return;
      if (tilQuery && startTime > tilQuery) return;

      const endDate = data.endsAt
        ? new Date(data.endsAt)
        : new Date(startDate.getTime() + 90 * 60 * 1000); // 90 min fallback

      // Oslo ISO formatter with timezone offset
      const toOsloIso = (d: Date) => {
        try {
          const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Oslo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }).formatToParts(d);
          const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
          // Determine DST for Europe/Oslo (UTC+2 in summer, UTC+1 in winter)
          const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
          const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
          const isDst = Math.min(jan, jul) === d.getTimezoneOffset();
          const offset = isDst ? '+02:00' : '+01:00';
          return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offset}`;
        } catch {
          return d.toISOString();
        }
      };

      const categories: string[] = [];
      if (isWorship) categories.push('gudstjeneste');
      if (title.toLowerCase().includes('ungdom')) categories.push('ungdom');
      if (title.toLowerCase().includes('barn') || title.toLowerCase().includes('familie')) categories.push('barn og unge');

      items.push({
        id: data.id || docSnap.id,
        type: isWorship ? 'gudstjeneste' : 'arrangement',
        tittel: title,
        tema: data.theme || '',
        bibeltekst: data.bibleText || '',
        beskrivelse: data.publicDescription || data.description || '',
        start: toOsloIso(startDate),
        slutt: toOsloIso(endDate),
        heldag: Boolean(data.allDay),
        sted: data.location || 'Lillesand Misjonskirke',
        status: data.cancelled ? 'avlyst' : 'planlagt',
        tagger: categories,
        sistEndret: data.updatedAt || new Date().toISOString(),
      });
    });

    items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    res.header('Cache-Control', 'public, max-age=300');
    res.json({
      versjon: 1,
      kilde: 'menighetsplan',
      generert: new Date().toISOString(),
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
    const items = await fetchPublicGatherings();
    const { groups, recurringEvents } = await fetchPublicGroupsAndRecurring();

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
    const { groups } = await fetchPublicGroupsAndRecurring();
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
    const { recurringEvents } = await fetchPublicGroupsAndRecurring();
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
    const items = await fetchPublicGatherings();
    const { groups, recurringEvents } = await fetchPublicGroupsAndRecurring();
    res.json({
      versjon: '1.1',
      status: 'ok',
      generert: new Date().toISOString(),
      arrangementer: items,
      grupper: groups,
      gjentagende_eventer: recurringEvents,
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

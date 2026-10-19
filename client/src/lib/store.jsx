import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, setToken, getToken, ApiDown } from './api.js';
import { nowMs } from './time.js';
import seedEvents from '../data/events.json';
import seedVenues from '../data/venues.json';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

// Events work without a server (bundled copy) so the site can be previewed on its own.
const offlineEvents = seedEvents.map((e) => ({ ...e, _id: e.slug, registrationCount: 0 }));

export function Provider({ children }) {
  const [events, setEvents] = useState(offlineEvents);
  const [venues, setVenues] = useState(seedVenues);
  const [demo, setDemo] = useState(false);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [ev, ve] = await Promise.all([api('/events'), api('/events/venues')]);
      if (ev.length) { setEvents(ev); setDemo(false); }
      if (ve.length) setVenues(ve);
    } catch (e) { if (e instanceof ApiDown) setDemo(true); }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      if (getToken()) { try { setUser((await api('/auth/me')).user); } catch { setToken(null); } }
      setReady(true);
    })();
  }, [refresh]);

  // The clock re-renders consumers every 15s so live/upcoming labels stay current.
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  const now = useMemo(() => new Date(nowMs()), [tick, events]); // eslint-disable-line

  const auth = async (path, body) => {
    const endpoint = path === 'signup' ? 'register' : path;
    const r = await api(`/auth/${endpoint}`, { method: 'POST', body });
    setToken(r.token); setUser(r.user); return r.user;
  };
  const logout = () => { setToken(null); setUser(null); };

  return <Ctx.Provider value={{ events, venues, demo, user, setUser, ready, now, refresh, auth, logout, bump: () => setTick((n) => n + 1) }}>{children}</Ctx.Provider>;
}

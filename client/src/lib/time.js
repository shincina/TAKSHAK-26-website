// All fest times are Indian Standard Time.
const TZ = 'Asia/Kolkata';
const OFFSET_KEY = 'tk-clock-offset';

export const getOffset = () => Number(localStorage.getItem(OFFSET_KEY) || 0);
export const setClockTo = (iso) => {
  if (!iso) localStorage.removeItem(OFFSET_KEY);
  else localStorage.setItem(OFFSET_KEY, String(new Date(iso).getTime() - Date.now()));
};
export const nowMs = () => Date.now() + getOffset();

export const sessionsOf = (e) => (e.sessions || []).map((s) => ({ start: new Date(s.start), end: new Date(s.end) }))
  .sort((a, b) => a.start - b.start);

export function statusAt(e, now) {
  const ss = sessionsOf(e);
  if (!ss.length) return 'upcoming';
  if (ss.some((s) => now >= s.start && now <= s.end)) return 'live';
  if (now < ss[0].start || ss.some((s) => s.start > now)) return 'upcoming';
  return 'past';
}

export const nextSession = (e, now) => {
  const ss = sessionsOf(e);
  return ss.find((s) => s.end >= now) || ss[ss.length - 1];
};

export const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).replace(' am', ' AM').replace(' pm', ' PM');
export const fmtDay = (d, opts = { day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('en-IN', { ...opts, timeZone: TZ });
export const fmtWeekday = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', timeZone: TZ });

export function whenText(e) {
  const ss = sessionsOf(e);
  if (!ss.length) return 'Date to be announced';
  const first = ss[0];
  const days = [...new Set(ss.map((s) => dayKey(s.start)))];
  if (e.timeNote && /announced/i.test(e.timeNote)) return `${fmtDay(first.start)} · time to be announced`;
  if (days.length > 1) return `${fmtDay(first.start)} & ${fmtDay(ss[ss.length - 1].start)} · ${e.timeNote || 'Full day'}`;
  if (ss.length > 1) return `${fmtDay(first.start)} · two stages`;
  return `${fmtDay(first.start)} · ${fmtTime(first.start)} – ${fmtTime(first.end)}`;
}

export const countdown = (target, now) => {
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60);
  return { d, h, m, s: s - m * 60 };
};

export const PRESETS = [
  { label: 'Live clock', iso: null },
  { label: '24 Sep · 6:30 PM', iso: '2026-09-24T18:30:00+05:30' },
  { label: '25 Sep · 10:30 AM', iso: '2026-09-25T10:30:00+05:30' },
  { label: '25 Sep · 2:15 PM', iso: '2026-09-25T14:15:00+05:30' },
  { label: '26 Sep · 1:30 PM', iso: '2026-09-26T13:30:00+05:30' },
];

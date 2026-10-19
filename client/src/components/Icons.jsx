const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const Icon = ({ name }) => {
  const d = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    workshop: <><path d="M14 4l6 6-9 9H5v-6z" /><path d="M12 6l6 6" /></>,
    competition: <><path d="M7 4h10v5a5 5 0 01-10 0z" /><path d="M7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 21h8" /></>,
    map: <><path d="M12 21s7-6 7-11a7 7 0 00-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    events: <><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></>,
    gallery: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="M21 15l-5-5L5 20" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  }[name];
  return <svg viewBox="0 0 24 24" {...P} aria-hidden="true">{d}</svg>;
};

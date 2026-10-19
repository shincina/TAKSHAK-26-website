// Match an event's venue text to a pin on the campus map (case-insensitive, via label, key or aliases)
export function findVenue(venues, text) {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  return venues.find((v) => v.label.toLowerCase() === t || v.key === t || (v.aliases || []).some((a) => a.toLowerCase() === t)) || null;
}

export const BLOCKS = [
  { name: "Founders' Block", x: 60, y: 60, w: 300, h: 120 }, { name: 'M Block', x: 400, y: 60, w: 220, h: 125 },
  { name: 'L Block', x: 660, y: 60, w: 290, h: 125 }, { name: 'ECE Block', x: 60, y: 235, w: 220, h: 110 },
  { name: 'MCA Block', x: 320, y: 235, w: 230, h: 110 }, { name: 'CSE Block', x: 590, y: 235, w: 200, h: 110 },
  { name: 'Civil Block', x: 820, y: 235, w: 140, h: 110 }, { name: 'Seminar Complex', x: 60, y: 395, w: 300, h: 100 },
  { name: 'Sports Courts', x: 640, y: 395, w: 230, h: 90 }, { name: 'Open arena', x: 840, y: 495, w: 130, h: 70 },
  { name: "Principal's Parking Lot", x: 400, y: 535, w: 230, h: 80 },
];

// Official campus point (10°03'12.2"N 76°37'09.5"E). Venues without saved coordinates fall back to their old schematic position.
export const CAMPUS = [10.053389, 76.619306];
export const venuePos = (v) => [v.lat ?? 10.056 - (v.y ?? 320) / 640 * 0.0038, v.lng ?? 76.6165 + (v.x ?? 500) / 1000 * 0.0055];

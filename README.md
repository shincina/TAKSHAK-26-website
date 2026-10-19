# TAKSHAK'26 · Beyond the Neon Horizon

Event tracker for the annual tech fest of Mar Athanasius College of Engineering, Kothamangalam.
React (Vite) + Node/Express + MongoDB.

## Run it

```bash
# 1. API
cd server
cp .env.example .env        # set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                # loads 63 events + campus venues, creates the admin account
npm run dev                 # http://localhost:5000

# 2. Website (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```

For production, build the client (`npm run build`) and set `VITE_API_URL` to your API's address; set `CLIENT_ORIGIN` on the server to the website's address. Run `npm run seed` once against the production `MONGODB_URI` to load events and venues.
Without the API running, or if the API has no events yet, the site shows the bundled event list as a read-only preview.

## What is where

| Area | Files |
|---|---|
| Intro (logo fill + electric aura) | `client/src/components/Splash.jsx` |
| Theme (colours, fonts, leaf-cut cards) | `client/src/index.css` |
| Tabs: Home, Workshops, Competitions, Map, Events, Profile | `client/src/pages/` |
| Campus map and block layout | `client/src/components/CampusMap.jsx`, `client/src/lib/venues.js` |
| Live / upcoming / past logic | `client/src/lib/time.js` |
| Tickets (QR) and registration | `TicketModal.jsx`, `RegisterModal.jsx`, `server/routes/registrations.js` |
| Admin panel | `client/src/pages/Admin.jsx` |
| Event data parsed from the WhatsApp chat | `server/data/events.json` (re-seeding never overwrites existing events) |

## Admin
Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, open Profile, then "Admin panel": add or edit events, see participants, download CSV, mark payments, register walk-ins (spot desk), check people in by ticket ID, and move map pins.

## Preview the fest at another time
The fest dates have passed, so everything shows as finished by default. Use "Preview the fest at another time" in the footer to set the clock to a fest day and see Live / Upcoming states and the map pulse.

## Motion effects (client/src/components/Fx.jsx, Aura.jsx)
Smooth scrolling (Lenis), a neon particle field that streaks as you scroll, a cursor ring with spark trail and magnetic buttons, a scroll progress bar, scroll-reveal with stagger, text-decode headings, 3D tilt and glare on cards, marquee tickers, count-up stats, a ticking countdown, a timeline line that draws as you scroll, hero parallax with an electric aura, and a page-change wipe. Everything switches off for visitors who prefer reduced motion.

## Photos, posters and video
- **Gallery:** drop images into `client/src/assets/gallery/`. They appear on the Home page strip and the `/gallery` page automatically. The file name becomes the caption (`04-closing-night.jpg` shows "Closing night"); numbers at the start set the order.
- **Event posters:** put `<event-slug>.jpg` (or .png/.webp) into `client/src/assets/posters/`. `SLUGS.txt` in that folder lists the exact file name for every event. Admins can also paste a poster link when editing an event.
- **Preview video:** `client/public/takshak_preview.mp4` (poster frame: `preview-poster.jpg`). Replace the files to change it.

## Real campus map
- The Map tab uses Leaflet with three base maps (Neon, Satellite, Street) centred on the official campus point (10°03'12.2"N 76°37'09.5"E) and limited to the campus area.
- Every venue with events gets a teardrop pin whose round "eye" is the event poster (the emblem is used until a poster exists). Live events pulse; a number badge shows when a venue hosts several events, and its posters take turns in the pin.
- Clicking a pin flies to it and opens a floating box with the posters, times, fees and a "Details and register" button; close it with the × button, the Esc key, or by clicking the map. On phones it becomes a bottom sheet.
- **Placing the pins exactly:** the venue positions are first estimates. Log in as admin, open Admin panel, Map pins, choose a venue, switch to Satellite and click the building. It saves immediately. Run `npm run seed` once in `server` so existing venues receive their starting coordinates.
- Tiles come from CARTO, Esri and OpenStreetMap, which are fine for a college fest. For heavy traffic, use your own tile provider key.

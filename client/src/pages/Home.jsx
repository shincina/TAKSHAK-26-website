import { Link } from 'react-router-dom';
import { useMemo, useRef } from 'react';
import { useStore } from '../lib/store.jsx';
import { statusAt, sessionsOf, countdown, fmtDay } from '../lib/time.js';
import EventCard from '../components/EventCard.jsx';
import Timeline from '../components/Timeline.jsx';
import Aura from '../components/Aura.jsx';
import { Reveal, Scramble, CountUp, Marquee, Digit } from '../components/Fx.jsx';
import VideoPreview from '../components/VideoPreview.jsx';
import GalleryStrip from '../components/GalleryStrip.jsx';

const HIGHLIGHTS = ['Startup Expo & Competition', 'Drone-Building Workshop', 'Drone Race', 'Mountain Biking Challenge', 'Motochondria – RC Car Racing', 'Vortex – Valorant Tournament', 'Hack & Slash – Coding Competition', 'Spaghetti Bridge Contest', 'Future Frames – Digital Art Contest', 'Best Manager Competition'];
const split = (t) => t.split('').map((c, i) => <span key={i} className="ch" style={{ '--i': i }}>{c}</span>);
const eventKey = (e, i) => `${e.slug || e._id || e.title || 'event'}-${i}`;
const goto = (id) => (e) => { e.preventDefault(); const el = document.getElementById(id); window.__lenis ? window.__lenis.scrollTo(el, { offset: -70 }) : el.scrollIntoView({ behavior: 'smooth' }); };

export default function Home() {
  const { events, now, demo } = useStore();
  const hero = useRef(null);
  const info = useMemo(() => {
    const all = events.flatMap((e) => sessionsOf(e));
    const first = new Date(Math.min(...all.map((s) => s.start))), last = new Date(Math.max(...all.map((s) => s.end)));
    const st = events.map((e) => ({ e, s: statusAt(e, now) }));
    return {
      first, last, live: st.filter((x) => x.s === 'live').map((x) => x.e),
      upcoming: st.filter((x) => x.s === 'upcoming').map((x) => x.e).sort((a, b) => (sessionsOf(a)[0]?.start?.getTime() ?? Infinity) - (sessionsOf(b)[0]?.start?.getTime() ?? Infinity)),
      past: st.filter((x) => x.s === 'past').map((x) => x.e).sort((a, b) => (sessionsOf(b).at(-1)?.end?.getTime() ?? -Infinity) - (sessionsOf(a).at(-1)?.end?.getTime() ?? -Infinity)),
    };
  }, [events, now]);
  const spot = info.upcoming.concat(info.live).filter((e) => e.spotRegistration);
  const cd = countdown(info.first, now);
  const by = (c) => events.filter((e) => e.category === c);
  const highlights = [...new Set([...HIGHLIGHTS, ...events.map((e) => e.title).filter(Boolean)])].slice(0, 24);
  const move = (e) => { const r = hero.current.getBoundingClientRect(); hero.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); hero.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); };

  const SECTORS = [['/workshops', 'Workshops', 'workshop', 'Learn by building, with mentors and speakers.'], ['/competitions', 'Competitions', 'competition', 'Compete for prize pools and bragging rights.'], ['/events', 'Events', 'event', 'Talks, showcases and the fun side of the fest.']];

  return (
    <>
      {demo && <div className="banner">You're viewing the bundled event list. Start the API server to enable sign-in, registration and tickets.</div>}
      <section className="hero" ref={hero} onPointerMove={move}>
        <div className="hero-copy">
          <div className="hud"><span className="blink" /> Transmission received · MACE Kothamangalam</div>
          <h1 aria-label="TAKSHAK'26"><span aria-hidden="true">{split("TAKSHAK'26")}</span><em>Beyond the neon horizon</em></h1>
          <p>The annual technical fest of Mar Athanasius College of Engineering. Workshops, competitions, talks and a campus buzzing from morning to night. Find what is on, register, and carry your ticket in your pocket.</p>
          {now < info.first ? (
            <div><div className="mute">Doors open {fmtDay(info.first, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div className="count">{[['d', 'days'], ['h', 'hours'], ['m', 'min'], ['s', 'sec']].map(([k, l]) => <div key={k}><Digit v={cd[k]} /><span>{l}</span></div>)}</div></div>
          ) : now <= info.last ? (
            <div className="row"><span className="badge live">The fest is on</span><span>{info.live.length} event{info.live.length === 1 ? '' : 's'} live right now</span></div>
          ) : <div className="mute">The fest has wrapped up. Browse what happened below.</div>}
          <div className="cta" style={{ marginTop: 20 }}>
            <a className="btn primary" href="#schedule" onClick={goto('schedule')}>See the schedule</a>
            <Link className="btn ghost" to="/map">Open campus map</Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="sun-disc" />
          <svg className="orbit o1" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" /></svg>
          <svg className="orbit o2" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="84" /></svg>
          <div className="logo-wrap"><Aura intensity={0.55} ringScale={0.5} /><img src="/logo-emblem.png" alt="TAKSHAK'26 emblem" /></div>
        </div>
      </section>

      <div className="marqs">
        <Marquee items={['Workshops', 'Competitions', 'Beyond the neon horizon', 'Talks', "TAKSHAK'26", 'Spot registration', 'Live map']} outline />
        <Marquee items={events.slice(0, 18).map((e) => e.title)} reverse />
      </div>

      <section className="block">
        <div className="sec-head"><Scramble text="Fest preview" /></div>
        <Reveal variant="zoom"><VideoPreview /></Reveal>
      </section>

      <section className="block">
        <div className="stats">
          {[[events.length, 'events listed'], [by('workshop').length, 'workshops'], [by('competition').length, 'competitions'], [events.filter((e) => e.spotRegistration).length, 'with spot registration']].map(([n, l], i) => (
            <Reveal key={l} delay={i * 80} variant="zoom"><div className="stat"><b><CountUp to={n} /></b>{l}</div></Reveal>))}
        </div>
      </section>

      <section className="block">
        <div className="sec-head"><Scramble text="Choose your sector" /></div>
        <div className="sectors">
          {SECTORS.map(([to, name, cat, blurb], i) => (
            <Reveal key={to} delay={i * 110} variant="up"><Link to={to} className={`sector ${cat}`}>
              <span className="sector-n"><CountUp to={by(cat).length} /></span>
              <h3>{name}</h3><p>{blurb}</p><span className="sector-go">Explore</span>
            </Link></Reveal>))}
        </div>
      </section>

      

      <section className="block" id="schedule">
        <div className="sec-head"><Scramble text="Day schedule" /></div>
        <Timeline events={events} />
      </section>

      
      {spot.length > 0 && (<section className="block"><div className="sec-head"><Scramble text="Spot registration open" /></div>
        <p className="mute" style={{ marginBottom: 12 }}>Walk up to the venue and register on the day, no advance form needed.</p><div className="grid">{spot.slice(0, 6).map((e, i) => <EventCard key={eventKey(e, i)} event={e} i={i} />)}</div></section>)}
      

      <section className="block">
        <div className="sec-head"><Scramble text="Gallery" /><Link to="/gallery">Open full gallery</Link></div>
        <GalleryStrip />
      </section>

      <section className="block">
        <div className="sec-head"><Scramble text="What TAKSHAK is" /></div>
        <div className="about-layout">
          <Reveal variant="left"><div>
            <p>TAKSHAK is the three-day annual technical fest of MACE. It draws participants from across the country and turns the campus into a hub of ideas, with technical and cultural events running at several venues at once.</p>
            <p style={{ marginTop: 12 }}>Signature attractions include the Startup Expo and Competition, the Drone-Building Workshop, the Drone Race and the Mountain Biking Challenge, alongside departmental events, competitions and knowledge-sharing sessions.</p>
            <div className="chips" style={{ marginTop: 16 }}>{highlights.map((h) => <span key={h} className="chip">{h}</span>)}</div>
          </div></Reveal>
          <Reveal variant="zoom"><div className="statue"><img src="/about-fest.jpg" alt="The TAKSHAK'26 emblem being unveiled on stage in a cloud of smoke" /></div></Reveal>
        </div>
      </section>

      <section className="block">
        <div className="sec-head"><Scramble text="The official notebook" /></div>
        <div className="notebook-layout">
          <Reveal variant="zoom"><div className="notebook-art"><img src="/notebooks.jpg" alt="TAKSHAK'26 notebooks in two cover designs" /></div></Reveal>
          <Reveal variant="right"><div className="notebook-info">
            <p className="notebook-intro">Take a piece of TAKSHAK'26 with you. Pick from two cover designs, each packed with the fest's visual energy.</p>
            <div className="notebook-highlights">
              <div className="notebook-highlight"><span>Price</span><b>₹45 per book</b><p>A notebook for your ideas, sketches, and plans.</p></div>
              <div className="notebook-highlight"><span>Ticket perk</span><b>Buy 2, get 1 free</b><p>Tickets include redeemable Choco Porch discount coupons, with a buy-two-get-one-free offer on notebooks.</p></div>
            </div>
            <div className="notebook-order">
              <b>Want to order?</b>
              <p className="mute">Contact Jeeva or Aiwin:</p>
              <div className="chips">
                <a className="chip" href="tel:+918848309646">Jeeva · +91 88483 09646</a>
                <a className="chip" href="tel:+918848623101">Aiwin · +91 88486 23101</a>
              </div>
            </div>
          </div></Reveal>
        </div>
      </section>
    </>
  );
}

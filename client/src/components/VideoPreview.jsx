import { useEffect, useRef, useState } from 'react';

// Silent looping preview while on screen; one tap for sound and controls
export default function VideoPreview() {
  const box = useRef(null), vid = useRef(null), [sound, setSound] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([en]) => { const v = vid.current; if (!v || v.controls) return; en.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.35 });
    io.observe(box.current); return () => io.disconnect();
  }, []);
  const listen = () => { const v = vid.current; v.muted = false; v.controls = true; v.loop = false; v.currentTime = 0; v.play(); setSound(true); };
  return (
    <div className="vp" ref={box}>
      <video ref={vid} src="/takshak_preview.mp4" poster="/preview-poster.jpg" muted loop playsInline preload="metadata" onEnded={() => { const v = vid.current; v.controls = false; v.muted = true; v.loop = true; setSound(false); v.play(); }} />
      <i className="vp-c tl" /><i className="vp-c tr" /><i className="vp-c bl" /><i className="vp-c br" />
      <div className="vp-hud"><span className="blink" /> Fest preview</div>
      {!sound && <button className="vp-play" onClick={listen} aria-label="Watch the preview with sound"><span className="vp-ring" /><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg><em>Watch with sound</em></button>}
    </div>
  );
}

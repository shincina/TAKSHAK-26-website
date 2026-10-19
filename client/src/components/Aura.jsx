import { useEffect, useRef } from 'react';

// Electric aura: a pulsing ring with flickering lightning arcs. Draws on a canvas twice the size of its parent so bolts can leave the shape.
export default function Aura({ intensity = 1, ringScale = 0.52 }) {
  const ref = useRef(null), power = useRef(intensity);
  power.current = intensity;
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d'), parent = c.parentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf, bolts = [], last = 0, w = 0, h = 0;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = parent.clientWidth * 2; h = parent.clientHeight * 2; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); const ro = new ResizeObserver(size); ro.observe(parent);
    const make = () => {
      const R = parent.clientHeight * ringScale, n = Math.round(1 + power.current * 7); bolts = [];
      for (let i = 0; i < n; i++) {
        if (Math.random() > 0.65) continue;
        const a = Math.random() * Math.PI * 2, len = R * (0.2 + Math.random() * 0.5), pts = [];
        for (let s = 0; s <= 7; s++) { const aa = a + (s ? (Math.random() - 0.5) * 0.45 : 0), r = R + (len * s) / 7; pts.push([w / 2 + Math.cos(aa) * r, h / 2 + Math.sin(aa) * r]); }
        bolts.push({ pts, hue: Math.random() > 0.5 ? '#ff2bd6' : '#b45cff' });
      }
    };
    const frame = (t) => {
      const p = power.current, R = parent.clientHeight * ringScale, pulse = 0.6 + 0.4 * Math.sin(t / 260);
      ctx.clearRect(0, 0, w, h); ctx.lineCap = ctx.lineJoin = 'round';
      const g = ctx.createRadialGradient(w / 2, h / 2, R * 0.85, w / 2, h / 2, R * 1.7);
      g.addColorStop(0, `rgba(255,43,214,${0.24 * p * pulse})`); g.addColorStop(1, 'rgba(255,43,214,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.7, 0, 7); ctx.fill();
      ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 20; ctx.strokeStyle = `rgba(255,120,235,${0.2 + 0.5 * p})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, R * (1 + 0.015 * pulse), 0, 7); ctx.stroke();
      if (!reduce) {
        if (t - last > 90) { make(); last = t; }
        const flick = 0.55 + Math.random() * 0.45;
        bolts.forEach((b) => {
          ctx.globalAlpha = flick; ctx.shadowBlur = 18; ctx.strokeStyle = b.hue; ctx.lineWidth = 2.2;
          ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.9; ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [ringScale]);
  return <canvas ref={ref} className="aura" aria-hidden="true" />;
}

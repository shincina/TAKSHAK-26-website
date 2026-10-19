// Photos in src/assets/gallery and posters in src/assets/posters are picked up automatically.
const nice = (path) => path.split('/').pop().replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export const gallery = Object.entries(import.meta.glob('../assets/gallery/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' }))
  .sort(([a], [b]) => a.localeCompare(b)).map(([path, src]) => ({ src, caption: nice(path) }));

const posters = {};
Object.entries(import.meta.glob('../assets/posters/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })).forEach(([path, src]) => { posters[path.split('/').pop().replace(/\.[^.]+$/, '')] = src; });
export const posterFor = (e) => e.poster || posters[e.slug] || null;

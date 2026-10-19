const BASE = import.meta.env.VITE_API_URL || '';
export const getToken = () => localStorage.getItem('tk-token');
export const setToken = (t) => (t ? localStorage.setItem('tk-token', t) : localStorage.removeItem('tk-token'));

export class ApiDown extends Error {}

export async function api(path, { method = 'GET', body, raw } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch { throw new ApiDown('The server is not reachable right now.'); }
  if (raw) return res;
  const data = await res.json().catch(() => { throw new ApiDown('The server is not reachable right now.'); });
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

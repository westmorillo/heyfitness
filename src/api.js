const BASE = import.meta.env.VITE_API_URL || '/api';

export function getToken() { return localStorage.getItem('hf_token'); }
export function setToken(t) { localStorage.setItem('hf_token', t); }
export function clearToken() { localStorage.removeItem('hf_token'); }

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Error'), { status: res.status, data });
  return data;
}

export const login = (username, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { username, password } });

export const register = (username, password) =>
  apiFetch('/auth/register', { method: 'POST', body: { username, password } });

export const getMe = () => apiFetch('/me');

export const patchMe = (data) => apiFetch('/me', { method: 'PATCH', body: data });

export const getLog = (date) => apiFetch(`/logs/${date}`);

export const putLog = (date, data) => apiFetch(`/logs/${date}`, { method: 'PUT', body: data });

export const getGoals = () => apiFetch('/goals');

export const putGoals = (data) => apiFetch('/goals', { method: 'PUT', body: data });

export const getFoods = () => apiFetch('/foods');

export const postFood = (food) => apiFetch('/foods', { method: 'POST', body: food });

export const patchFood = (id, food) => apiFetch(`/foods/${id}`, { method: 'PATCH', body: food });

export const deleteFood = (id) => apiFetch(`/foods/${id}`, { method: 'DELETE' });

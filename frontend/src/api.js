const BASE = import.meta.env.VITE_API_URL || '/api';
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  roomTypes: () => request('/room-types'),
  hotelInfo: () => request('/hotel-info'),
  availability: (params) => request('/availability?' + new URLSearchParams(params)),
  createReservation: (body) => request('/reservations', { method: 'POST', body: JSON.stringify(body) }),
  getReservation: (code) => request(`/reservations/${code}`),
  pay: (code, card) => request(`/reservations/${code}/pay`, { method: 'POST', body: JSON.stringify(card) }),
};

export const ticketUrl = (code) => `${BASE}/reservations/${code}/ticket`;

export const imageUrl = (imageName) => {
  if (!imageName) return '';
  if (imageName.startsWith('http')) return imageName;
  return `/images/${imageName}`;
};
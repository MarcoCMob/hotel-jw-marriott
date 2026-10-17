export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const ARRIVAL_TIMES = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
export const DOC_TYPES = ['DNI', 'CE', 'PASAPORTE'];
export const MAX_GUESTS = 6;
export const MAX_NIGHTS = 30;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,16}$/;
const DOC_RE = /^[A-Za-z0-9]{6,15}$/;

export function parseDate(str, label) {
  if (!DATE_RE.test(str || '')) throw new ValidationError(`${label} inválida`);
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new ValidationError(`${label} inválida`);
  }
  return dt;
}

export function todayString() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function validateStay({ checkIn, checkOut, guests }) {
  const a = parseDate(checkIn, 'La fecha de entrada');
  const b = parseDate(checkOut, 'La fecha de salida');
  const nights = Math.round((b - a) / 86400000);
  if (nights < 1) throw new ValidationError('La salida debe ser posterior a la entrada');
  if (nights > MAX_NIGHTS) throw new ValidationError(`La estadía máxima es de ${MAX_NIGHTS} noches`);
  if (checkIn < todayString()) throw new ValidationError('La fecha de entrada no puede ser pasada');
  const g = Number(guests);
  if (!Number.isInteger(g) || g < 1 || g > MAX_GUESTS) {
    throw new ValidationError(`El número de huéspedes debe estar entre 1 y ${MAX_GUESTS}`);
  }
  return { nights, guests: g };
}

export function validateArrivalTime(t) {
  if (!ARRIVAL_TIMES.includes(t)) throw new ValidationError('Horario de llegada no válido');
  return t;
}

export function validateGuest(g = {}) {
  const clean = {
    firstName: String(g.firstName || '').trim(),
    lastName: String(g.lastName || '').trim(),
    email: String(g.email || '').trim().toLowerCase(),
    phone: String(g.phone || '').trim(),
    docType: String(g.docType || 'DNI').trim().toUpperCase(),
    docNumber: String(g.docNumber || '').trim(),
  };
  if (clean.firstName.length < 2 || clean.firstName.length > 60) throw new ValidationError('Nombre no válido');
  if (clean.lastName.length < 2 || clean.lastName.length > 60) throw new ValidationError('Apellido no válido');
  if (!EMAIL_RE.test(clean.email)) throw new ValidationError('Correo electrónico no válido');
  if (!PHONE_RE.test(clean.phone)) throw new ValidationError('Teléfono no válido');
  if (!DOC_TYPES.includes(clean.docType)) throw new ValidationError('Tipo de documento no válido');
  if (!DOC_RE.test(clean.docNumber)) throw new ValidationError('Número de documento no válido');
  return clean;
}

export function validateCard(c = {}) {
  const number = String(c.cardNumber || '').replace(/\s|-/g, '');
  const cvv = String(c.cvv || '').trim();
  const holder = String(c.cardHolder || '').trim();
  const m = /^(\d{2})\/(\d{2})$/.exec(String(c.expiry || '').trim());

  if (holder.length < 3) throw new ValidationError('Ingresa el nombre del titular');
  if (!/^\d{13,19}$/.test(number)) throw new ValidationError('Número de tarjeta no válido');
  if (!/^\d{3,4}$/.test(cvv)) throw new ValidationError('CVV no válido');
  if (!m) throw new ValidationError('Fecha de vencimiento no válida (MM/AA)');

  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  const now = new Date();
  const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  if (month < 1 || month > 12 || expired) throw new ValidationError('La tarjeta está vencida o la fecha es inválida');

  return { last4: number.slice(-4) };
}

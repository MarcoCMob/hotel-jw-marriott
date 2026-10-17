import crypto from 'node:crypto';
import { pool } from '../db.js';
import {
  ValidationError,
  validateArrivalTime,
  validateCard,
  validateGuest,
  validateStay,
} from '../utils/validate.js';

// Una reserva PENDING bloquea la habitación 15 minutos; después se libera sola.
const HOLD_MINUTES = 15;
const ACTIVE = `(res.status = 'CONFIRMED' OR (res.status = 'PENDING' AND res.created_at > NOW() - INTERVAL ${HOLD_MINUTES} MINUTE))`;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(prefix, length) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${prefix}${out}`;
}

const mapRoomType = (r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  capacity: r.capacity,
  beds: r.beds,
  sizeM2: r.size_m2,
  pricePerNight: Number(r.price_per_night),
  amenities: r.amenities.split(',').map((a) => a.trim()),
  ...(r.available !== undefined ? { available: Number(r.available) } : {}),
});

export async function listRoomTypes() {
  const [rows] = await pool.query('SELECT * FROM room_types ORDER BY price_per_night');
  return rows.map(mapRoomType);
}

export async function listSchedules() {
  const [rows] = await pool.query('SELECT name, schedule, description FROM hotel_schedules ORDER BY id');
  return rows;
}

export async function findAvailability({ checkIn, checkOut, guests }) {
  const stay = validateStay({ checkIn, checkOut, guests });
  const [rows] = await pool.query(
    `SELECT rt.*,
       (SELECT COUNT(*) FROM rooms r
         WHERE r.room_type_id = rt.id
           AND r.id NOT IN (
             SELECT res.room_id FROM reservations res
              WHERE ${ACTIVE} AND res.check_in < ? AND res.check_out > ?
           )) AS available
     FROM room_types rt
     WHERE rt.capacity >= ?
     ORDER BY rt.price_per_night`,
    [checkOut, checkIn, stay.guests]
  );
  return rows.map(mapRoomType);
}

export async function getReservationByCode(code) {
  const [rows] = await pool.query(
    `SELECT res.code, res.status, res.check_in, res.check_out, res.arrival_time,
            res.guests_count, res.nights, res.total, res.notes, res.created_at,
            (res.status = 'PENDING' AND res.created_at < NOW() - INTERVAL ${HOLD_MINUTES} MINUTE) AS expired,
            g.first_name, g.last_name, g.email, g.phone, g.doc_type, g.doc_number,
            r.room_number, r.floor,
            rt.id AS room_type_id, rt.name AS room_type, rt.price_per_night, rt.beds,
            p.card_last4, p.transaction_ref, p.created_at AS paid_at
       FROM reservations res
       JOIN guests g       ON g.id = res.guest_id
       JOIN rooms r        ON r.id = res.room_id
       JOIN room_types rt  ON rt.id = r.room_type_id
       LEFT JOIN payments p ON p.reservation_id = res.id AND p.status = 'APPROVED'
      WHERE res.code = ?
      LIMIT 1`,
    [String(code || '').toUpperCase()]
  );
  if (!rows.length) return null;
  const x = rows[0];
  return {
    code: x.code,
    status: x.status,
    expired: Boolean(Number(x.expired)),
    checkIn: x.check_in,
    checkOut: x.check_out,
    arrivalTime: x.arrival_time,
    guestsCount: x.guests_count,
    nights: x.nights,
    total: Number(x.total),
    notes: x.notes,
    createdAt: x.created_at,
    guest: {
      firstName: x.first_name,
      lastName: x.last_name,
      email: x.email,
      phone: x.phone,
      docType: x.doc_type,
      docNumber: x.doc_number,
    },
    room: {
      number: x.room_number,
      floor: x.floor,
      typeId: x.room_type_id,
      type: x.room_type,
      beds: x.beds,
      pricePerNight: Number(x.price_per_night),
    },
    payment: x.transaction_ref
      ? { cardLast4: x.card_last4, transactionRef: x.transaction_ref, paidAt: x.paid_at }
      : null,
  };
}

export async function createReservation(payload = {}) {
  const guest = validateGuest(payload.guest);
  const stay = validateStay(payload);
  const arrivalTime = validateArrivalTime(payload.arrivalTime);
  const roomTypeId = Number(payload.roomTypeId);
  const notes = String(payload.notes || '').trim().slice(0, 255) || null;
  if (!Number.isInteger(roomTypeId)) throw new ValidationError('Selecciona una habitación');

  const conn = await pool.getConnection();
  let code;
  try {
    await conn.beginTransaction();

    // Bloqueamos el tipo de habitación para que dos reservas simultáneas no tomen el mismo cuarto.
    const [types] = await conn.query('SELECT * FROM room_types WHERE id = ? FOR UPDATE', [roomTypeId]);
    if (!types.length) throw new ValidationError('El tipo de habitación no existe', 404);
    const type = types[0];
    if (stay.guests > type.capacity) {
      throw new ValidationError(`Esta habitación admite máximo ${type.capacity} huéspedes`);
    }

    const [free] = await conn.query(
      `SELECT r.id FROM rooms r
        WHERE r.room_type_id = ?
          AND r.id NOT IN (
            SELECT res.room_id FROM reservations res
             WHERE ${ACTIVE} AND res.check_in < ? AND res.check_out > ?
          )
        ORDER BY r.room_number
        LIMIT 1`,
      [roomTypeId, payload.checkOut, payload.checkIn]
    );
    if (!free.length) {
      throw new ValidationError('Ya no quedan habitaciones disponibles de este tipo para esas fechas', 409);
    }

    // Huésped invitado: si ya existe (mismo documento + correo) se reutiliza.
    let guestId;
    const [existing] = await conn.query(
      'SELECT id FROM guests WHERE doc_number = ? AND email = ? LIMIT 1',
      [guest.docNumber, guest.email]
    );
    if (existing.length) {
      guestId = existing[0].id;
      await conn.query(
        'UPDATE guests SET first_name = ?, last_name = ?, phone = ?, doc_type = ? WHERE id = ?',
        [guest.firstName, guest.lastName, guest.phone, guest.docType, guestId]
      );
    } else {
      const [ins] = await conn.query(
        'INSERT INTO guests (first_name, last_name, email, phone, doc_type, doc_number) VALUES (?, ?, ?, ?, ?, ?)',
        [guest.firstName, guest.lastName, guest.email, guest.phone, guest.docType, guest.docNumber]
      );
      guestId = ins.insertId;
    }

    const total = Number(type.price_per_night) * stay.nights;
    code = randomCode('JW-', 8);
    await conn.query(
      `INSERT INTO reservations
         (code, guest_id, room_id, check_in, check_out, arrival_time, guests_count, nights, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, guestId, free[0].id, payload.checkIn, payload.checkOut, arrivalTime, stay.guests, stay.nights, total, notes]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getReservationByCode(code);
}

// Pasarela MOCK: no se cobra nada. Las tarjetas que terminan en 0002 simulan un rechazo.
export async function payReservation(code, cardInput) {
  const reservation = await getReservationByCode(code);
  if (!reservation) throw new ValidationError('Reserva no encontrada', 404);
  if (reservation.status === 'CONFIRMED') return { reservation, alreadyPaid: true };
  if (reservation.status === 'CANCELLED' || reservation.expired) {
    throw new ValidationError('La reserva expiró. Por favor realiza una nueva reserva.', 410);
  }

  const { last4 } = validateCard(cardInput);
  const [[row]] = await pool.query('SELECT id FROM reservations WHERE code = ?', [reservation.code]);
  const transactionRef = randomCode('TX-', 10);

  if (last4 === '0002') {
    await pool.query(
      `INSERT INTO payments (reservation_id, amount, card_last4, status, transaction_ref)
       VALUES (?, ?, ?, 'DECLINED', ?)`,
      [row.id, reservation.total, last4, transactionRef]
    );
    throw new ValidationError('Pago rechazado por el banco emisor (simulación). Prueba con otra tarjeta.', 402);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [upd] = await conn.query(
      "UPDATE reservations SET status = 'CONFIRMED' WHERE id = ? AND status = 'PENDING'",
      [row.id]
    );
    if (upd.affectedRows === 1) {
      await conn.query(
        `INSERT INTO payments (reservation_id, amount, card_last4, status, transaction_ref)
         VALUES (?, ?, ?, 'APPROVED', ?)`,
        [row.id, reservation.total, last4, transactionRef]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { reservation: await getReservationByCode(reservation.code), alreadyPaid: false };
}

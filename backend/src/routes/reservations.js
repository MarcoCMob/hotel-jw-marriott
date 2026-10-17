import { Router } from 'express';
import {
  createReservation,
  getReservationByCode,
  payReservation,
} from '../services/reservationService.js';
import { streamTicket } from '../services/ticketPdf.js';
import { ValidationError } from '../utils/validate.js';
import { wrap } from '../utils/wrap.js';

const router = Router();

router.post('/', wrap(async (req, res) => {
  const reservation = await createReservation(req.body);
  res.status(201).json(reservation);
}));

router.get('/:code', wrap(async (req, res) => {
  const reservation = await getReservationByCode(req.params.code);
  if (!reservation) throw new ValidationError('Reserva no encontrada', 404);
  res.json(reservation);
}));

router.post('/:code/pay', wrap(async (req, res) => {
  const { reservation, alreadyPaid } = await payReservation(req.params.code, req.body);
  res.json({ reservation, alreadyPaid });
}));

router.get('/:code/ticket', wrap(async (req, res) => {
  const reservation = await getReservationByCode(req.params.code);
  if (!reservation) throw new ValidationError('Reserva no encontrada', 404);
  if (reservation.status !== 'CONFIRMED') {
    throw new ValidationError('El e-ticket solo está disponible para reservas pagadas', 403);
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="eticket-${reservation.code}.pdf"`);
  await streamTicket(res, reservation);
}));

export default router;

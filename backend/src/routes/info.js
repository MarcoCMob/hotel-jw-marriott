import { Router } from 'express';
import { findAvailability, listRoomTypes, listSchedules } from '../services/reservationService.js';
import { wrap } from '../utils/wrap.js';

const router = Router();

router.get('/room-types', wrap(async (_req, res) => {
  res.json(await listRoomTypes());
}));

router.get('/hotel-info', wrap(async (_req, res) => {
  res.json({
    name: 'JW Marriott Hotel Lima',
    location: 'Miraflores, Lima, Perú',
    schedules: await listSchedules(),
  });
}));

router.get('/availability', wrap(async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;
  res.json(await findAvailability({ checkIn, checkOut, guests }));
}));

export default router;

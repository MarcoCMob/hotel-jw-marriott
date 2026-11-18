import { jest } from '@jest/globals';

// 1. Definimos los mocks antes de cargar el router
const mockCreateReservation = jest.fn();
const mockGetReservationByCode = jest.fn();
const mockPayReservation = jest.fn();

jest.unstable_mockModule('../services/reservationService.js', () => ({
  createReservation: mockCreateReservation,
  getReservationByCode: mockGetReservationByCode,
  payReservation: mockPayReservation,
}));

// 2. Importamos dinámicamente después de registrar el mock
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: reservasRouter } = await import('../routes/reservations.js');

const app = express();
app.use(express.json());
app.use('/reservas', reservasRouter);

app.use((err, req, res, next) => {
    console.log(next)
  let status = err.statusCode || err.status || 500;
  if (err.message === 'Reserva no encontrada') status = 404;
  if (err.message.includes('e-ticket solo está disponible')) status = 403;
  
  res.status(status).json({ error: err.message });
});

describe('Endpoints de Reservas (reservasEndpoint.js)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /reservas - Debe crear una reserva exitosamente (201)', async () => {
    const mockReservaCreada = { code: 'JW-ABC12345', status: 'PENDING', total: 300 };
    mockCreateReservation.mockResolvedValue(mockReservaCreada);

    const response = await request(app)
      .post('/reservas')
      .send({ roomTypeId: 1, checkIn: '2026-12-01', checkOut: '2026-12-03', guests: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockReservaCreada);
  });

  test('GET /reservas/:code - Debe retornar la reserva si existe (200)', async () => {
    const mockReserva = { code: 'JW-ABC12345', status: 'CONFIRMED' };
    mockGetReservationByCode.mockResolvedValue(mockReserva);

    const response = await request(app).get('/reservas/JW-ABC12345');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockReserva);
  });

  test('GET /reservas/:code - Debe retornar 404 si la reserva no existe', async () => {
    mockGetReservationByCode.mockResolvedValue(null);

    const response = await request(app).get('/reservas/JW-NOEXISTE');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Reserva no encontrada');
  });

  test('POST /reservas/:code/pay - Debe procesar el pago correctamente (200)', async () => {
    const mockResultadoPago = {
      reservation: { code: 'JW-ABC12345', status: 'CONFIRMED' },
      alreadyPaid: false,
    };
    mockPayReservation.mockResolvedValue(mockResultadoPago);

    const response = await request(app)
      .post('/reservas/JW-ABC12345/pay')
      .send({ number: '4000123456781234', expMonth: '12', expYear: '28', cvv: '123' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResultadoPago);
  });

  test('GET /reservas/:code/ticket - Debe denegar el ticket si la reserva no está CONFIRMED (403)', async () => {
    const mockReservaPendiente = { code: 'JW-ABC12345', status: 'PENDING' };
    mockGetReservationByCode.mockResolvedValue(mockReservaPendiente);

    const response = await request(app).get('/reservas/JW-ABC12345/ticket');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('El e-ticket solo está disponible para reservas pagadas');
  });
});
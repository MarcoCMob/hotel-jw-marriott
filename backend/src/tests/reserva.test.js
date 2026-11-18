import { createReservation, payReservation } from '../services/reservationService.js'; 


describe('Sistema de Reservas de Hotel - Pruebas de Lógica', () => {


  test('1. Debe fallar al intentar reservar si la capacidad excede el límite de la habitación', async () => {
    const payloadInvalido = {
      roomTypeId: 1, 
      checkIn: '2026-10-01',
      checkOut: '2026-10-05',
      arrivalTime: '14:00',
      notes: 'Test note',
      guest: {
        firstName: 'Carlos',
        lastName: 'Pérez',
        email: 'carlos@test.com',
        phone: '999999999',
        docType: 'DNI',
        docNumber: '12345678'
      }
    };


    await expect(createReservation({ ...payloadInvalido, guests: 10 })).rejects.toThrow();
  });

  test('2. Simulación de pago rechazado por tarjeta (terminación 0002)', async () => {
    const codigoFicticio = 'JW-INVALID1'; 
    
    const tarjetaRechazada = {
      number: '4000123456780002',
      expMonth: '12',
      expYear: '28',
      cvv: '123',
      name: 'Test User'
    };

    await expect(payReservation(codigoFicticio, tarjetaRechazada)).rejects.toThrow();
  });

});
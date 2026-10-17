# Hotel JW Marriott · Sistema de reservas

Proyecto académico (React + Node/Express + MySQL) para practicar control de versiones con Git y GitHub.
Flujo público para un **usuario invitado**: landing → datos → fechas/horario → habitación → resumen → pasarela de pago *mock* → e-ticket en PDF.

## Requisitos
- Node.js 18.11+
- MySQL 8 corriendo en local (usuario `root` sin contraseña por defecto)

## Puesta en marcha
```bash
npm run install:all   # instala dependencias (raíz, backend y frontend)
npm run db:init       # crea la BD hotel_jw_marriott con habitaciones y horarios de ejemplo
npm run dev           # API en :4000 y web en http://localhost:5173
```
Si tu MySQL tiene otra contraseña/usuario: `cp backend/.env.example backend/.env` y edítalo.

> `db:init` recrea las tablas desde cero (borra reservas existentes).

## Estructura (pensada para repartir ramas por módulo)
```
database/schema.sql              Esquema + datos semilla
backend/src/routes/              info.js (habitaciones, horarios, disponibilidad) · reservations.js
backend/src/services/            reservationService.js (lógica) · ticketPdf.js (e-ticket)
backend/src/utils/validate.js    Validaciones
frontend/src/pages/              Landing · Booking · Payment · Confirmation
frontend/src/api.js              Cliente HTTP
```

## API
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/room-types` | Tipos de habitación |
| GET | `/api/hotel-info` | Horarios y servicios |
| GET | `/api/availability?checkIn&checkOut&guests` | Disponibilidad por tipo |
| POST | `/api/reservations` | Crea reserva (PENDING, 15 min de bloqueo) |
| GET | `/api/reservations/:code` | Consulta reserva |
| POST | `/api/reservations/:code/pay` | Pago mock → CONFIRMED |
| GET | `/api/reservations/:code/ticket` | E-ticket PDF (solo pagadas) |

## Pasarela de prueba
- Tarjeta válida: `4111 1111 1111 1111`, vence `12/30`, CVV `123` (botón "Usar tarjeta de prueba").
- Cualquier tarjeta que termine en `0002` simula un pago rechazado.
- Solo se guardan los últimos 4 dígitos.

## Ideas para sus ramas
`feature/modulo-habitaciones`, `feature/modulo-reservas`, `feature/modulo-pagos`, `feature/huespedes`, `release/v1.0`.

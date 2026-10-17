-- =====================================================
-- Hotel JW Marriott - Esquema y datos de ejemplo (MySQL 8)
-- Ejecutar con: npm run db:init   (recrea todo desde cero)
-- =====================================================
CREATE DATABASE IF NOT EXISTS hotel_jw_marriott
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_jw_marriott;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS guests;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotel_schedules;

CREATE TABLE room_types (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(80)   NOT NULL,
  description     VARCHAR(255)  NOT NULL,
  capacity        TINYINT       NOT NULL,
  beds            VARCHAR(80)   NOT NULL,
  size_m2         INT           NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,   -- en soles (PEN), incluye IGV
  amenities       VARCHAR(255)  NOT NULL    -- separadas por coma
);

CREATE TABLE rooms (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  room_number  VARCHAR(10) NOT NULL UNIQUE,
  floor        TINYINT     NOT NULL,
  room_type_id INT         NOT NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE TABLE guests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(60)  NOT NULL,
  last_name  VARCHAR(60)  NOT NULL,
  email      VARCHAR(120) NOT NULL,
  phone      VARCHAR(25)  NOT NULL,
  doc_type   ENUM('DNI','CE','PASAPORTE') NOT NULL DEFAULT 'DNI',
  doc_number VARCHAR(15)  NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_guest_doc (doc_number, email)
);

CREATE TABLE reservations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(16)   NOT NULL UNIQUE,
  guest_id     INT           NOT NULL,
  room_id      INT           NOT NULL,
  check_in     DATE          NOT NULL,
  check_out    DATE          NOT NULL,
  arrival_time VARCHAR(5)    NOT NULL,
  guests_count TINYINT       NOT NULL,
  nights       INT           NOT NULL,
  total        DECIMAL(10,2) NOT NULL,
  notes        VARCHAR(255)  NULL,
  status       ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id)  REFERENCES rooms(id),
  INDEX idx_res_room_dates (room_id, check_in, check_out)
);

CREATE TABLE payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id  INT           NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  method          VARCHAR(20)   NOT NULL DEFAULT 'TARJETA_MOCK',
  card_last4      CHAR(4)       NULL,        -- solo los ultimos 4 digitos
  status          ENUM('APPROVED','DECLINED') NOT NULL,
  transaction_ref VARCHAR(30)   NOT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE TABLE hotel_schedules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  schedule    VARCHAR(60)  NOT NULL,
  description VARCHAR(160) NOT NULL
);

-- ---------------- Datos de ejemplo ----------------
INSERT INTO room_types (name, description, capacity, beds, size_m2, price_per_night, amenities) VALUES
('Deluxe King',        'Habitación luminosa con cama King y escritorio de trabajo.',                 2, '1 cama King',            38,  520.00, 'Wi-Fi,Smart TV,Minibar,Caja fuerte,Aire acondicionado'),
('Deluxe Twin',        'Ideal para amigos o colegas: dos camas Queen y amplio baño de mármol.',      2, '2 camas Queen',          38,  540.00, 'Wi-Fi,Smart TV,Minibar,Caja fuerte,Aire acondicionado'),
('Junior Suite Mar',   'Suite con sala de estar y vista panorámica al océano Pacífico.',             3, '1 cama King + sofá cama', 52,  780.00, 'Wi-Fi,Vista al mar,Sala de estar,Cafetera Nespresso,Bata y pantuflas'),
('Suite Ejecutiva',    'Suite con acceso al Lounge Ejecutivo y desayuno incluido.',                  3, '1 cama King',            70, 1150.00, 'Wi-Fi,Lounge Ejecutivo,Desayuno incluido,Sala de reuniones,Vista panorámica'),
('Suite Familiar',     'Dos ambientes pensados para familias, con zona de juegos y cocineta.',       5, '1 cama King + 2 Queen',  85, 1380.00, 'Wi-Fi,Cocineta,Dos baños,Smart TV,Cuna disponible');

INSERT INTO rooms (room_number, floor, room_type_id) VALUES
('501', 5, 1), ('502', 5, 1), ('503', 5, 1), ('601', 6, 1), ('602', 6, 1),
('504', 5, 2), ('505', 5, 2), ('603', 6, 2), ('604', 6, 2),
('701', 7, 3), ('702', 7, 3), ('703', 7, 3),
('801', 8, 4), ('802', 8, 4),
('901', 9, 5), ('902', 9, 5);

INSERT INTO hotel_schedules (name, schedule, description) VALUES
('Check-in',         'Desde las 15:00', 'Recepción disponible las 24 horas.'),
('Check-out',        'Hasta las 12:00', 'Late check-out sujeto a disponibilidad.'),
('Desayuno buffet',  '06:30 - 10:30',   'Restaurante principal, planta baja.'),
('Restaurante',      '12:00 - 23:00',   'Cocina peruana e internacional.'),
('Spa y gimnasio',   '06:00 - 22:00',   'Acceso gratuito para huéspedes.'),
('Piscina',          '07:00 - 20:00',   'Piscina climatizada en el piso 3.');

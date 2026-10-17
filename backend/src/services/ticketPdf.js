import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const fmtDate = (s) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};
const money = (n) => `S/ ${Number(n).toFixed(2)}`;

const GOLD = '#b8914a';
const DARK = '#1d1a17';
const GRAY = '#7a7469';
const LEFT = 50;
const WIDTH = 495;

export async function streamTicket(res, r) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: { Title: `E-ticket ${r.code}`, Author: 'Hotel JW Marriott (demo académica)' },
  });
  doc.pipe(res);

  // Cabecera
  doc.rect(0, 0, 595, 110).fill(DARK);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(22).text('JW MARRIOTT', LEFT, 38);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(10).text('Hotel Lima - Miraflores', LEFT, 66);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
    .text('E-TICKET / BOLETA ELECTRÓNICA', 300, 48, { width: 245, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor('#d8d2c6')
    .text('Documento de ejemplo - sin valor fiscal', 300, 66, { width: 245, align: 'right' });

  // Código + QR
  doc.fillColor(GRAY).font('Helvetica').fontSize(9).text('CÓDIGO DE RESERVA', LEFT, 135);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(26).text(r.code, LEFT, 150);
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
    .text(`Estado: ${r.status === 'CONFIRMED' ? 'CONFIRMADA Y PAGADA' : r.status}`, LEFT, 188);

  const qr = await QRCode.toBuffer(r.code, { margin: 1, width: 220 });
  doc.image(qr, 435, 128, { width: 110 });

  let y = 250;

  const section = (title) => {
    doc.moveTo(LEFT, y).lineTo(LEFT + WIDTH, y).strokeColor(GOLD).lineWidth(1).stroke();
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10).text(title.toUpperCase(), LEFT, y + 8);
    y += 28;
  };
  const row = (label, value) => {
    doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(label, LEFT, y, { width: 150 });
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(String(value), 210, y, { width: 335 });
    y += 19;
  };

  section('Huésped');
  row('Nombre', `${r.guest.firstName} ${r.guest.lastName}`);
  row('Documento', `${r.guest.docType} ${r.guest.docNumber}`);
  row('Correo', r.guest.email);
  row('Teléfono', r.guest.phone);
  y += 8;

  section('Estadía');
  row('Entrada (check-in)', `${fmtDate(r.checkIn)} - desde las 15:00`);
  row('Salida (check-out)', `${fmtDate(r.checkOut)} - hasta las 12:00`);
  row('Llegada estimada', `${r.arrivalTime} h`);
  row('Noches', r.nights);
  row('Huéspedes', r.guestsCount);
  y += 8;

  section('Habitación');
  row('Tipo', r.room.type);
  row('Número / piso', `${r.room.number} / piso ${r.room.floor}`);
  row('Camas', r.room.beds);
  y += 8;

  section('Pago');
  const total = r.total;
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  if (r.payment) {
    row('Método', `Tarjeta terminada en ${r.payment.cardLast4} (pasarela de prueba)`);
    row('Operación', r.payment.transactionRef);
    row('Fecha de pago', r.payment.paidAt);
  }
  row('Tarifa por noche', money(r.room.pricePerNight));
  row('Subtotal', money(subtotal));
  row('IGV (18%)', money(igv));
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13)
    .text(`TOTAL PAGADO: ${money(total)}`, LEFT, y + 4, { width: WIDTH, align: 'right' });

  doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(
    'Presenta este e-ticket (impreso o en tu celular) en recepción junto con tu documento de identidad. ' +
      'Proyecto académico: los datos y el pago son simulados.',
    LEFT, 770, { width: WIDTH, align: 'center' }
  );

  doc.end();
}

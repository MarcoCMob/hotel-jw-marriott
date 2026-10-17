import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ticketUrl } from '../api.js';
import { fmtDate, money } from '../format.js';

export default function Confirmation() {
  const { code } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReservation(code).then(setR).catch((e) => setError(e.message));
  }, [code]);

  if (error) {
    return (
      <div className="container narrow section center">
        <div className="alert">{error}</div>
        <Link className="btn" to="/">Volver al inicio</Link>
      </div>
    );
  }
  if (!r) return <div className="container narrow section center muted">Cargando…</div>;

  if (r.status !== 'CONFIRMED') {
    return (
      <div className="container narrow section center">
        <h1>Pago pendiente</h1>
        <p className="muted">Esta reserva aún no está pagada.</p>
        <Link className="btn" to={`/pago/${r.code}`}>Ir al pago</Link>
      </div>
    );
  }

  return (
    <div className="container narrow section">
      <div className="success">
        <div className="check">✓</div>
        <h1>¡Reserva confirmada!</h1>
        <p className="muted">Guarda tu código y descarga tu e-ticket.</p>
      </div>

      <div className="card ticket">
        <div className="ticket-head">
          <div>
            <small>CÓDIGO DE RESERVA</small>
            <div className="code">{r.code}</div>
          </div>
          <div className="right">
            <small>TOTAL PAGADO</small>
            <div className="price">{money(r.total)}</div>
          </div>
        </div>
        <dl className="summary card-body">
          <dt>Huésped</dt><dd>{r.guest.firstName} {r.guest.lastName}</dd>
          <dt>Habitación</dt><dd>{r.room.type} · N.º {r.room.number} (piso {r.room.floor})</dd>
          <dt>Entrada</dt><dd>{fmtDate(r.checkIn)} · desde las 15:00 (llegada {r.arrivalTime} h)</dd>
          <dt>Salida</dt><dd>{fmtDate(r.checkOut)} · hasta las 12:00</dd>
          <dt>Noches</dt><dd>{r.nights}</dd>
          <dt>Pago</dt><dd>Tarjeta ···· {r.payment?.cardLast4} · Op. {r.payment?.transactionRef}</dd>
        </dl>
      </div>

      <div className="actions center-actions">
        <a className="btn btn-lg" href={ticketUrl(r.code)} download>Descargar e-ticket (PDF)</a>
        <button className="btn btn-ghost" onClick={() => window.print()}>Imprimir</button>
        <Link className="btn btn-ghost" to="/">Volver al inicio</Link>
      </div>
    </div>
  );
}

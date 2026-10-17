import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { fmtDate, money } from '../format.js';

const TEST_CARD = { cardHolder: 'HUESPED DE PRUEBA', cardNumber: '4111 1111 1111 1111', expiry: '12/30', cvv: '123' };

const formatCardNumber = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Payment() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [card, setCard] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getReservation(code)
      .then((r) => {
        if (r.status === 'CONFIRMED') navigate(`/confirmacion/${code}`, { replace: true });
        else setReservation(r);
      })
      .catch((e) => setLoadError(e.message));
  }, [code, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.pay(code, card);
      navigate(`/confirmacion/${code}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="container narrow section center">
        <div className="alert">{loadError}</div>
        <Link className="btn" to="/reservar">Hacer una nueva reserva</Link>
      </div>
    );
  }
  if (!reservation) return <div className="container narrow section center muted">Cargando…</div>;

  if (reservation.expired || reservation.status === 'CANCELLED') {
    return (
      <div className="container narrow section center">
        <h1>La reserva expiró</h1>
        <p className="muted">Las reservas sin pagar se liberan a los 15 minutos.</p>
        <Link className="btn" to="/reservar">Hacer una nueva reserva</Link>
      </div>
    );
  }

  return (
    <div className="container narrow section">
      <div className="gateway-banner">
        PasarelaPay · <strong>ENTORNO DE PRUEBA</strong> — no se realizará ningún cargo real
      </div>

      <div className="pay-layout">
        <form className="card card-body" onSubmit={submit}>
          <h2>Pago con tarjeta</h2>
          <label>Titular de la tarjeta
            <input value={card.cardHolder} autoComplete="off"
              onChange={(e) => setCard({ ...card, cardHolder: e.target.value.toUpperCase() })} />
          </label>
          <label>Número de tarjeta
            <input inputMode="numeric" placeholder="0000 0000 0000 0000" value={card.cardNumber} autoComplete="off"
              onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })} />
          </label>
          <div className="form-grid">
            <label>Vencimiento
              <input inputMode="numeric" placeholder="MM/AA" value={card.expiry} autoComplete="off"
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
            </label>
            <label>CVV
              <input inputMode="numeric" maxLength="4" value={card.cvv} autoComplete="off"
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
            </label>
          </div>

          <button type="button" className="link-btn" onClick={() => setCard(TEST_CARD)}>
            Usar tarjeta de prueba
          </button>
          <p className="muted small">Las tarjetas que terminan en 0002 simulan un pago rechazado.</p>

          {error && <div className="alert">{error}</div>}

          <button className="btn btn-lg" disabled={busy}>
            {busy ? 'Procesando…' : `Pagar ${money(reservation.total)}`}
          </button>
        </form>

        <aside className="card card-body">
          <h3>Tu reserva</h3>
          <p className="code">{reservation.code}</p>
          <p><strong>{reservation.room.type}</strong></p>
          <p className="small">
            {fmtDate(reservation.checkIn)} → {fmtDate(reservation.checkOut)}<br />
            {reservation.nights} noche(s) · {reservation.guestsCount} huésped(es)
          </p>
          <p className="small muted">{reservation.guest.firstName} {reservation.guest.lastName}</p>
          <p className="price">{money(reservation.total)}</p>
          <p className="muted small">Tienes 15 minutos para completar el pago.</p>
        </aside>
      </div>
    </div>
  );
}

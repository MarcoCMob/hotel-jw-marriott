import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { addDays, fmtDate, money, nightsBetween, todayISO } from '../format.js';

const STEPS = ['Tus datos', 'Estadía', 'Habitación', 'Resumen'];
const ARRIVAL_TIMES = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const DOC_TYPES = [
  ['DNI', 'DNI'],
  ['CE', 'Carné de extranjería'],
  ['PASAPORTE', 'Pasaporte'],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Booking() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = Number(params.get('tipo')) || null;

  const [step, setStep] = useState(0);
  const [guest, setGuest] = useState({
    firstName: '', lastName: '', email: '', phone: '', docType: 'DNI', docNumber: '',
  });
  const [stay, setStay] = useState({
    checkIn: addDays(todayISO(), 1),
    checkOut: addDays(todayISO(), 3),
    guests: 2,
    arrivalTime: '15:00',
    notes: '',
  });
  const [rooms, setRooms] = useState([]);
  const [roomTypeId, setRoomTypeId] = useState(preselected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const selected = rooms.find((r) => r.id === roomTypeId);

  const onGuest = (e) => setGuest({ ...guest, [e.target.name]: e.target.value });
  const onStay = (e) => setStay({ ...stay, [e.target.name]: e.target.value });

  const checkGuest = () => {
    if (guest.firstName.trim().length < 2) return 'Ingresa tu nombre';
    if (guest.lastName.trim().length < 2) return 'Ingresa tu apellido';
    if (!EMAIL_RE.test(guest.email.trim())) return 'Ingresa un correo válido';
    if (!/^\+?[\d\s-]{7,16}$/.test(guest.phone.trim())) return 'Ingresa un teléfono válido';
    if (!/^[A-Za-z0-9]{6,15}$/.test(guest.docNumber.trim())) return 'El documento debe tener entre 6 y 15 caracteres';
    return '';
  };

  const checkStay = () => {
    if (!stay.checkIn || !stay.checkOut) return 'Selecciona las fechas de entrada y salida';
    if (stay.checkIn < todayISO()) return 'La fecha de entrada no puede ser pasada';
    if (nights < 1) return 'La salida debe ser posterior a la entrada';
    if (nights > 30) return 'La estadía máxima es de 30 noches';
    return '';
  };

  const next = async () => {
    setError('');
    if (step === 0) {
      const msg = checkGuest();
      if (msg) return setError(msg);
      return setStep(1);
    }
    if (step === 1) {
      const msg = checkStay();
      if (msg) return setError(msg);
      setBusy(true);
      try {
        const list = await api.availability({
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          guests: stay.guests,
        });
        setRooms(list);
        const keep = list.find((r) => r.id === roomTypeId && r.available > 0);
        if (!keep) setRoomTypeId(null);
        setStep(2);
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 2) {
      if (!selected) return setError('Selecciona una habitación para continuar');
      return setStep(3);
    }
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const confirm = async () => {
    setError('');
    setBusy(true);
    try {
      const created = await api.createReservation({
        guest,
        roomTypeId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        arrivalTime: stay.arrivalTime,
        guests: Number(stay.guests),
        notes: stay.notes,
      });
      navigate(`/pago/${created.code}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="container narrow section">
      <h1>Reserva como invitado</h1>

      <ol className="stepper">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <span>{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      <div className="card card-body">
        {step === 0 && (
          <div className="form-grid">
            <label>Nombres
              <input name="firstName" value={guest.firstName} onChange={onGuest} autoComplete="given-name" />
            </label>
            <label>Apellidos
              <input name="lastName" value={guest.lastName} onChange={onGuest} autoComplete="family-name" />
            </label>
            <label>Correo electrónico
              <input type="email" name="email" value={guest.email} onChange={onGuest} autoComplete="email" />
            </label>
            <label>Teléfono
              <input name="phone" value={guest.phone} onChange={onGuest} autoComplete="tel" placeholder="+51 999 999 999" />
            </label>
            <label>Tipo de documento
              <select name="docType" value={guest.docType} onChange={onGuest}>
                {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>N.º de documento
              <input name="docNumber" value={guest.docNumber} onChange={onGuest} />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="form-grid">
            <label>Fecha de entrada
              <input type="date" name="checkIn" min={todayISO()} value={stay.checkIn}
                onChange={(e) => {
                  const checkIn = e.target.value;
                  const checkOut = stay.checkOut <= checkIn ? addDays(checkIn, 1) : stay.checkOut;
                  setStay({ ...stay, checkIn, checkOut });
                }} />
            </label>
            <label>Fecha de salida
              <input type="date" name="checkOut" min={stay.checkIn} value={stay.checkOut} onChange={onStay} />
            </label>
            <label>Huéspedes
              <select name="guests" value={stay.guests} onChange={onStay}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label>Hora estimada de llegada
              <select name="arrivalTime" value={stay.arrivalTime} onChange={onStay}>
                {ARRIVAL_TIMES.map((t) => <option key={t} value={t}>{t} h</option>)}
              </select>
            </label>
            <label className="full">Peticiones especiales (opcional)
              <textarea name="notes" rows="2" maxLength="255" value={stay.notes} onChange={onStay} />
            </label>
            <p className="muted small full">
              Check-in desde las 15:00 · Check-out hasta las 12:00 · {nights > 0 ? `${nights} noche(s)` : ''}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="room-list">
            {rooms.length === 0 && (
              <p className="muted">No hay habitaciones para {stay.guests} huéspedes. Prueba con otra cantidad.</p>
            )}
            {rooms.map((r) => {
              const soldOut = r.available === 0;
              return (
                <button
                  type="button"
                  key={r.id}
                  disabled={soldOut}
                  className={`room-option ${roomTypeId === r.id ? 'selected' : ''}`}
                  onClick={() => setRoomTypeId(r.id)}
                >
                  <div>
                    <h3>{r.name}</h3>
                    <p className="muted small">{r.description}</p>
                    <p className="small">{r.beds} · {r.sizeM2} m² · hasta {r.capacity} huéspedes</p>
                    <p className={`small ${soldOut ? 'danger' : 'ok'}`}>
                      {soldOut ? 'Agotada para esas fechas' : `${r.available} disponible(s)`}
                    </p>
                  </div>
                  <div className="right">
                    <strong className="price">{money(r.pricePerNight)}</strong>
                    <div className="muted small">por noche</div>
                    <div className="small">Total: {money(r.pricePerNight * nights)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && selected && (
          <dl className="summary">
            <dt>Huésped</dt><dd>{guest.firstName} {guest.lastName} · {guest.docType} {guest.docNumber}</dd>
            <dt>Contacto</dt><dd>{guest.email} · {guest.phone}</dd>
            <dt>Entrada</dt><dd>{fmtDate(stay.checkIn)} · llegada {stay.arrivalTime} h</dd>
            <dt>Salida</dt><dd>{fmtDate(stay.checkOut)} · hasta las 12:00</dd>
            <dt>Habitación</dt><dd>{selected.name} · {stay.guests} huésped(es)</dd>
            <dt>Estadía</dt><dd>{nights} noche(s) × {money(selected.pricePerNight)}</dd>
            {stay.notes && (<><dt>Peticiones</dt><dd>{stay.notes}</dd></>)}
            <dt className="total">Total a pagar</dt>
            <dd className="total">{money(selected.pricePerNight * nights)}</dd>
          </dl>
        )}

        {error && <div className="alert">{error}</div>}

        <div className="actions">
          {step > 0 ? <button className="btn btn-ghost" onClick={back} disabled={busy}>Atrás</button> : <span />}
          {step < 3 ? (
            <button className="btn" onClick={next} disabled={busy}>
              {busy ? 'Buscando…' : 'Continuar'}
            </button>
          ) : (
            <button className="btn" onClick={confirm} disabled={busy}>
              {busy ? 'Reservando…' : 'Confirmar y pagar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

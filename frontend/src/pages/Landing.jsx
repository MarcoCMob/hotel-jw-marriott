import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { money } from '../format.js';

export default function Landing() {
  const [rooms, setRooms] = useState([]);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.roomTypes(), api.hotelInfo()])
      .then(([r, i]) => {
        setRooms(r);
        setInfo(i);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">Miraflores · Lima</p>
          <h1>Tu estadía de lujo frente al Pacífico</h1>
          <p className="lead">
            Reserva en minutos, sin crear una cuenta. Elige tus fechas, tu habitación y
            recibe tu e-ticket al instante.
          </p>
          <Link to="/reservar" className="btn btn-lg">Reservar ahora</Link>
        </div>
      </section>

      {error && (
        <div className="container">
          <div className="alert">{error}</div>
        </div>
      )}

      <section id="habitaciones" className="container section">
        <h2>Nuestras habitaciones</h2>
        <p className="muted">Precios por noche en soles, IGV incluido.</p>
        <div className="grid">
          {rooms.map((r, i) => (
            <article key={r.id} className="card room">
              <div className={`room-banner tone-${i % 5}`}>
                <span>{r.sizeM2} m²</span>
              </div>
              <div className="card-body">
                <h3>{r.name}</h3>
                <p className="muted">{r.description}</p>
                <p className="small">
                  {r.beds} · hasta {r.capacity} huéspedes
                </p>
                <div className="chips">
                  {r.amenities.map((a) => (
                    <span key={a} className="chip">{a}</span>
                  ))}
                </div>
                <div className="room-foot">
                  <div>
                    <strong className="price">{money(r.pricePerNight)}</strong>
                    <span className="muted small"> / noche</span>
                  </div>
                  <Link to={`/reservar?tipo=${r.id}`} className="btn btn-sm">Reservar</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="horarios" className="band">
        <div className="container section">
          <h2>Horarios y servicios</h2>
          <div className="grid grid-3">
            {(info?.schedules || []).map((s) => (
              <div key={s.name} className="card card-body">
                <h3>{s.name}</h3>
                <p className="price-sm">{s.schedule}</p>
                <p className="muted small">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section center">
        <h2>¿Listo para tu próxima estadía?</h2>
        <Link to="/reservar" className="btn btn-lg">Reservar como invitado</Link>
      </section>
    </>
  );
}

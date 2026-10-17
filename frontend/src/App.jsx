import { Link, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Booking from './pages/Booking.jsx';
import Payment from './pages/Payment.jsx';
import Confirmation from './pages/Confirmation.jsx';

function NotFound() {
  return (
    <div className="container narrow center">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección que buscas no existe.</p>
      <Link className="btn" to="/">Volver al inicio</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">JW <span>MARRIOTT</span></Link>
          <nav>
            <a href="/#habitaciones">Habitaciones</a>
            <a href="/#horarios">Horarios</a>
            <Link to="/reservar" className="btn btn-sm">Reservar</Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reservar" element={<Booking />} />
          <Route path="/pago/:code" element={<Payment />} />
          <Route path="/confirmacion/:code" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <strong>JW Marriott Hotel Lima</strong> · Miraflores, Lima, Perú
          <p className="muted small">
            Proyecto académico de control de versiones. Los datos, precios y pagos son simulados.
          </p>
        </div>
      </footer>
    </>
  );
}

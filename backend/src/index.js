import cors from 'cors';
import express from 'express';
import path from 'path'; 
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import infoRoutes from './routes/info.js';
import reservationRoutes from './routes/reservations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1'); 
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'Sin conexión a MySQL' });
  }
});

app.use('/api', infoRoutes);
app.use('/api/reservations', reservationRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  const dbDown = ['ECONNREFUSED', 'ER_BAD_DB_ERROR', 'ER_ACCESS_DENIED_ERROR', 'ER_NO_SUCH_TABLE'].includes(err.code);
  res.status(500).json({
    error: dbDown
      ? 'No hay conexión con la base de datos. Verifica MySQL y ejecuta "npm run db:init".'
      : 'Error interno del servidor',
  });
});

app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));

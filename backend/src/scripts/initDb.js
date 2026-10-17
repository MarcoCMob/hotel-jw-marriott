import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { dbConfig, DB_NAME } from '../db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, '../../../database/schema.sql');

const sql = fs.readFileSync(schemaPath, 'utf8');
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });

try {
  await conn.query(sql);
  const [[rt]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${DB_NAME}\`.room_types`);
  const [[rm]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${DB_NAME}\`.rooms`);
  console.log(`Base de datos "${DB_NAME}" lista: ${rt.n} tipos de habitación, ${rm.n} habitaciones.`);
} catch (err) {
  console.error('No se pudo inicializar la base de datos:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}

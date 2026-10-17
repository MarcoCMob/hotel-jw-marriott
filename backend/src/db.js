import 'dotenv/config';
import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: 'MySQL:0-8!' || '',
};

export const DB_NAME = process.env.DB_NAME || 'hotel_jw_marriott';

export const pool = mysql.createPool({
  ...dbConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE/TIMESTAMP llegan como texto 'YYYY-MM-DD'
});

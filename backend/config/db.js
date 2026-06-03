/**
 * Configuración de conexión a SQL Server
 * Requiere: npm install mssql
 *
 * INSTRUCCIONES DE MIGRACIÓN:
 * 1. Copiar .env.example a .env y configurar las credenciales
 * 2. Descomentar las llamadas a getConnection() en los repositorios
 * 3. Asegurarse de que SQL Server esté corriendo y la DB exista
 */

const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'KahootCloneDB',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

// Obtener o crear el pool de conexiones a SQL Server
async function getConnection() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log('Conexión a SQL Server establecida');
    } catch (error) {
      console.error('Error al conectar a SQL Server:', error.message);
      throw error;
    }
  }
  return pool;
}

async function closeConnection() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Conexión a SQL Server cerrada');
  }
}

module.exports = { sql, getConnection, closeConnection };

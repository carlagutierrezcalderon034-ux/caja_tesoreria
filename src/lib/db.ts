import { sql } from '@vercel/postgres';

// Opcional: Función para inicializar las tablas de la base de datos si no existen.
// En producción, es mejor correr esto en un script de migración, pero para facilidad lo dejamos aquí.
export async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS Nomina (
        id SERIAL PRIMARY KEY,
        cajero VARCHAR(255),
        username VARCHAR(255),
        folioInicio INTEGER,
        folioFin INTEGER,
        totalDocumentos INTEGER,
        ingresoReal INTEGER,
        diferencia INTEGER,
        sobrante INTEGER,
        faltante INTEGER,
        cheques INTEGER,
        tarjetas INTEGER,
        efectivo INTEGER,
        billetes TEXT,
        estado VARCHAR(50),
        fecha VARCHAR(50),
        fechaAsignacion VARCHAR(50),
        fechaCierre VARCHAR(50),
        observacion TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS Deposito (
        id SERIAL PRIMARY KEY,
        caja VARCHAR(255) NOT NULL,
        cajero_username VARCHAR(255) NOT NULL,
        empresa_recaudadora VARCHAR(255) NOT NULL,
        total_depositado INTEGER NOT NULL,
        desglose_billetes TEXT NOT NULL,
        fecha VARCHAR(50) NOT NULL,
        reportado BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS CierreTurno (
        id SERIAL PRIMARY KEY,
        cajero_username VARCHAR(255) NOT NULL,
        caja VARCHAR(255) NOT NULL,
        fecha VARCHAR(50) NOT NULL,
        cerrado_por VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Tablas de Postgres verificadas/creadas correctamente.');
  } catch (error) {
    console.error('Error inicializando la base de datos Postgres:', error);
  }
}

export { sql };

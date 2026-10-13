/**
 * Camada de MODELO - infraestrutura do banco de dados local (expo-sqlite).
 *
 * Responsável apenas por abrir/criar o banco e garantir o schema.
 * As regras de negócio ficam em ParkingModel.js e nos controllers.
 */
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'cade_minha_vaga.db';

/** Promise única do banco (singleton) para não reabrir a cada acesso. */
let databasePromise = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return databasePromise;
}

/** Cria o schema das tabelas de forma idempotente. */
export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS parking_spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      label TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
  return db;
}

/** Fecha o banco (útil em testes). */
export async function closeDatabase() {
  if (databasePromise) {
    const db = await databasePromise;
    await db.closeAsync();
    databasePromise = null;
  }
}
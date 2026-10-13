/**
 * Camada de MODELO - regras de persistência e domínio das vagas.
 *
 * - CRUD da tabela `parking_spots` via expo-sqlite
 * - Cálculo de distância (Haversine) entre o usuário e a vaga
 */
import { getDatabase } from './database';

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Distância em metros entre duas coordenadas (fórmula de Haversine). */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/** Formata metros para exibição amigável ("850 m", "1,2 km"). */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function rowToSpot(row) {
  if (!row) return null;
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    label: row.label,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function findSpotById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM parking_spots WHERE id = ?;', [id]);
  return rowToSpot(row);
}

export const ParkingModel = {
  /** Salva uma nova vaga e retorna o registro criado. */
  async create({ latitude, longitude, label, notes = '' }) {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO parking_spots (latitude, longitude, label, notes) VALUES (?, ?, ?, ?);',
      [latitude, longitude, label, notes]
    );
    return findSpotById(result.lastInsertRowId);
  },

  /** Lista todas as vagas salvas (mais recente primeiro). */
  async findAll() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      'SELECT * FROM parking_spots ORDER BY created_at DESC, id DESC;'
    );
    return rows.map(rowToSpot);
  },

  /** Retorna a última vaga salva (ou null). */
  async findLatest() {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      'SELECT * FROM parking_spots ORDER BY created_at DESC, id DESC LIMIT 1;'
    );
    return rowToSpot(row);
  },

  async findById(id) {
    return findSpotById(id);
  },

  /** Remove uma vaga pelo id. */
  async remove(id) {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM parking_spots WHERE id = ?;', [id]);
    return result.changes > 0;
  },

  /** Remove todas as vagas (histórico). */
  async removeAll() {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM parking_spots;');
    return result.changes;
  },

  /** Distância em metros entre uma vaga e uma coordenada. */
  distanceBetween(spot, latitude, longitude) {
    if (!spot || latitude == null || longitude == null) return null;
    return haversineDistance(latitude, longitude, spot.latitude, spot.longitude);
  },
};

export default ParkingModel;
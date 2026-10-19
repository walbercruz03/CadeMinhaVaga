/**
 * Configuração de mapa do app - MapLibre + OpenStreetMap.
 *
 * O estilo é um objeto MapLibre Style Specification v8 usando tiles raster
 * gratuitos do OpenStreetMap: funciona sem API key, sem billing e sem
 * cadastro em nenhum serviço (substituiu o Google Maps / react-native-maps).
 */
export const OSM_MAP_STYLE = {
  version: 8,
  name: 'openstreetmap',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#E8E4D8' },
    },
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

/** Centro aproximado do Brasil - usado antes do GPS fixar. */
export const DEFAULT_CENTER = { latitude: -14.235, longitude: -51.9253 };
export const DEFAULT_ZOOM = 4;
/** Zoom ao centralizar no usuário/vaga (bairro/rua). */
export const SPOT_ZOOM = 17;

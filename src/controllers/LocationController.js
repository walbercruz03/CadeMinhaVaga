/**
 * Camada de CONTROLLER - regras de GPS/localização.
 *
 * Envolve o expo-location (permissões, posição atual, acompanhamento em
 * tempo real) e a construção de regiões de mapa/URLs de rota externa.
 */
import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

/** Converte a resposta do expo-location para uma coordenada simples. */
export function toCoordinate(position) {
  const { coords, timestamp } = position;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? null,
    timestamp: timestamp ?? Date.now(),
  };
}

export const LocationController = {
  /** Status atual da permissão de localização ('granted' | 'denied' | 'undetermined'). */
  async getPermissionStatus() {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  },

  /** Solicita a permissão de localização (só pergunta se ainda não decidiu). */
  async requestPermission() {
    const current = await this.getPermissionStatus();
    if (current === 'granted' || current === 'denied') return current;
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  },

  /**
   * Obtém a posição atual do usuário com cadeia de fallbacks:
   * 1) GPS de alta precisão → 2) precisão balanceada → 3) última posição conhecida.
   * Assim funciona melhor em emuladores e ambientes sem fix de GPS.
   */
  async getCurrentPosition() {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      return toCoordinate(position);
    } catch (highError) {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
        return toCoordinate(position);
      } catch (balancedError) {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) return toCoordinate(lastKnown);
        throw balancedError;
      }
    }
  },

  /**
   * Acompanha a posição do usuário em tempo real.
   * Retorna uma subscription (com `.remove()`) - observe que é uma Promise.
   */
  async watchPosition(onCoordinate) {
    return Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (position) => onCoordinate(toCoordinate(position))
    );
  },

  /** Região de mapa centrada em uma coordenada. */
  buildRegion(coord, delta = 0.008) {
    if (!coord) return null;
    return {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  },

  /** Região de mapa que enquadra a posição atual e a vaga salva. */
  buildRegionBetween(a, b) {
    const coords = [a, b].filter(Boolean);
    if (coords.length === 0) return null;
    if (coords.length === 1) return this.buildRegion(coords[0], 0.01);

    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.005),
      longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.005),
    };
  },

  /** URL de rota a pé para o app de mapas nativo da plataforma. */
  buildRouteUrl(destination) {
    const { latitude, longitude } = destination;
    if (Platform.OS === 'ios') {
      return `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
  },

  /** Abre o app de mapas nativo com a rota até a vaga. Lança erro se falhar. */
  async openExternalRoute(destination) {
    const url = this.buildRouteUrl(destination);
    await Linking.openURL(url);
    return url;
  },
};

export default LocationController;
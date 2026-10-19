/**
 * Tela de rota - mostra o usuário e a vaga no mapa, a distância
 * e um botão gigante "VER ROTA" que abre o app de mapas nativo.
 *
 * Mapa: MapLibre + OpenStreetMap (gratuito, sem API key).
 */
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  NativeUserLocation,
} from '@maplibre/maplibre-react-native';

import parkingController, {
  formatDistance,
  useParkingState,
} from '../controllers/ParkingController';
import LocationController from '../controllers/LocationController';
import BigButton from './components/BigButton';
import MapPin from './components/MapPin';
import { colors, shadows } from './theme';
import { DEFAULT_CENTER, OSM_MAP_STYLE } from './mapStyle';

/** Zoom aproximado conforme a distância entre usuário e vaga. */
function zoomForDistance(meters) {
  if (meters == null) return 15;
  if (meters < 120) return 16.5;
  if (meters < 500) return 15;
  if (meters < 2000) return 13.5;
  return 11.5;
}

export default function RouteScreen({ navigation }) {
  const { latestSpot, currentLocation, distanceMeters, permissionStatus } = useParkingState();
  const [opening, setOpening] = useState(false);

  const handleOpenRoute = async () => {
    setOpening(true);
    try {
      await LocationController.openExternalRoute(latestSpot);
    } catch (error) {
      Alert.alert(
        'Não foi possível abrir a rota',
        'Verifique se você tem um app de mapas (Google Maps / Apple Maps) instalado.'
      );
    } finally {
      setOpening(false);
    }
  };

  const handleRefresh = async () => {
    await parkingController.refreshLocation();
    parkingController.recomputeDistance();
  };

  const showUser = permissionStatus === 'granted' && !!currentLocation;

  // Enquadra usuário + vaga no mapa (ou só um dos dois, se existir).
  const cameraCenter = useMemo(() => {
    const points = [currentLocation, latestSpot].filter(Boolean);
    if (points.length === 0) return [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude];
    const lng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    const lat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    return [lng, lat];
  }, [currentLocation, latestSpot]);

  const routeLine = useMemo(
    () =>
      showUser && latestSpot
        ? {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [currentLocation.longitude, currentLocation.latitude],
                [latestSpot.longitude, latestSpot.latitude],
              ],
            },
            properties: {},
          }
        : null,
    [currentLocation, latestSpot, showUser]
  );

  // Hooks acima sempre executam; retorno condicional vem depois.
  if (!latestSpot) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🗺️</Text>
        <Text style={styles.emptyTitle}>Nenhuma vaga para traçar a rota</Text>
        <Text style={styles.emptyText}>
          Salve uma vaga primeiro para ver o caminho de volta até o seu carro.
        </Text>
        <BigButton
          title="📍 SALVAR VAGA AGORA"
          onPress={() => navigation.navigate('SaveSpot')}
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Map style={styles.map} mapStyle={OSM_MAP_STYLE}>
        <Camera
          center={cameraCenter}
          zoom={zoomForDistance(distanceMeters)}
          duration={400}
        />
        {showUser ? <NativeUserLocation /> : null}
        <Marker
          lngLat={[latestSpot.longitude, latestSpot.latitude]}
          anchor="bottom"
        >
          <View style={styles.markerBox}>
            <MapPin emoji="🅿️" color={colors.danger} />
            <Text numberOfLines={1} style={styles.markerLabel}>
              {latestSpot.label}
            </Text>
          </View>
        </Marker>
        {routeLine ? (
          <GeoJSONSource data={routeLine}>
            <Layer
              type="line"
              paint={{
                'line-color': colors.success,
                'line-width': 4,
                'line-dasharray': [8, 6],
              }}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>📍 {latestSpot.label}</Text>
        <Text style={styles.distance}>
          {distanceMeters != null
            ? `${formatDistance(distanceMeters)} até o seu carro`
            : 'Distância indisponível - ative o GPS'}
        </Text>

        <BigButton
          title="🧭 VER ROTA"
          subtitle="Abrir rota a pé no app de mapas"
          color={colors.success}
          onPress={handleOpenRoute}
          disabled={opening}
        />

        <View style={styles.row}>
          <BigButton
            title="ATUALIZAR POSIÇÃO"
            icon="🎯"
            color={colors.primary}
            onPress={handleRefresh}
            style={styles.rowButton}
          />
          <BigButton
            title="NOVA VAGA"
            icon="🅿️"
            color={colors.primaryDark}
            onPress={() => navigation.navigate('SaveSpot')}
            style={styles.rowButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  markerBox: {
    alignItems: 'center',
  },
  markerLabel: {
    marginTop: 2,
    maxWidth: 140,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.card,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  panelTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  distance: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowButton: {
    flex: 1,
    minHeight: 60,
    paddingHorizontal: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    backgroundColor: colors.background,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
});
/**
 * Tela de rota - mostra o usuário e a vaga no mapa, a distância
 * e um botão gigante "VER ROTA" que abre o app de mapas nativo.
 */
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import parkingController, {
  formatDistance,
  useParkingState,
} from '../controllers/ParkingController';
import LocationController from '../controllers/LocationController';
import BigButton from './components/BigButton';
import { colors, shadows } from './theme';

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

  const region = LocationController.buildRegionBetween(currentLocation, latestSpot);
  const showUser = permissionStatus === 'granted' && currentLocation;

  return (
    <View style={styles.flex}>
      <MapView style={styles.map} initialRegion={region}>
        <Marker
          coordinate={{ latitude: latestSpot.latitude, longitude: latestSpot.longitude }}
          title={latestSpot.label}
          description="Sua vaga salva"
          pinColor="red"
        />
        {showUser ? (
          <Marker
            coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
            title="Você"
            description="Sua posição atual"
            pinColor="blue"
          />
        ) : null}
        {showUser ? (
          <Polyline
            coordinates={[
              { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
              { latitude: latestSpot.latitude, longitude: latestSpot.longitude },
            ]}
            strokeColor={colors.success}
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        ) : null}
      </MapView>

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
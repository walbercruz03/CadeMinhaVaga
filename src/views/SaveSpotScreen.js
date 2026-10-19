/**
 * Tela de salvar vaga - mapa centrado no usuário, marcador ajustável
 * (toque no mapa) e botão gigante "SALVAR VAGA".
 *
 * Mapa: MapLibre + OpenStreetMap (gratuito, sem API key).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Camera,
  Map,
  Marker,
  NativeUserLocation,
} from '@maplibre/maplibre-react-native';

import parkingController, { useParkingState } from '../controllers/ParkingController';
import BigButton from './components/BigButton';
import MapPin from './components/MapPin';
import { colors, shadows } from './theme';
import { DEFAULT_CENTER, OSM_MAP_STYLE, SPOT_ZOOM } from './mapStyle';

export default function SaveSpotScreen({ navigation }) {
  const { currentLocation, permissionStatus, canAskAgain, loading, latestSpot, error } = useParkingState();
  const [label, setLabel] = useState('Minha vaga');
  const [marker, setMarker] = useState(currentLocation);
  const [markerTouched, setMarkerTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  // Centro da câmera: só muda quando o GPS chega / "minha localização" -
  // tocar no mapa move apenas o marcador, sem puxar a câmera.
  const [cameraCenter, setCameraCenter] = useState(null);

  // Região inicial sempre definida (GPS ou centro do Brasil como fallback).
  const initialCenter = useMemo(() => {
    const coord = cameraCenter ?? currentLocation ?? DEFAULT_CENTER;
    return [coord.longitude, coord.latitude];
  }, [cameraCenter, currentLocation]);

  // Ao receber a primeira posição, centraliza o mapa (se o usuário não mexeu).
  useEffect(() => {
    if (!currentLocation || markerTouched || marker) return;
    setMarker(currentLocation);
    setCameraCenter(currentLocation);
  }, [currentLocation, markerTouched, marker]);

  const handleMapPress = (event) => {
    const [longitude, latitude] = event.nativeEvent.lngLat;
    setMarker({ latitude, longitude });
    setMarkerTouched(true);
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const coord = await parkingController.refreshLocation();
      if (coord) {
        setMarker(coord);
        setMarkerTouched(false);
        setCameraCenter(coord);
        return;
      }
      // Falhou: mostra o motivo exato vindo do controller (permissão, GPS, provedor...)
      const denied = permissionStatus !== 'granted';
      Alert.alert(
        denied ? 'Localização bloqueada' : 'Não consegui ler o GPS',
        denied
          ? 'Libere a permissão de localização para usar este recurso (botão abaixo ou Ajustes do app).'
          : `${error ?? 'A posição atual não está disponível.'}\n\nDicas:\n• Ative a localização do aparelho (Modo Alta precisão).\n• Emulador Android: Extended Controls (⋯) → Location → defina um ponto.\n• Simulador iOS: Features → Location.`
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    try {
      const spot = await parkingController.saveSpot(label, marker);
      Alert.alert('Vaga salva! 🅿️', `"${spot.label}" foi registrada com sucesso.`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      Alert.alert('Ops', error?.message ?? 'Não foi possível salvar a vaga.');
    }
  };

  const permissionDenied = permissionStatus === 'denied';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Map style={styles.map} mapStyle={OSM_MAP_STYLE} onPress={handleMapPress}>
        <Camera center={initialCenter} zoom={SPOT_ZOOM} duration={400} />
        {permissionStatus === 'granted' ? <NativeUserLocation /> : null}
        {marker ? (
          <Marker
            lngLat={[marker.longitude, marker.latitude]}
            anchor="bottom"
          >
            <View style={styles.markerBox}>
              <MapPin emoji="🅿️" color={colors.danger} />
              <Text numberOfLines={1} style={styles.markerLabel}>
                {label || 'Minha vaga'}
              </Text>
            </View>
          </Marker>
        ) : null}
      </Map>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Onde você estacionou?</Text>
        <Text style={styles.hint}>
          Toque no mapa para ajustar o ponto exato da vaga.
        </Text>

        {permissionDenied ? (
          <View style={styles.deniedBox}>
            <Text style={styles.deniedText}>
              {canAskAgain
                ? 'Localização bloqueada. Toque no botão abaixo para permitir o acesso ao GPS.'
                : 'Localização bloqueada. Libere a permissão nas configurações do aparelho para continuar.'}
            </Text>
            {canAskAgain ? (
              <BigButton
                title="PERMITIR LOCALIZAÇÃO"
                icon="✅"
                color={colors.warning}
                onPress={() => parkingController.requestAccess()}
              />
            ) : null}
            <BigButton
              title="ABRIR AJUSTES DO APARELHO"
              icon="⚙️"
              color={colors.primaryDark}
              onPress={() => Linking.openSettings().catch(() => null)}
              style={styles.secondaryButton}
            />
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder='Ex.: "Shopping P3 - 2º andar"'
          placeholderTextColor={colors.muted}
          maxLength={60}
          returnKeyType="done"
        />

        <BigButton
          title="📍 SALVAR VAGA"
          subtitle={marker ? 'Registra a localização do seu carro' : 'Aguardando o GPS…'}
          onPress={handleSave}
          disabled={!marker || loading}
          style={styles.saveButton}
        />

        <BigButton
          title={locating ? '⏳ LOCALIZANDO…' : 'USAR MINHA LOCALIZAÇÃO ATUAL'}
          icon="🎯"
          color={colors.primaryDark}
          onPress={useMyLocation}
          disabled={locating}
          style={styles.secondaryButton}
        />

        {latestSpot ? (
          <BigButton
            title="VER ROTA PARA A ÚLTIMA VAGA"
            icon="🧭"
            color={colors.success}
            onPress={() => navigation.navigate('Route')}
            style={styles.secondaryButton}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
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
    gap: 10,
    ...shadows.card,
  },
  panelTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  deniedBox: {
    gap: 10,
  },
  deniedText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  saveButton: {
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 56,
  },
});